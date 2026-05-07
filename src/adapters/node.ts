import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { Socket } from 'node:net';
import { Orva, EnhancedRequest, FastResponse } from '../core/index.js';

export interface NodeServerOptions {
  hostname?: string;
  port: number;
}

type NodeHeadersShape = IncomingMessage['headers'];

class NodeHeadersFacade {
  constructor(private readonly headers: NodeHeadersShape) {}

  get(name: string): string | null {
    const value = this.headers[name.toLowerCase()];
    if (Array.isArray(value)) return value.join(', ');
    return value ?? null;
  }

  has(name: string): boolean {
    return this.headers[name.toLowerCase()] !== undefined;
  }

  *entries(): IterableIterator<[string, string]> {
    for (const [key, value] of Object.entries(this.headers)) {
      if (value === undefined) continue;
      yield [key, Array.isArray(value) ? value.join(', ') : value];
    }
  }

  forEach(callback: (value: string, key: string, parent: NodeHeadersFacade) => void): void {
    for (const [key, value] of this.entries()) {
      callback(value, key, this);
    }
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }
}

interface NodeBodySource {
  promise: Promise<Buffer> | null;
  buffer: Buffer | null;
  used: boolean;
}

const NEVER_ABORTED_SIGNAL = new AbortController().signal;

function shouldReadBody(method: string | undefined): boolean {
  return method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
}

function readNodeBody(req: IncomingMessage, source: NodeBodySource): Promise<Buffer> {
  if (!shouldReadBody(req.method)) {
    source.used = true;
    source.buffer = Buffer.alloc(0);
    return Promise.resolve(source.buffer);
  }

  if (source.buffer) {
    source.used = true;
    return Promise.resolve(source.buffer);
  }

  if (source.promise) {
    source.used = true;
    return source.promise;
  }

  source.used = true;
  source.promise = new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      source.buffer = Buffer.concat(chunks);
      resolve(source.buffer);
    });
    req.on('error', reject);
  });
  return source.promise;
}

class NodeRequestAdapter implements EnhancedRequest {
  readonly __orvaEnhancedRequest__ = true as const;
  readonly __orvaMethod__: string;
  readonly __orvaPathname__: string;
  readonly __orvaSearch__: string;
  private headersFacade: NodeHeadersFacade | null = null;
  private jsonCache?: unknown;
  private textCache?: string;
  private formDataCache?: FormData;

  constructor(
    private readonly req: IncomingMessage,
    readonly url: string,
    method: string,
    pathname: string,
    search: string,
    private bodySource: NodeBodySource | null = null,
  ) {
    this.__orvaMethod__ = method;
    this.__orvaPathname__ = pathname;
    this.__orvaSearch__ = search;
  }

  get method(): string {
    return this.__orvaMethod__;
  }

  get headers(): Headers {
    return (this.headersFacade ??= new NodeHeadersFacade(this.req.headers)) as unknown as Headers;
  }

  get body(): Request['body'] {
    return shouldReadBody(this.req.method)
      ? Readable.toWeb(this.req) as unknown as Request['body']
      : null;
  }

  get bodyUsed(): boolean {
    return this.bodySource?.used ?? false;
  }

  get cache(): RequestCache { return 'default'; }
  get credentials(): RequestCredentials { return 'same-origin'; }
  get destination(): RequestDestination { return ''; }
  get integrity(): string { return ''; }
  get keepalive(): boolean { return false; }
  get mode(): RequestMode { return 'cors'; }
  get redirect(): RequestRedirect { return 'follow'; }
  get referrer(): string { return 'about:client'; }
  get referrerPolicy(): ReferrerPolicy { return ''; }
  get signal(): AbortSignal { return NEVER_ABORTED_SIGNAL; }
  get duplex(): unknown { return 'half'; }
  get [Symbol.toStringTag](): string { return 'Request'; }

  clone(): Request {
    const bodySource = this.ensureBodySource();
    return new NodeRequestAdapter(
      this.req,
      this.url,
      this.__orvaMethod__,
      this.__orvaPathname__,
      this.__orvaSearch__,
      bodySource,
    ) as unknown as Request;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const buffer = await readNodeBody(this.req, this.ensureBodySource());
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  }

  async blob(): Promise<Blob> {
    const buffer = await readNodeBody(this.req, this.ensureBodySource());
    return new Blob([new Uint8Array(buffer)]);
  }

  async bytes(): Promise<Uint8Array<ArrayBuffer>> {
    const buffer = await readNodeBody(this.req, this.ensureBodySource());
    return new Uint8Array(
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer,
    );
  }

  async text(): Promise<string> {
    if (typeof this.textCache === 'string') return this.textCache;
    if (this.jsonCache !== undefined) {
      this.textCache = JSON.stringify(this.jsonCache);
      return this.textCache;
    }
    this.textCache = (await readNodeBody(this.req, this.ensureBodySource())).toString('utf8');
    return this.textCache;
  }

  async json(): Promise<unknown> {
    if (this.jsonCache !== undefined) return this.jsonCache;
    const text = await this.text();
    this.jsonCache = JSON.parse(text);
    return this.jsonCache;
  }

  async formData(): Promise<FormData> {
    if (this.formDataCache) return this.formDataCache;
    const buffer = await readNodeBody(this.req, this.ensureBodySource());
    const request = new Request(this.url, {
      method: this.method,
      headers: Object.fromEntries((this.headersFacade ??= new NodeHeadersFacade(this.req.headers)).entries()),
      body: shouldReadBody(this.req.method) ? new Uint8Array(buffer) : null,
      duplex: 'half',
    } as RequestInit);
    this.formDataCache = await request.formData();
    return this.formDataCache;
  }

  private ensureBodySource(): NodeBodySource {
    return this.bodySource ??= {
      promise: null,
      buffer: null,
      used: false,
    };
  }
}

function writeFastHeaders(res: ServerResponse, headers?: HeadersInit): void {
  if (!headers) return;
  if (headers instanceof Headers) {
    const setCookies = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.();
    headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'set-cookie') {
        res.setHeader(key, value);
      }
    });
    if (setCookies?.length) {
      res.setHeader('Set-Cookie', setCookies);
    }
    return;
  }
  if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      if (key.toLowerCase() === 'set-cookie') {
        const existing = res.getHeader('Set-Cookie');
        if (existing === undefined) {
          res.setHeader('Set-Cookie', value);
        } else if (Array.isArray(existing)) {
          res.setHeader('Set-Cookie', [...existing.map(String), value]);
        } else {
          res.setHeader('Set-Cookie', [String(existing), value]);
        }
      } else {
        res.setHeader(key, value);
      }
    }
    return;
  }
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined) {
      res.setHeader(key, value);
    }
  }
}

async function writeResponse(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;
  res.statusMessage = response.statusText;

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      const existing = res.getHeader(key);
      if (existing === undefined) {
        res.setHeader(key, value);
      } else if (Array.isArray(existing)) {
        res.setHeader(key, [...existing.map(String), value]);
      } else {
        res.setHeader(key, [String(existing), value]);
      }
    } else {
      res.setHeader(key, value);
    }
  });

  if (response.body) {
    const reader = response.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    } finally {
      reader.releaseLock();
    }
  }

  res.end();
}

function createNodeRequest(req: IncomingMessage, opts: NodeServerOptions): EnhancedRequest {
  const host = req.headers.host || opts.hostname || 'localhost';
  const protocol = (req.socket as Socket & { encrypted?: boolean })?.encrypted ? 'https' : 'http';
  const target = req.url || '/';
  const queryIndex = target.indexOf('?');
  const hashIndex = target.indexOf('#');
  const pathnameEnd = queryIndex >= 0
    ? queryIndex
    : hashIndex >= 0
      ? hashIndex
      : target.length;
  let pathname = target.slice(0, pathnameEnd) || '/';
  const search = queryIndex >= 0
    ? target.slice(queryIndex, hashIndex >= 0 ? hashIndex : target.length)
    : '';
  if (pathname !== '/' && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1) || '/';
  }
  const url = `${protocol}://${host}${target}`;
  return new NodeRequestAdapter(
    req,
    url,
    (req.method ?? 'GET').toUpperCase(),
    pathname,
    search,
  );
}

export function serveNode<T extends object>(
  app: Orva<T>,
  options: NodeServerOptions | number,
  callback?: () => void
): ReturnType<typeof createServer> {
  const opts: NodeServerOptions = typeof options === 'number'
    ? { port: options }
    : options;

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const request = createNodeRequest(req, opts);
      const response = await app.fetchRaw(request);

      if (response instanceof Response) {
        await writeResponse(res, response);
        return;
      }

      res.statusCode = response.status;
      writeFastHeaders(res, (response as FastResponse).getHeadersInit());

      if (response.kind === 'json') {
        res.end(JSON.stringify(response.body));
        return;
      }

      if (response.kind === 'text') {
        res.end(response.body as string);
        return;
      }

      res.end();
    } catch (err) {
      console.error('[Orva Adapter] Error:', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      } else {
        res.end();
      }
    }
  });

  server.listen(opts.port, opts.hostname, callback);
  return server;
}

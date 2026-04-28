import type { MiddlewareHandler } from '../orva.js';
import type { CompressOptions, MiddlewareVars } from './shared.js';

function isCompressibleContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const value = contentType.toLowerCase();
  return value.startsWith('text/')
    || value.includes('json')
    || value.includes('javascript')
    || value.includes('xml')
    || value.includes('svg')
    || value.includes('wasm');
}

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

function chooseEncoding(
  acceptEncoding: string | null,
  supported: Array<'br' | 'gzip' | 'deflate'>
): 'br' | 'gzip' | 'deflate' | null {
  if (!acceptEncoding) return null;
  const normalized = acceptEncoding.toLowerCase();
  for (const encoding of supported) {
    if (normalized.includes(encoding)) {
      return encoding;
    }
  }
  return normalized.includes('*') ? supported[0] ?? null : null;
}

async function compressWithStream(
  body: Uint8Array,
  encoding: 'gzip' | 'deflate'
): Promise<Uint8Array | null> {
  if (typeof CompressionStream === 'undefined') {
    return null;
  }

  const stream = new Blob([toArrayBuffer(body)])
    .stream()
    .pipeThrough(new CompressionStream(encoding));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

async function compressWithNode(
  body: Uint8Array,
  encoding: 'br' | 'gzip' | 'deflate'
): Promise<Uint8Array | null> {
  try {
    const zlib = await import('node:zlib');
    if (encoding === 'br') {
      return zlib.brotliCompressSync(body);
    }
    return encoding === 'gzip'
      ? zlib.gzipSync(body)
      : zlib.deflateSync(body);
  } catch {
    return null;
  }
}

async function compressBytes(
  body: Uint8Array,
  encoding: 'br' | 'gzip' | 'deflate'
): Promise<Uint8Array | null> {
  return encoding === 'br'
    ? await compressWithNode(body, encoding)
    : await compressWithStream(body, encoding) ?? await compressWithNode(body, encoding);
}

export function compress<T extends object = MiddlewareVars>(
  options: CompressOptions<T> = {}
): MiddlewareHandler<T> {
  const threshold = options.threshold ?? 1024;
  const encodings = options.encodings ?? ['br', 'gzip', 'deflate'];

  return async (context, next) => {
    context.after(async (response) => {
      if (context.req.method.toUpperCase() === 'HEAD') return response;
      if (!response.body || response.headers.has('Content-Encoding')) return response;
      if (response.status === 204 || response.status === 304) return response;
      if (!isCompressibleContentType(response.headers.get('Content-Type'))) return response;
      if (options.filter && !options.filter(response, context)) return response;

      const encoding = chooseEncoding(context.req.headers.get('Accept-Encoding'), encodings);
      if (!encoding) return response;

      const body = new Uint8Array(await response.clone().arrayBuffer());
      if (body.byteLength < threshold) return response;

      const compressed = await compressBytes(body, encoding);
      if (!compressed || compressed.byteLength >= body.byteLength) return response;

      const headers = new Headers(response.headers);
      headers.set('Content-Encoding', encoding);
      headers.delete('Content-Length');
      const vary = headers.get('Vary');
      headers.set('Vary', vary ? `${vary}, Accept-Encoding` : 'Accept-Encoding');

      return new Response(toArrayBuffer(compressed), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    });
    await next();
  };
}

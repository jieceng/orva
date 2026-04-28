import { Nano } from '../nano.js';
import {
  AdapterBinaryOptions,
  appendHeaderValues,
  decodeRequestBody,
  encodeResponseBody,
  headersToObject,
} from './shared.js';

export interface AzureInvocationContext {
  invocationId?: string;
}

export interface AzureHttpRequest {
  method: string;
  url: string;
  headers?: Headers | Record<string, string | undefined>;
  body?: string | Uint8Array | ArrayBuffer | null;
  params?: Record<string, string>;
  query?: URLSearchParams | Record<string, string>;
  text?: () => Promise<string>;
  arrayBuffer?: () => Promise<ArrayBuffer>;
}

export interface AzureHttpResponseInit {
  status: number;
  headers?: Record<string, string>;
  body?: string;
  isBase64Encoded?: boolean;
}

export interface AzureFunctionOptions extends AdapterBinaryOptions {}

async function normalizeBody(request: AzureHttpRequest): Promise<BodyInit | undefined> {
  if (request.arrayBuffer) {
    const body = await request.arrayBuffer();
    return body.byteLength ? new Blob([body]) : undefined;
  }

  if (request.text) {
    const text = await request.text();
    return text || undefined;
  }

  if (request.body instanceof Uint8Array) {
    if (!request.body.byteLength) return undefined;
    const copy = new Uint8Array(request.body.byteLength);
    copy.set(request.body);
    return new Blob([copy.buffer]);
  }
  if (request.body instanceof ArrayBuffer) {
    return request.body.byteLength ? new Blob([request.body]) : undefined;
  }
  if (typeof request.body === 'string') return request.body;
  return undefined;
}

function normalizeHeaders(input?: Headers | Record<string, string | undefined>): Headers {
  if (input instanceof Headers) {
    return new Headers(input);
  }

  const headers = new Headers();
  appendHeaderValues(headers, input ?? null);
  return headers;
}

function createRequest(request: Request | AzureHttpRequest): Promise<Request> | Request {
  if (request instanceof Request) {
    return request;
  }

  const query = request.query instanceof URLSearchParams
    ? request.query.toString()
    : request.query
      ? new URLSearchParams(request.query).toString()
      : '';

  const url = query && !request.url.includes('?')
    ? `${request.url}?${query}`
    : request.url;

  return normalizeBody(request).then((body) => new Request(url, {
    method: request.method,
    headers: normalizeHeaders(request.headers),
    body,
  }));
}

export function createAzureFunctionHandler<T extends object>(
  app: Nano<T>,
  options: AzureFunctionOptions = {}
): (request: Request | AzureHttpRequest, context?: AzureInvocationContext) => Promise<AzureHttpResponseInit> {
  return async (request: Request | AzureHttpRequest, _context?: AzureInvocationContext) => {
    const response = await app.fetch(await createRequest(request));
    const payload = await encodeResponseBody(response, options);

    return {
      status: response.status,
      headers: headersToObject(response.headers),
      body: payload.body,
      isBase64Encoded: payload.isBase64Encoded,
    };
  };
}

export function createAzureFetchHandler<T extends object>(
  app: Nano<T>
): (request: Request) => Promise<Response> {
  return (request: Request) => Promise.resolve(app.fetch(request));
}

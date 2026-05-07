import type { StatusCode } from './types.js';

export class FastResponse {
  readonly __orvaFastResponse__ = true;
  private headersValue: Headers | null = null;

  constructor(
    public readonly kind: 'text' | 'json' | 'empty',
    public readonly status: StatusCode,
    public readonly body: string | unknown | null,
    private headersInit?: HeadersInit,
  ) {}

  get headers(): Headers {
    return this.headersValue ??= new Headers(this.headersInit);
  }

  set headers(value: Headers) {
    this.headersValue = value;
    this.headersInit = value;
  }

  getHeadersInit(): HeadersInit | undefined {
    return this.headersValue ?? this.headersInit;
  }
}

export type InternalResponse = Response | FastResponse;

export const DEFAULT_JSON_HEADERS: HeadersInit = { 'Content-Type': 'application/json; charset=utf-8' };
export const DEFAULT_HTML_HEADERS: HeadersInit = { 'Content-Type': 'text/html; charset=utf-8' };
export const DEFAULT_TEXT_HEADERS: HeadersInit = { 'Content-Type': 'text/plain; charset=utf-8' };
export const DEFAULT_SSE_HEADERS: HeadersInit = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive'
};
export const DEFAULT_DOWNLOAD_HEADERS: HeadersInit = { 'Content-Type': 'application/octet-stream' };

export function createHeaders(
  defaultHeaders: HeadersInit,
  customHeaders?: HeadersInit
): HeadersInit {
  if (!customHeaders) return defaultHeaders;

  const headers = new Headers(defaultHeaders);
  copyHeaders(headers, customHeaders);
  return headers;
}

export function createFastHeaders(
  defaultHeaders: HeadersInit,
  customHeaders?: HeadersInit
) : HeadersInit {
  return createHeaders(defaultHeaders, customHeaders);
}

export function appendFastHeader(response: FastResponse, key: string, value: string): void {
  const headers = response.headers;
  if (key.toLowerCase() === 'set-cookie') {
    headers.append(key, value);
    return;
  }
  headers.set(key, value);
}

export function isFastResponse(value: unknown): value is FastResponse {
  return value instanceof FastResponse
    || (!!value && typeof value === 'object' && '__orvaFastResponse__' in value);
}

export function toStandardResponse(response: InternalResponse): Response {
  if (!isFastResponse(response)) return response;

  const headers = response.getHeadersInit();
  switch (response.kind) {
    case 'json':
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers,
      });
    case 'text':
      return new Response(response.body as string, {
        status: response.status,
        headers,
      });
    case 'empty':
    default:
      return new Response(null, {
        status: response.status,
        headers,
      });
  }
}

function copyHeaders(headers: Headers, source: HeadersInit): void {
  if (source instanceof Headers) {
    source.forEach((value, key) => headers.set(key, value));
    return;
  }

  if (Array.isArray(source)) {
    for (const [key, value] of source) {
      headers.set(key, value);
    }
    return;
  }

  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      headers.set(key, value.join(', '));
    } else if (value !== undefined) {
      headers.set(key, String(value));
    }
  }
}

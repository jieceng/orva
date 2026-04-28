// ============ RPC client implementation ============

import type { OrvaRPC, RPCRequestOptions, RPCResponse } from './types.js';
import type { Orva } from '../orva.js';

export interface RPCClientOptions {
  baseURL: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}

class OrvaRPCResponse<Status extends number = number, Body = unknown> implements RPCResponse<Status, Body> {
  private valuePromise?: Promise<Body>;
  private jsonPromise?: Promise<Body>;
  private textPromise?: Promise<string>;
  private formDataPromise?: Promise<FormData>;
  private arrayBufferPromise?: Promise<ArrayBuffer>;
  private blobPromise?: Promise<Blob>;

  constructor(public readonly raw: Response) {}

  get status(): Status {
    return this.raw.status as Status;
  }

  get ok(): RPCResponse<Status, Body>['ok'] {
    return this.raw.ok as RPCResponse<Status, Body>['ok'];
  }

  get headers(): Headers {
    return this.raw.headers;
  }

  get redirected(): boolean {
    return this.raw.redirected;
  }

  get type(): ResponseType {
    return this.raw.type;
  }

  get url(): string {
    return this.raw.url;
  }

  clone(): Response {
    return this.raw.clone();
  }

  json(): Promise<Body> {
    return this.jsonPromise ??= this.raw.clone().json() as Promise<Body>;
  }

  text(): Promise<string> {
    return this.textPromise ??= this.raw.clone().text();
  }

  formData(): Promise<FormData> {
    return this.formDataPromise ??= this.raw.clone().formData();
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return this.arrayBufferPromise ??= this.raw.clone().arrayBuffer();
  }

  blob(): Promise<Blob> {
    return this.blobPromise ??= this.raw.clone().blob();
  }

  value(): Promise<Body> {
    return this.valuePromise ??= this.readValue();
  }

  private async readValue(): Promise<Body> {
    if (this.status === 204 || this.status === 205 || this.status === 304) {
      return undefined as Body;
    }

    const contentType = this.headers.get('Content-Type')?.toLowerCase() ?? '';

    if (
      contentType.includes('application/json')
      || contentType.includes('+json')
    ) {
      return this.json();
    }

    if (contentType.includes('multipart/form-data')) {
      return await this.formData() as Body;
    }

    if (contentType.startsWith('text/') || contentType.includes('xml') || contentType.includes('application/x-www-form-urlencoded')) {
      return await this.text() as Body;
    }

    return await this.arrayBuffer() as Body;
  }
}

function isBodyInitLike(value: unknown): value is BodyInit {
  return value instanceof Blob
    || value instanceof ArrayBuffer
    || ArrayBuffer.isView(value)
    || value instanceof URLSearchParams
    || value instanceof ReadableStream
    || typeof value === 'string';
}

function toURLSearchParamsBody(value: unknown): URLSearchParams {
  if (value instanceof URLSearchParams) {
    return value;
  }

  const params = new URLSearchParams();
  if (value && typeof value === 'object') {
    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
      if (raw === undefined) continue;
      if (Array.isArray(raw)) {
        for (const item of raw) {
          params.append(key, String(item));
        }
        continue;
      }
      params.append(key, String(raw));
    }
  }
  return params;
}

function serializeRequestBody(
  body: unknown,
  headers: Headers
): BodyInit | undefined {
  if (body === undefined) return undefined;
  if (body instanceof FormData) return body;
  if (isBodyInitLike(body) && !(body instanceof URLSearchParams)) {
    if (typeof body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'text/plain');
    }
    return body;
  }

  const contentType = headers.get('Content-Type')?.toLowerCase() ?? '';

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return toURLSearchParamsBody(body);
  }

  if (contentType.startsWith('text/')) {
    return typeof body === 'string' ? body : String(body);
  }

  if (body instanceof URLSearchParams) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
    }
    return body;
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return JSON.stringify(body);
}

export function createRPC<T extends Orva<any>>(
  options: RPCClientOptions
): OrvaRPC<T> {
  const { baseURL, headers: defaultHeaders = {}, fetch: customFetch = fetch } = options;

  function createPathProxy(currentPath: string): any {
    return new Proxy(() => {}, {
      get(_target, prop: string) {
        // Handle HTTP methods ($get, $post, $put, $delete, $patch)
        if (prop.startsWith('$')) {
          const httpMethod = prop.slice(1).toUpperCase();
          
          return async (requestOptions: RPCRequestOptions = {}) => {
            let url = `${baseURL}${currentPath}`;
            
            // Replace path parameters
            if (requestOptions.param) {
              Object.entries(requestOptions.param).forEach(([key, value]) => {
                url = url.replace(`:${key}`, encodeURIComponent(String(value)));
              });
            }
            
            // Append query parameters
            if (requestOptions.query) {
              const searchParams = new URLSearchParams();
              Object.entries(requestOptions.query).forEach(([key, value]) => {
                searchParams.append(key, String(value));
              });
              url += `?${searchParams.toString()}`;
            }
            
            // Build request headers
            const headers = new Headers(defaultHeaders);
            if (requestOptions.headers) {
              Object.entries(requestOptions.headers).forEach(([key, value]) => {
                headers.set(key, String(value));
              });
            }
            if (requestOptions.cookie) {
              const cookieHeader = Object.entries(requestOptions.cookie)
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
                .join('; ');
              if (cookieHeader) {
                headers.set('Cookie', cookieHeader);
              }
            }
            
            // Build the request body
            const body = serializeRequestBody(requestOptions.body, headers);
            
            const response = await customFetch(url, {
              method: httpMethod,
              headers,
              body,
            });

            return new OrvaRPCResponse(response);
          };
        }
        
        // Handle path segments
        return createPathProxy(`${currentPath}/${prop}`);
      },
    });
  }

  return new Proxy({} as any, {
    get(_target, path: string) {
      return createPathProxy(path === '' ? '' : `/${path}`);
    },
  });
}

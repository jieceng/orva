// ============ RPC client implementation ============

import type { OrvaRPC, RPCRequestOptions } from './types.js';
import type { Orva } from '../orva.js';

export interface RPCClientOptions {
  baseURL: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
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
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`RPC Error ${response.status}: ${errorText}`);
            }
            
            const contentType = response.headers.get('Content-Type');
            if (contentType?.includes('application/json')) {
              return response.json();
            }
            return response.text();
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

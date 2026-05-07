import type { MiddlewareHandler } from '../core/index.js';
import type {
  CORSOptions,
  HeaderValueOptions,
  HTTPSRedirectOptions,
  MiddlewareVars,
  TrailingSlashOptions,
} from './shared.js';
import {
  appendVary,
  createStaticHeaderMiddleware,
  getRequestHeaderNames,
  resolveHeaders,
  sha1,
} from './shared.js';

export function poweredBy<T extends object = MiddlewareVars>(value = 'orva'): MiddlewareHandler<T> {
  return createStaticHeaderMiddleware<T>('X-Powered-By', value);
}

export function responseHeaders<T extends object = MiddlewareVars>(options: HeaderValueOptions<T>): MiddlewareHandler<T> {
  return async (context, next) => {
    const headers = resolveHeaders(options.headers, context);
    context.after((response) => {
      headers.forEach((value, key) => response.headers.set(key, value));
      return response;
    });
    await next();
  };
}

export function cacheControl<T extends object = MiddlewareVars>(value: string): MiddlewareHandler<T> {
  return createStaticHeaderMiddleware<T>('Cache-Control', value);
}

export function noStore<T extends object = MiddlewareVars>(): MiddlewareHandler<T> {
  return cacheControl<T>('no-store');
}

export function vary<T extends object = MiddlewareVars>(...values: string[]): MiddlewareHandler<T> {
  return async (context, next) => {
    context.after((response) => {
      values.forEach((value) => appendVary(response, value));
      return response;
    });
    await next();
  };
}

export function cors<T extends object = MiddlewareVars>(options: CORSOptions<T> = {}): MiddlewareHandler<T> {
  const methods = options.methods ?? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
  const allowOrigin = options.origin ?? '*';

  return async (context, next) => {
    const origin = context.req.headers.get('Origin');
    const resolvedOrigin = typeof allowOrigin === 'function'
      ? allowOrigin(origin, context)
      : Array.isArray(allowOrigin)
        ? (origin && allowOrigin.includes(origin) ? origin : null)
        : allowOrigin;

    const applyHeaders = (response: Response): Response => {
      if (resolvedOrigin === true) {
        if (origin) response.headers.set('Access-Control-Allow-Origin', origin);
      } else if (typeof resolvedOrigin === 'string') {
        response.headers.set('Access-Control-Allow-Origin', resolvedOrigin);
      }

      if (options.credentials) response.headers.set('Access-Control-Allow-Credentials', 'true');
      if (methods.length) response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
      if (options.allowedHeaders?.length) {
        response.headers.set('Access-Control-Allow-Headers', options.allowedHeaders.join(', '));
      } else {
        const requestedHeaders = getRequestHeaderNames(context.req);
        if (requestedHeaders.length) {
          response.headers.set('Access-Control-Allow-Headers', requestedHeaders.join(', '));
        }
      }
      if (options.exposedHeaders?.length) {
        response.headers.set('Access-Control-Expose-Headers', options.exposedHeaders.join(', '));
      }
      if (typeof options.maxAge === 'number') {
        response.headers.set('Access-Control-Max-Age', String(options.maxAge));
      }
      appendVary(response, 'Origin');
      return response;
    };

    context.after((response) => applyHeaders(response));

    if (context.req.method.toUpperCase() === 'OPTIONS') {
      return applyHeaders(new Response(null, { status: 204 }));
    }

    await next();
  };
}

export function httpsRedirect<T extends object = MiddlewareVars>(options: HTTPSRedirectOptions = {}): MiddlewareHandler<T> {
  const status = options.status ?? 308;
  const trustProxy = options.trustProxy ?? true;

  return async (context, next) => {
    const forwardedProto = trustProxy ? context.req.headers.get('x-forwarded-proto') : null;
    const isHttp = context.url.protocol === 'http:' || forwardedProto === 'http';
    if (isHttp) {
      const target = new URL(context.url.toString());
      target.protocol = 'https:';
      return context.redirect(target, status);
    }
    await next();
  };
}

export function trailingSlash<T extends object = MiddlewareVars>(options: TrailingSlashOptions = {}): MiddlewareHandler<T> {
  const mode = options.mode ?? 'remove';
  const status = options.status ?? 308;

  return async (context, next) => {
    const pathname = context.url.pathname;
    if (pathname === '/') {
      await next();
      return;
    }

    if (mode === 'remove' && pathname.endsWith('/')) {
      const target = new URL(context.url.toString());
      target.pathname = pathname.replace(/\/+$/, '');
      return context.redirect(target, status);
    }

    if (mode === 'add' && !pathname.endsWith('/')) {
      const target = new URL(context.url.toString());
      target.pathname = `${pathname}/`;
      return context.redirect(target, status);
    }

    await next();
  };
}

export function etag<T extends object = MiddlewareVars>(): MiddlewareHandler<T> {
  return async (context, next) => {
    context.after(async (response) => {
      if (!['GET', 'HEAD'].includes(context.req.method.toUpperCase()) || !response.body) {
        return response;
      }

      const body = await response.clone().arrayBuffer();
      const tag = `"${await sha1(body)}"`;
      response.headers.set('ETag', tag);

      const ifNoneMatch = context.req.headers.get('If-None-Match');
      if (ifNoneMatch && ifNoneMatch === tag) {
        const headers = new Headers(response.headers);
        return new Response(null, { status: 304, headers });
      }

      return response;
    });
    await next();
  };
}

export function responseTag<T extends object = MiddlewareVars>(name: string, value: string): MiddlewareHandler<T> {
  return createStaticHeaderMiddleware<T>(name, value);
}

export function contentType<T extends object = MiddlewareVars>(type: string): MiddlewareHandler<T> {
  return async (context, next) => {
    context.after((response) => {
      if (!response.headers.get('Content-Type')) {
        response.headers.set('Content-Type', type);
      }
      return response;
    });
    await next();
  };
}

export function checksum<T extends object = MiddlewareVars>(headerName = 'X-Body-SHA1'): MiddlewareHandler<T> {
  return async (context, next) => {
    context.after(async (response) => {
      if (!response.body) return response;
      const body = await response.clone().arrayBuffer();
      response.headers.set(headerName, await sha1(body));
      return response;
    });
    await next();
  };
}

export function responseChecksumTrailer<T extends object = MiddlewareVars>(headerName = 'Digest'): MiddlewareHandler<T> {
  return async (context, next) => {
    context.after(async (response) => {
      if (!response.body) return response;
      const body = await response.clone().arrayBuffer();
      const digest = await sha1(body);
      response.headers.set(headerName, `sha-1=${digest}`);
      return response;
    });
    await next();
  };
}

export function contentLength<T extends object = MiddlewareVars>(): MiddlewareHandler<T> {
  return async (context, next) => {
    context.after(async (response) => {
      if (response.headers.has('Content-Length') || !response.body) return response;
      const body = new Uint8Array(await response.clone().arrayBuffer());
      response.headers.set('Content-Length', String(body.byteLength));
      return response;
    });
    await next();
  };
}

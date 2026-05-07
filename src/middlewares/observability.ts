import type { MiddlewareHandler } from '../core/index.js';
import type {
  LoggerOptions,
  MiddlewareVars,
  RequestIdOptions,
  ResponseTimeOptions,
} from './shared.js';
import { getClientIpFromHeaders, setVar, shouldCheckBody } from './shared.js';

export function logger<T extends object = MiddlewareVars>(options: LoggerOptions<T> = {}): MiddlewareHandler<T> {
  const log = options.log ?? ((message: string) => console.log(message));
  return async (context, next) => {
    const start = Date.now();
    const suffix = options.includeQuery && context.url.search ? context.url.search : '';
    log(`${context.req.method} ${context.url.pathname}${suffix} start`, context);
    try {
      await next();
      log(`${context.req.method} ${context.url.pathname} done ${Date.now() - start}ms`, context);
    } catch (error) {
      log(`${context.req.method} ${context.url.pathname} error ${Date.now() - start}ms`, context);
      throw error;
    }
  };
}

export function requestId<T extends object = MiddlewareVars>(options: RequestIdOptions = {}): MiddlewareHandler<T> {
  const headerName = options.headerName ?? 'X-Request-Id';
  const contextKey = options.contextKey ?? 'requestId';
  const generator = options.generator ?? (() => crypto.randomUUID());
  const exposeHeader = options.exposeHeader ?? true;
  const overwrite = options.overwrite ?? false;

  return async (context, next) => {
    const incoming = context.req.headers.get(headerName);
    const value = !overwrite && incoming ? incoming : generator();
    setVar(context, contextKey, value);
    if (exposeHeader) {
      context.after((response) => {
        response.headers.set(headerName, value);
        return response;
      });
    }
    await next();
  };
}

export function responseTime<T extends object = MiddlewareVars>(options: ResponseTimeOptions = {}): MiddlewareHandler<T> {
  const headerName = options.headerName ?? 'X-Response-Time';
  const precision = options.precision ?? 2;
  const suffix = options.suffix ?? 'ms';

  return async (context, next) => {
    const start = performance.now();
    context.after((response) => {
      response.headers.set(headerName, `${(performance.now() - start).toFixed(precision)}${suffix}`);
      return response;
    });
    await next();
  };
}

export function requestMeta<T extends object = MiddlewareVars>(): MiddlewareHandler<T> {
  return async (context, next) => {
    setVar(context, 'request', {
      method: context.req.method,
      path: context.url.pathname,
      query: context.query,
      headers: Object.fromEntries(context.req.headers.entries()),
    });
    await next();
  };
}

export function userAgent<T extends object = MiddlewareVars>(contextKey = 'userAgent'): MiddlewareHandler<T> {
  return async (context, next) => {
    setVar(context, contextKey, context.req.headers.get('User-Agent') ?? '');
    await next();
  };
}

export function clientIp<T extends object = MiddlewareVars>(contextKey = 'ip'): MiddlewareHandler<T> {
  return async (context, next) => {
    setVar(context, contextKey, getClientIpFromHeaders(context.req.headers));
    await next();
  };
}

export function serverTiming<T extends object = MiddlewareVars>(metric = 'app;dur=0'): MiddlewareHandler<T> {
  return async (context, next) => {
    context.after((response) => {
      response.headers.set('Server-Timing', metric);
      return response;
    });
    await next();
  };
}

export function requestContext<T extends object = MiddlewareVars>(contextKey = 'context'): MiddlewareHandler<T> {
  return async (context, next) => {
    setVar(context, contextKey, {
      ip: getClientIpFromHeaders(context.req.headers),
      userAgent: context.req.headers.get('User-Agent') ?? '',
      origin: context.req.headers.get('Origin') ?? '',
    });
    await next();
  };
}

export function requestSize<T extends object = MiddlewareVars>(contextKey = 'requestSize'): MiddlewareHandler<T> {
  return async (context, next) => {
    const length = context.req.headers.get('Content-Length');
    if (length) {
      setVar(context, contextKey, Number(length));
      await next();
      return;
    }

    const clone = context.req.clone();
    const body = shouldCheckBody(context.req.method) ? await clone.arrayBuffer() : new ArrayBuffer(0);
    setVar(context, contextKey, body.byteLength);
    await next();
  };
}

export function locale<T extends object = MiddlewareVars>(defaultLocale = 'en'): MiddlewareHandler<T> {
  return async (context, next) => {
    const acceptLanguage = context.req.headers.get('Accept-Language') || '';
    const localeValue = acceptLanguage.split(',')[0]?.trim() || defaultLocale;
    setVar(context, 'locale', localeValue);
    await next();
  };
}

export function requestBodyText<T extends object = MiddlewareVars>(contextKey = 'rawBody'): MiddlewareHandler<T> {
  return async (context, next) => {
    if (shouldCheckBody(context.req.method)) {
      const text = await context.req.clone().text();
      setVar(context, contextKey, text);
    }
    await next();
  };
}

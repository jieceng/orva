import type { MiddlewareHandler } from '../orva.js';
import type {
  AcceptRequirementOptions,
  BodyLimitOptions,
  HeaderRequirementOptions,
  JsonRequirementOptions,
  MethodGuardOptions,
  MiddlewareVars,
  QueryRequirementOptions,
  RateLimitOptions,
  StatusErrorOptions,
  TimeoutOptions,
} from './shared.js';
import {
  getClientIpFromHeaders,
  getErrorResponse,
  rateLimitStore,
  shouldCheckBody,
  toMethodSet,
} from './shared.js';

export function allowMethods<T extends object = MiddlewareVars>(options: MethodGuardOptions | string[]): MiddlewareHandler<T> {
  const config = Array.isArray(options) ? { methods: options } : options;
  const allowed = toMethodSet(config.methods);

  return async (context, next) => {
    const method = context.req.method.toUpperCase();
    if (!allowed.has(method)) {
      return new Response(config.message ?? 'Method Not Allowed', {
        status: config.status ?? 405,
        headers: {
          ...Object.fromEntries(new Headers(config.headers).entries()),
          Allow: Array.from(allowed).join(', '),
        },
      });
    }
    await next();
  };
}

export function blockMethods<T extends object = MiddlewareVars>(options: MethodGuardOptions | string[]): MiddlewareHandler<T> {
  const config = Array.isArray(options) ? { methods: options } : options;
  const blocked = toMethodSet(config.methods);

  return async (context, next) => {
    if (blocked.has(context.req.method.toUpperCase())) {
      return getErrorResponse(context, config, 405, 'Method Not Allowed');
    }
    await next();
  };
}

export function requireHeader<T extends object = MiddlewareVars>(options: HeaderRequirementOptions | string[]): MiddlewareHandler<T> {
  const config = Array.isArray(options) ? { names: options } : options;
  return async (context, next) => {
    for (const name of config.names) {
      if (!context.req.headers.get(name)) {
        return getErrorResponse(context, config, 400, `Missing required header: ${name}`);
      }
    }
    await next();
  };
}

export function requireQuery<T extends object = MiddlewareVars>(options: QueryRequirementOptions | string[]): MiddlewareHandler<T> {
  const config = Array.isArray(options) ? { names: options } : options;
  return async (context, next) => {
    for (const name of config.names) {
      if (!(name in context.query) || context.query[name] === '') {
        return getErrorResponse(context, config, 400, `Missing required query parameter: ${name}`);
      }
    }
    await next();
  };
}

export function requireJson<T extends object = MiddlewareVars>(options: JsonRequirementOptions = {}): MiddlewareHandler<T> {
  const methods = toMethodSet(options.methods ?? ['POST', 'PUT', 'PATCH']);
  return async (context, next) => {
    if (methods.has(context.req.method.toUpperCase())) {
      const contentType = context.req.headers.get('Content-Type') || '';
      if (!contentType.toLowerCase().includes('application/json')) {
        return getErrorResponse(context, options, 415, 'Expected application/json request body');
      }
    }
    await next();
  };
}

export function requireAccept<T extends object = MiddlewareVars>(options: AcceptRequirementOptions | string[]): MiddlewareHandler<T> {
  const config = Array.isArray(options) ? { types: options } : options;
  return async (context, next) => {
    const accept = context.req.headers.get('Accept');
    if (!accept) {
      return getErrorResponse(context, config, 406, 'Missing Accept header');
    }
    const matches = config.types.some((type) => accept.includes(type) || accept.includes('*/*'));
    if (!matches) {
      return getErrorResponse(context, config, 406, 'Not Acceptable');
    }
    await next();
  };
}

export function bodyLimit<T extends object = MiddlewareVars>(options: BodyLimitOptions): MiddlewareHandler<T> {
  return async (context, next) => {
    if (shouldCheckBody(context.req.method)) {
      const contentLength = context.req.headers.get('Content-Length');
      if (contentLength && Number(contentLength) > options.maxBytes) {
        return getErrorResponse(context, options, 413, 'Payload Too Large');
      }

      const clone = context.req.clone();
      const body = await clone.arrayBuffer();
      if (body.byteLength > options.maxBytes) {
        return getErrorResponse(context, options, 413, 'Payload Too Large');
      }
    }
    await next();
  };
}

export function timeout<T extends object = MiddlewareVars>(options: TimeoutOptions): MiddlewareHandler<T> {
  return async (_context, next) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        next().then(() => undefined),
        new Promise<Response>((resolve) => {
          timer = setTimeout(() => {
            resolve(new Response(options.message ?? 'Request Timeout', {
              status: options.status ?? 408,
              headers: options.headers,
            }));
          }, options.ms);
        }),
      ]);

      if (result instanceof Response) {
        return result;
      }
    } finally {
      if (timer) clearTimeout(timer);
    }
  };
}

export function rateLimit<T extends object = MiddlewareVars>(options: RateLimitOptions<T>): MiddlewareHandler<T> {
  const keyGenerator = options.keyGenerator ?? ((context) => getClientIpFromHeaders(context.req.headers));

  return async (context, next) => {
    const key = keyGenerator(context);
    const now = Date.now();
    const current = rateLimitStore.get(key);
    const record = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + options.windowMs }
      : current;

    record.count += 1;
    rateLimitStore.set(key, record);

    const remaining = Math.max(options.limit - record.count, 0);
    context.after((response) => {
      if (options.standardHeaders ?? true) {
        response.headers.set('X-RateLimit-Limit', String(options.limit));
        response.headers.set('X-RateLimit-Remaining', String(remaining));
        response.headers.set('X-RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)));
      }
      return response;
    });

    if (record.count > options.limit) {
      const response = getErrorResponse(context, options, 429, 'Too Many Requests');
      response.headers.set('Retry-After', String(Math.max(Math.ceil((record.resetAt - now) / 1000), 1)));
      return response;
    }

    await next();
  };
}

export function hostAllowlist<T extends object = MiddlewareVars>(hosts: string[], options: StatusErrorOptions = {}): MiddlewareHandler<T> {
  const set = new Set(hosts);
  return async (context, next) => {
    if (!set.has(context.url.host)) {
      return getErrorResponse(context, options, 403, 'Forbidden host');
    }
    await next();
  };
}

export function blockUserAgents<T extends object = MiddlewareVars>(
  patterns: Array<string | RegExp>,
  options: StatusErrorOptions = {}
): MiddlewareHandler<T> {
  return async (context, next) => {
    const userAgentValue = context.req.headers.get('User-Agent') || '';
    const blocked = patterns.some((pattern) => typeof pattern === 'string'
      ? userAgentValue.includes(pattern)
      : pattern.test(userAgentValue));
    if (blocked) {
      return getErrorResponse(context, options, 403, 'Forbidden user agent');
    }
    await next();
  };
}

export function requireOrigin<T extends object = MiddlewareVars>(origins: string[], options: StatusErrorOptions = {}): MiddlewareHandler<T> {
  const set = new Set(origins);
  return async (context, next) => {
    const origin = context.req.headers.get('Origin');
    if (!origin || !set.has(origin)) {
      return getErrorResponse(context, options, 403, 'Forbidden origin');
    }
    await next();
  };
}

export function idempotencyKey<T extends object = MiddlewareVars>(options: StatusErrorOptions = {}): MiddlewareHandler<T> {
  return async (context, next) => {
    if (['POST', 'PATCH', 'PUT'].includes(context.req.method.toUpperCase())
      && !context.req.headers.get('Idempotency-Key')) {
      return getErrorResponse(context, options, 400, 'Missing Idempotency-Key header');
    }
    await next();
  };
}

export function csrfOrigin<T extends object = MiddlewareVars>(origins: string[], options: StatusErrorOptions = {}): MiddlewareHandler<T> {
  const set = new Set(origins);
  return async (context, next) => {
    if (shouldCheckBody(context.req.method)) {
      const origin = context.req.headers.get('Origin');
      if (!origin || !set.has(origin)) {
        return getErrorResponse(context, options, 403, 'CSRF origin denied');
      }
    }
    await next();
  };
}

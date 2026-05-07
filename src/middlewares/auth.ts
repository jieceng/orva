import type { MiddlewareHandler } from '../core/index.js';
import {
  OPENAPI_MIDDLEWARE_METADATA,
  type OpenAPIMiddlewareMetadata,
  type OpenAPISecuritySchemeComponent,
} from '../metadata.js';
import type {
  ApiKeyAuthOptions,
  BasicAuthOptions,
  BearerAuthOptions,
  MiddlewareVars,
} from './shared.js';
import { getErrorResponse, matchValue, setVar } from './shared.js';

function toComponentToken(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_') || 'Auth';
}

function withOpenAPIMetadata<T extends MiddlewareHandler<any>>(
  middleware: T,
  metadata: OpenAPIMiddlewareMetadata
): T {
  return Object.assign(middleware, {
    [OPENAPI_MIDDLEWARE_METADATA]: metadata,
  });
}

function basicAuthScheme(): OpenAPISecuritySchemeComponent<'basicAuth'> {
  return {
    componentName: 'basicAuth',
    scheme: {
      type: 'http',
      scheme: 'basic',
    },
  };
}

function bearerAuthScheme(): OpenAPISecuritySchemeComponent<'bearerAuth'> {
  return {
    componentName: 'bearerAuth',
    scheme: {
      type: 'http',
      scheme: 'bearer',
    },
  };
}

function apiKeyAuthSchemes(
  headerName: string,
  queryName: string
): OpenAPISecuritySchemeComponent[] {
  const headerToken = toComponentToken(headerName);
  const queryToken = toComponentToken(queryName);

  return [
    {
      componentName: `apiKeyHeaderAuth_${headerToken}`,
      scheme: {
        type: 'apiKey',
        in: 'header',
        name: headerName,
      },
    },
    {
      componentName: `apiKeyQueryAuth_${queryToken}`,
      scheme: {
        type: 'apiKey',
        in: 'query',
        name: queryName,
      },
    },
  ];
}

export function basicAuth<T extends object = MiddlewareVars>(options: BasicAuthOptions<T>): MiddlewareHandler<T> {
  const realm = options.realm ?? 'Protected';

  return withOpenAPIMetadata(async (context, next) => {
    const authorization = context.req.headers.get('Authorization') || '';
    if (!authorization.startsWith('Basic ')) {
      return new Response(options.message ?? 'Unauthorized', {
        status: options.status ?? 401,
        headers: {
          ...Object.fromEntries(new Headers(options.headers).entries()),
          'WWW-Authenticate': `Basic realm="${realm}"`,
        },
      });
    }

    let username = '';
    let password = '';
    try {
      const decoded = atob(authorization.slice(6));
      [username, password] = decoded.split(':');
    } catch {
      return getErrorResponse(context, options, 401, 'Invalid basic auth header');
    }

    const isValid = options.users instanceof Map
      ? options.users.get(username) === password
      : typeof options.users === 'function'
        ? await options.users(username, password, context)
        : options.users[username] === password;

    if (!isValid) {
      return getErrorResponse(context, options, 401, 'Unauthorized');
    }

    setVar(context, 'auth', { scheme: 'basic', username });
    await next();
  }, {
    securitySchemes: [basicAuthScheme()],
    security: [{ scheme: basicAuthScheme() }],
    responseStatuses: [401],
  });
}

export function bearerAuth<T extends object = MiddlewareVars>(options: BearerAuthOptions<T>): MiddlewareHandler<T> {
  return withOpenAPIMetadata(async (context, next) => {
    const authorization = context.req.headers.get('Authorization') || '';
    if (!authorization.startsWith('Bearer ')) {
      return getErrorResponse(context, options, 401, 'Unauthorized');
    }

    const token = authorization.slice(7);
    const valid = await matchValue(token, options.token, context);
    if (!valid) {
      return getErrorResponse(context, options, 401, 'Unauthorized');
    }

    setVar(context, 'auth', { scheme: 'bearer', token });
    await next();
  }, {
    securitySchemes: [bearerAuthScheme()],
    security: [{ scheme: bearerAuthScheme() }],
    responseStatuses: [401],
  });
}

export function apiKeyAuth<T extends object = MiddlewareVars>(options: ApiKeyAuthOptions<T>): MiddlewareHandler<T> {
  const headerName = options.headerName ?? 'X-API-Key';
  const queryName = options.queryName ?? 'apiKey';
  const schemes = apiKeyAuthSchemes(headerName, queryName);

  return withOpenAPIMetadata(async (context, next) => {
    const candidate = context.req.headers.get(headerName) ?? context.query[queryName];
    if (!candidate) {
      return getErrorResponse(context, options, 401, 'Unauthorized');
    }

    const valid = await matchValue(candidate, options.key, context);
    if (!valid) {
      return getErrorResponse(context, options, 401, 'Unauthorized');
    }

    setVar(context, 'auth', { scheme: 'apiKey', key: candidate });
    await next();
  }, {
    securitySchemes: schemes,
    security: schemes.map((scheme) => ({ scheme })),
    responseStatuses: [401],
  });
}

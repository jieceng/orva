# Middleware and Type Accumulation

This page focuses on how `orva` is used in real services, not just single-route demos.

## `app.use()` is more than a runtime chain

In `orva`, `app.use()` is responsible for:

- runtime middleware composition
- `var` type accumulation
- forwarding validator output into downstream routes
- providing indirect metadata sources for OpenAPI and security contracts

```ts
import { createOrva, defineMiddleware } from 'orva';
import { validator } from 'orva/validator';

const session = defineMiddleware<{ session: { id: string; role: string } }>(async (c, next) => {
  c.set('session', { id: 'u_1', role: 'admin' });
  await next();
});

const app = createOrva()
  .use(session)
  .use(validator('header', (headers: Record<string, string>) => ({
    authorization: headers.authorization ?? '',
  })));

app.get('/me', (c) => {
  return c.json({
    session: c.get('session'),
    header: c.valid('header'),
  });
});
```

## Recommended import strategy

### Aggregate imports

Good for internal apps, prototypes, and small-to-medium services:

```ts
import { cors, secureHeaders, requestId } from 'orva/middlewares';
```

### Granular imports

Better for npm packages, templates, shared platform code, and tree-shaking-sensitive projects:

```ts
import { cors } from 'orva/middlewares/cors';
import { secureHeaders } from 'orva/middlewares/secure-headers';
import { requestId } from 'orva/middlewares/request-id';
```

<OrvaImportPlayground />

## Recommended production baseline

```ts
import {
  bodyLimit,
  cors,
  logger,
  requestId,
  responseTime,
  secureHeaders,
} from 'orva/middlewares';

app.use(
  requestId(),
  logger(),
  cors(),
  secureHeaders(),
  bodyLimit({ maxSize: 1024 * 1024 }),
  responseTime(),
);
```

Then add more as needed:

- `basicAuth()` / `bearerAuth()` / `apiKeyAuth()`
- `rateLimit()`
- `etag()`
- `serveStatic()`
- `compress()`

## A more complete API entry example

```ts
import { createOrva } from 'orva';
import { zodValidator } from 'orva/validator/zod';
import {
  basicAuth,
  bodyLimit,
  logger,
  requestId,
  responseTime,
  secureHeaders,
} from 'orva/middlewares';
import { z } from 'zod';

const app = createOrva()
  .use(requestId(), logger(), secureHeaders(), bodyLimit({ maxSize: 1024 * 1024 }), responseTime())
  .use(basicAuth({ username: 'admin', password: 'secret' }))
  .post(
    '/admin/users',
    zodValidator('json', z.object({
      name: z.string().min(1),
      role: z.enum(['admin', 'editor', 'viewer']),
    })),
    (c) => c.json({
      createdBy: c.get('requestId'),
      user: c.valid('json'),
    }, 201),
  );
```

## Middleware ordering

A good default order is:

1. request identity and logging: `requestId()` `logger()`
2. access control and security: `cors()` `secureHeaders()` `basicAuth()` `requireOrigin()`
3. input limits: `bodyLimit()` `timeout()` `rateLimit()`
4. response shaping: `etag()` `compress()` `cacheControl()`
5. observability and tail work: `responseTime()` `serverTiming()` `after()`

## Error handling

Set `onError()` once at the app level so error output stays consistent:

```ts
const app = createOrva().onError((err, c) => {
  return c.json({
    error: 'INTERNAL_ERROR',
    message: err.message,
    requestId: c.get('requestId'),
  }, 500);
});
```

For validation failures, prefer returning `400` or `422` close to the validator layer. Let unexpected errors fall back to `onError()`.

## Post-processing

`c.after()` is a good fit for:

- appending response headers
- writing audit logs
- tracing and telemetry
- conditional compression or response transforms

```ts
app.use(async (c, next) => {
  c.after((response) => {
    response.headers.set('x-request-id', c.get('requestId') ?? 'unknown');
    return response;
  });
  await next();
});
```

## Team conventions

- Put reusable cross-service contracts onto the validator / OpenAPI / RPC path when possible.
- Do not import adapters, RPC, or middleware from the root entry.
- Keep middleware factories side-effect free and config-driven where possible.
- For published ecosystem packages, prefer `orva/middlewares/*` submodule paths.
- Keep static assets, compression, and cache headers at the edge or boundary layer instead of scattering them into business handlers.

Next, continue with [Testing and Quality](/guide/testing) and [Deployment and Runtimes](/guide/deployment).

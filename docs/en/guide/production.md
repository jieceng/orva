# Middleware and Type Accumulation

This page focuses on how `orva` is meant to be used in real services, not one-route demos.

## `app.use()` is more than runtime composition

In `orva`, `app.use()` also carries:

- middleware ordering
- `var` type accumulation
- validated payload flow into downstream handlers
- metadata that later affects RPC and OpenAPI

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
```

## Recommended default stack

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

Then add what the app actually needs:

- `basicAuth()` / `bearerAuth()` / `apiKeyAuth()`
- `rateLimit()`
- `etag()`
- `serveStatic()`
- `compress()`

## Middleware ordering

Think about ordering in this sequence:

1. request identity and logs
2. security and access control
3. input limits
4. response shaping
5. metrics and post-processing

## Error handling

Keep application-wide failures consistent:

```ts
const app = createOrva().onError((err, c) => {
  return c.json({
    error: 'INTERNAL_ERROR',
    message: err.message,
    requestId: c.get('requestId'),
  }, 500);
});
```

Use validator-level handlers for expected `400` / `422` failures, and keep unexpected failures in `onError()`.

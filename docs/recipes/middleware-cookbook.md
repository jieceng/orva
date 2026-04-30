# Middleware Cookbook

Use this page when you know the kind of service you want to build, but do not want to design the middleware stack from scratch.

## Import strategy

Use the barrel export in applications:

```ts
import { cors, requestId, secureHeaders } from 'orvajs/middlewares';
```

Use fine-grained subpath imports in shared libraries, starters, and infra packages:

```ts
import { cors } from 'orvajs/middlewares/cors';
import { requestId } from 'orvajs/middlewares/request-id';
```

## Stack 1: public JSON API

This is a strong default for ordinary HTTP APIs.

```ts
import { createOrva } from 'orvajs';
import {
  bodyLimit,
  cors,
  logger,
  requestId,
  responseTime,
  secureHeaders,
} from 'orvajs/middlewares';

const app = createOrva().use(
  requestId(),
  logger({ includeQuery: true }),
  cors({ origin: ['https://app.example.com'] }),
  secureHeaders(),
  bodyLimit({ maxBytes: 1024 * 1024 }),
  responseTime(),
);
```

Why this order works:

- `requestId()` and `logger()` run early so every request gets tracing data.
- `cors()` and `secureHeaders()` shape the response headers for both success and failure cases.
- `bodyLimit()` rejects oversized bodies before validators do more work.
- `responseTime()` should be late so it captures most of the pipeline.

## Stack 2: authenticated write API

Use this shape for admin APIs, internal tools, or partner integrations.

```ts
import { z } from 'zod';
import { createOrva } from 'orvajs';
import {
  apiKeyAuth,
  idempotencyKey,
  requireJson,
  requestId,
  secureHeaders,
} from 'orvajs/middlewares';
import { zodValidator } from 'orvajs/validator/zod';

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const app = createOrva()
  .use(
    requestId(),
    secureHeaders(),
    apiKeyAuth({ key: process.env.API_KEY ?? 'dev-key' }),
    requireJson(),
    idempotencyKey(),
  )
  .post(
    '/users',
    zodValidator('json', createUserSchema),
    (c) => c.json(c.valid('json'), 201),
  );
```

Practical rule:

- put access control before expensive business logic
- put `requireJson()` before JSON validators
- use validators to define trusted handler input, not just to reject bad requests

## Stack 3: static files or SPA delivery

Use this when `orva` should serve assets directly.

```ts
import { createOrva } from 'orvajs';
import {
  compress,
  etag,
  logger,
  requestId,
  serveStatic,
} from 'orvajs/middlewares';

const app = createOrva().use(
  requestId(),
  logger(),
  etag(),
  compress({ threshold: 2048 }),
  serveStatic({
    root: './public',
    index: 'index.html',
    spaFallback: 'index.html',
    cacheControl: (path) => path.startsWith('assets/')
      ? 'public, max-age=31536000, immutable'
      : 'no-cache',
  }),
);
```

Important detail:

If a middleware returns a response without calling `await next()`, later middleware will not run. Put `serveStatic()` after middleware that must still affect static responses.

## Stack 4: internet-facing API hardening

Use this for public endpoints where abuse protection matters.

```ts
import { createOrva } from 'orvajs';
import {
  clientIp,
  hostAllowlist,
  httpsRedirect,
  rateLimit,
  requireAccept,
  secureHeaders,
} from 'orvajs/middlewares';

const app = createOrva().use(
  httpsRedirect(),
  secureHeaders(),
  clientIp(),
  hostAllowlist(['api.example.com']),
  requireAccept(['application/json']),
  rateLimit({
    limit: 120,
    windowMs: 60_000,
    keyGenerator: (c) => c.get('ip') ?? 'unknown',
  }),
);
```

This stack helps with:

- protocol enforcement
- host filtering
- content negotiation
- burst protection

## Ordering rules that save time later

Use this order unless you have a specific reason not to:

1. request identity and logging
2. protocol and security headers
3. auth, origin, host, and rate guards
4. content requirements and body limits
5. validators
6. response shaping such as `etag()` and `compress()`
7. static delivery near the end

## Choose middleware by job

| Job | Middleware |
| --- | --- |
| request tracing | `requestId()`, `responseTime()`, `logger()` |
| auth | `basicAuth()`, `bearerAuth()`, `apiKeyAuth()` |
| abuse protection | `rateLimit()`, `bodyLimit()`, `hostAllowlist()`, `blockUserAgents()` |
| response policy | `cors()`, `cacheControl()`, `noStore()`, `vary()` |
| browser hardening | `secureHeaders()`, `contentSecurityPolicy()`, `strictTransportSecurity()` |
| assets | `serveStatic()`, `etag()`, `compress()` |

## Read next

- [Middleware Catalog](/middlewares)
- [Type Flow](/guide/type-flow)
- [REST API Recipe](/recipes/rest-api)

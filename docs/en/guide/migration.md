# Migrate from Express or Hono

Use this page when you already have a service in Express or Hono and want to move it into `orva` without rewriting everything at once.

## The main mental shift

| Existing framework | `orva` equivalent |
| --- | --- |
| mutate `res` and end the response | return `c.json()`, `c.text()`, `c.html()`, or `c.redirect()` |
| `req.params.id` or `c.req.param('id')` | `c.params.id` |
| `req.query.q` or `c.req.query('q')` | `c.query.q` |
| `res.locals` or ad-hoc request mutation | `c.set()` / `c.get()` |
| custom body interfaces | `validator()` / `zodValidator()` + `c.valid()` |

The big difference is that `orva` treats request handling as a contract chain:

1. middleware can add vars and metadata
2. validators define trusted input
3. handlers return typed responses
4. RPC and OpenAPI can reuse the same route contracts

## Express to `orva`

An Express route often looks like this:

```ts
import express from 'express';

const app = express();
app.use(express.json());

app.get('/users/:id', (req, res) => {
  res.json({
    id: req.params.id,
    q: req.query.q ?? null,
  });
});
```

The same shape in `orva` is smaller because the Web `Request` is already available:

```ts
import { createOrva } from 'orvajs';
import { serveNode } from 'orvajs/adapters/node';

const app = createOrva().get('/users/:id', (c) => c.json({
  id: c.params.id,
  q: c.query.q ?? null,
}));

serveNode(app, { port: 3000 });
```

Important adjustments:

- You usually do not need a separate JSON body parser middleware just to read JSON. Use `await c.req.json()` or a validator.
- Do not recreate `res.locals`. Use `c.set('key', value)` in middleware and `c.get('key')` in downstream handlers.
- Return a response from the handler instead of mutating a response object and ending it later.

## Hono to `orva`

If you already use Hono, the model is familiar because both frameworks use a Fetch-style context.

| Hono | `orva` |
| --- | --- |
| `new Hono()` | `createOrva()` |
| `c.req.param('id')` | `c.params.id` |
| `c.req.query('q')` | `c.query.q` |
| `c.req.header('x-token')` | `c.req.headers.get('x-token')` |
| `c.req.valid('json')` | `c.valid('json')` |
| `app.route('/api', users)` | `app.route('/api', users)` |

The main `orva`-specific upgrade is that middleware, validator, RPC, and OpenAPI are designed to share one route contract more explicitly.

## Safe migration order

### 1. Move route handlers first

Start by copying route paths and response shapes.

```ts
const users = createOrva()
  .get('/:id', (c) => c.json({ id: c.params.id }))
  .patch('/:id', (c) => c.text(`patched ${c.params.id}`));

app.route('/users', users);
```

### 2. Move cross-cutting middleware

Rebuild the old global stack in `app.use()`:

```ts
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
  cors(),
  secureHeaders(),
  bodyLimit({ maxBytes: 1024 * 1024 }),
  responseTime(),
);
```

### 3. Replace manual input types with validators

```ts
import { z } from 'zod';
import { zodValidator } from 'orvajs/validator/zod';

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

app.post(
  '/users',
  zodValidator('json', createUserSchema),
  (c) => c.json(c.valid('json'), 201),
);
```

This is usually the step where type quality improves the most.

### 4. Add RPC and OpenAPI after the routes are stable

Once the handler contracts are clean, `orva` can reuse them for typed clients and documentation instead of introducing another schema layer.

## Things not to port literally

- Do not keep old Express body-parser habits unless you really need custom parsing.
- Do not mirror Hono helpers one-by-one. Learn the flatter `c.params`, `c.query`, and `c.valid()` model directly.
- Do not duplicate request interfaces in TypeScript if a validator already owns the input contract.
- Do not put static delivery before middleware that must still affect static responses, such as logging, `etag()`, or `compress()`.

## Read next

- [Type Flow](/en/guide/type-flow)
- [Middleware Cookbook](/en/recipes/middleware-cookbook)
- [REST API Recipe](/en/recipes/rest-api)

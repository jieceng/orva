# Type Flow

This page explains the core design advantage in `orva`: types do not stop at one API boundary.

## The chain

In a typical `orva` route, the useful chain looks like this:

1. `app.use()` adds shared variables or validated data
2. `validator()` or `zodValidator()` parses request input
3. the route handler reads typed values from `c`
4. `c.json()` defines the response shape
5. `createRPC<typeof app>()` reads request and response types
6. `createOpenAPIDocument()` reads the same metadata for docs

<OrvaContractPipeline />

## A complete example

```ts
import { z } from 'zod';
import { createOrva, defineMiddleware } from 'orvajs';
import { createRPC } from 'orvajs/rpc';
import { zodValidator } from 'orvajs/validator/zod';

const session = defineMiddleware<{ session: { role: string } }>(async (c, next) => {
  c.set('session', { role: 'admin' });
  await next();
});

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const app = createOrva()
  .use(session)
  .post(
    '/users/:id',
    zodValidator('json', createUserSchema),
    (c) => {
      const body = c.valid('json');
      const role = c.get('session')?.role;

      return c.json({
        id: c.params.id,
        role,
        user: body,
      }, 201);
    },
  );

const rpc = createRPC<typeof app>({
  baseURL: 'https://api.example.com',
});
```

## What moves through the chain

### `app.use()`

`defineMiddleware()` can push typed variables into downstream routes.

That makes `c.get('session')` typed instead of loosely attached state.

### Validator output

`zodValidator('json', schema)` turns request body parsing into a typed handler input.

That makes `c.valid('json')` a contract boundary, not just a runtime helper.

### Route response

When you return `c.json(...)`, the response body type is preserved.

That becomes visible to RPC response inference even without extra OpenAPI response declarations.

### RPC request and response

For `createRPC<typeof app>()`:

- `body` is inferred from validator output
- `param` is inferred from the route path
- `json()` and `value()` are inferred from `c.json(...)` or route metadata

### OpenAPI output

When you add route metadata or schema-aware validators, the same route can produce OpenAPI definitions without rewriting the request and response contract elsewhere.

## Why this matters

Without this chain, teams usually describe the same thing in four places:

- runtime validation
- handler types
- client types
- API docs

`orva` tries to keep those layers close enough that they drift less often.

## Read next

- [Quickstart](/en/guide/quickstart)
- [Validator](/en/validator)
- [RPC](/en/rpc)
- [OpenAPI](/en/openapi)

# Introduction

`nano` is a Fetch API based TypeScript web framework. It keeps the request handling model small, while filling in the layers production services usually need:

- composable routing and middleware
- `app.use()` type accumulation
- validator and zod validator
- typed RPC clients driven by server routes
- OpenAPI generation with reusable components
- adapters for Node, Bun, Deno, Cloudflare, Vercel, Netlify, Azure and AWS Lambda

## Good fit

- API services
- BFFs
- serverless and edge backends
- teams that want stronger contracts without dragging in a large framework surface

## Design principles

### 1. The root entry stays small

```ts
import { createNano, defineMiddleware } from 'nano';
```

Everything else lives in subpaths:

```ts
import { createRPC } from 'nano/rpc';
import { serveNode } from 'nano/adapters/node';
import { cors } from 'nano/middlewares/cors';
import { validator } from 'nano/validator';
import { zodValidator } from 'nano/validator/zod';
import { createOpenAPIDocument } from 'nano/openapi';
```

### 2. Middleware types are part of the architecture

```ts
import { createNano, defineMiddleware } from 'nano';

const session = defineMiddleware<{ session: { userId: string } }>(async (c, next) => {
  c.set('session', { userId: 'u_1' });
  await next();
});

const app = createNano()
  .use(session)
  .get('/me', (c) => c.json({ userId: c.get('session')?.userId }));
```

### 3. Contracts should be reused, not rewritten

One route definition can drive:

- runtime validation
- type inference
- RPC client typing
- OpenAPI generation

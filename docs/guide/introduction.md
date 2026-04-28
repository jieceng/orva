# Introduction

`orva` is a TypeScript web framework built around the Fetch API. It keeps the handling model small while filling in the layers modern backend services usually need:

- composable routing and middleware
- `app.use()`-level type accumulation
- validator and zod validator support
- typed RPC clients generated from the route registry
- OpenAPI documents with reusable component metadata
- adapters for Node, Bun, Deno, Cloudflare, Vercel, Netlify, Azure, and AWS Lambda

## Design goals

`orva` is trying to do three things well:

1. Keep request handling easy to read.
2. Keep types, docs, clients, and runtime validation close to the same route contract.
3. Keep export boundaries explicit enough for packaging, reuse, and ecosystem publishing.

That means it is neither a toy framework focused only on a tiny API surface, nor a heavy framework tied to a large all-in-one convention model.

## Good fits

- API services
- BFF / Backend for Frontend
- serverless and edge services
- internal systems that need OpenAPI or typed clients
- teams that want contract tooling without a heavy framework model

## Poor fits

- a single-file demo that will never use middleware, validation, RPC, or docs
- a full-stack page rendering framework with batteries included
- teams already fully locked into another strongly opinionated platform with no reuse plan

## Core design

### 1. The root entry exports only the core

```ts
import { createOrva, defineMiddleware } from 'orva';
```

Non-core features come from subpaths:

```ts
import { createRPC } from 'orva/rpc';
import { serveNode } from 'orva/adapters/node';
import { cors } from 'orva/middlewares/cors';
import { validator } from 'orva/validator';
import { zodValidator } from 'orva/validator/zod';
import { createOpenAPIDocument } from 'orva/openapi';
```

This has two direct benefits:

- it keeps the root entry from becoming bloated
- it makes both app code and ecosystem code easier to import selectively

### 2. Middleware types are part of the contract

`orva` lets `defineMiddleware()` and validators accumulate types into downstream routes:

```ts
import { createOrva, defineMiddleware } from 'orva';

const session = defineMiddleware<{ session: { userId: string; role: string } }>(async (c, next) => {
  c.set('session', { userId: 'u_1', role: 'admin' });
  await next();
});

const app = createOrva()
  .use(session)
  .get('/me', (c) => c.json({
    userId: c.get('session')?.userId,
    role: c.get('session')?.role,
  }));
```

### 3. Contracts should be reused, not rewritten

One route definition can feed:

- runtime validation
- type inference
- RPC clients
- OpenAPI generation

That is one of the main differences between `orva` and lighter routers that stop at request dispatch.

## How it differs from common alternatives

| Dimension | orva | Traditional Express style |
| --- | --- | --- |
| Request model | Fetch API style | Node / Express-owned request objects |
| Type flow | Can stay continuous from middleware and validator into RPC / OpenAPI | Usually needs extra tooling layers stitched together |
| Export strategy | Lean root entry, granular submodules | Often uses broad aggregate exports |
| Multi-runtime | Node-first plus multiple platform adapters | Primarily Node-centric, with more external bridging |

## Recommended adoption path

- New projects: start with [Quickstart](/guide/quickstart) and ship a minimal service first.
- Existing API services: add validator, error handling, and middleware first, then layer in RPC / OpenAPI.
- Platform tooling: prefer granular submodule paths such as `orva/middlewares/cors`.

Next, read [Quickstart](/guide/quickstart) and [Middleware and Type Accumulation](/guide/production).

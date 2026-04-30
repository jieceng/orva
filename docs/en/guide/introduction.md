# Introduction

`orva` is a TypeScript web framework built around the Fetch API. It keeps the request model small while filling in the layers most production services need:

- composable routing and middleware
- app-level type accumulation
- validator and zod validator support
- typed RPC clients generated from the route registry
- OpenAPI generation with reusable component metadata
- adapters for Node, Bun, Deno, Cloudflare, Vercel, Netlify, Azure, and AWS Lambda

## What to learn on this page

By the end of this page, you should understand:

- what kind of framework `orva` is
- what problems it is designed to solve
- why the root entry and subpath exports are intentionally separated
- why validator, RPC, and OpenAPI are treated as one contract system

## Design goals

`orva` is trying to do three things well:

1. Keep request handling easy to read.
2. Keep validation, types, clients, and docs close to the same route contract.
3. Keep export boundaries explicit enough for packages, templates, and ecosystem code.

## Good fits

- API services
- BFFs
- serverless and edge services
- internal platforms that need OpenAPI or typed clients
- teams that want contract tooling without a heavy framework model

## Core design

### 1. The root entry exports only the core

```ts
import { createOrva, defineMiddleware } from 'orvajs';
```

Everything else comes from subpaths:

```ts
import { createRPC } from 'orvajs/rpc';
import { serveNode } from 'orvajs/adapters/node';
import { cors } from 'orvajs/middlewares/cors';
import { validator } from 'orvajs/validator';
import { zodValidator } from 'orvajs/validator/zod';
import { createOpenAPIDocument } from 'orvajs/openapi';
```

### 2. Middleware types are part of the contract

```ts
import { createOrva, defineMiddleware } from 'orvajs';

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

### 3. Contracts should be reused

The same route definition can feed:

- runtime validation
- type inference
- RPC clients
- OpenAPI documents

That is the main reason `orva` is more than a thin router layer.

## Read next

1. [Quickstart](/en/guide/quickstart)
2. [Context and Responses](/en/guide/context)
3. [Type Flow](/en/guide/type-flow)

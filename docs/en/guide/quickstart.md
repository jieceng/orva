# Quickstart

The goal of this page is to give you a project shape you can keep building on, not just a one-line hello-world.

## What you will learn

On this page you will:

- run a working server
- shape a small app layout
- add a baseline middleware stack
- connect validation and contract outputs

## Install

```bash
pnpm add orvajs
pnpm add -D typescript tsx
```

The published `orvajs` package only includes `dist`, `README.md`, and `LICENSE`. If you want to run the docs site locally, clone the full repository first:

```bash
git clone https://github.com/jieceng/orva.git
cd orva
pnpm install
pnpm docs:dev
```

## First service

```ts
import { createOrva } from 'orvajs';
import { serveNode } from 'orvajs/adapters/node';

const app = createOrva();

app.get('/', (c) => c.text('orva is running'));
app.get('/users/:id', (c) => c.json({
  id: c.params.id,
  q: c.query.q ?? null,
}));

serveNode(app, { port: 3000 });
```

## Recommended structure

```text
src/
  app.ts
  routes/
    users.ts
  middlewares/
    auth.ts
  contracts/
    user.ts
server.ts
```

`src/app.ts`:

```ts
import { createOrva } from 'orvajs';
import { cors, secureHeaders } from 'orvajs/middlewares';
import { usersApp } from './routes/users';

export const app = createOrva()
  .use(cors(), secureHeaders())
  .route('/api', usersApp);
```

## Start with a minimal production stack

```ts
import {
  bodyLimit,
  cors,
  requestId,
  responseTime,
  secureHeaders,
} from 'orvajs/middlewares';

export const app = createOrva().use(
  requestId(),
  cors(),
  secureHeaders(),
  bodyLimit({ maxBytes: 1024 * 1024 }),
  responseTime(),
);
```

## Add validator

```ts
import { z } from 'zod';
import { zodValidator } from 'orvajs/validator/zod';

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export const app = createOrva().post(
  '/users',
  zodValidator('json', createUserSchema),
  (c) => c.json(c.valid('json'), 201),
);
```

## Add OpenAPI and RPC metadata

```ts
import { createRPCMetadata } from 'orvajs/rpc';
import { createOpenAPIDocument } from 'orvajs/openapi';

export const rpcMetadata = createRPCMetadata(app);

export const openapi = createOpenAPIDocument(app, {
  info: {
    title: 'Orva Example',
    version: '1.0.0',
  },
});
```

## Import strategy

Application code can use aggregate imports:

```ts
import { cors, requestId } from 'orvajs/middlewares';
```

Reusable packages and templates should prefer subpaths:

```ts
import { cors } from 'orvajs/middlewares/cors';
import { requestId } from 'orvajs/middlewares/request-id';
```

<OrvaImportPlayground />

## Read next

1. [Context and Responses](/en/guide/context)
2. [Routing and Composition](/en/guide/routing)
3. [Type Flow](/en/guide/type-flow)

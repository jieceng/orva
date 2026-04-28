# Quickstart

The goal of this page is to give you a project shape you can keep building on, not just a one-line hello-world.

## Install

```bash
pnpm add orva
pnpm add -D typescript tsx
```

If you are also running the docs site:

```bash
pnpm docs:dev
```

## First service

```ts
import { createOrva } from 'orva';
import { serveNode } from 'orva/adapters/node';

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
import { createOrva } from 'orva';
import { cors, secureHeaders } from 'orva/middlewares';
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
} from 'orva/middlewares';

export const app = createOrva().use(
  requestId(),
  cors(),
  secureHeaders(),
  bodyLimit({ maxSize: 1024 * 1024 }),
  responseTime(),
);
```

## Add validator

```ts
import { z } from 'zod';
import { zodValidator } from 'orva/validator/zod';

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
import { createRPCMetadata } from 'orva/rpc';
import { createOpenAPIDocument } from 'orva/openapi';

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
import { cors, requestId } from 'orva/middlewares';
```

Reusable packages and templates should prefer subpaths:

```ts
import { cors } from 'orva/middlewares/cors';
import { requestId } from 'orva/middlewares/request-id';
```

<OrvaImportPlayground />

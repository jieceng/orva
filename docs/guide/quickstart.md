# Quickstart

The goal of this page is not just to return a `Hello World`, but to give you a project shape you can keep building on in a few minutes.

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

Then visit:

- `GET http://localhost:3000/`
- `GET http://localhost:3000/users/42?q=active`

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

`src/routes/users.ts`:

```ts
import { createOrva } from 'orvajs';

export const usersApp = createOrva()
  .get('/', (c) => c.json([{ id: 'u_1', name: 'Ada' }]))
  .get('/:id', (c) => c.json({ id: c.params.id, name: 'Ada' }));
```

`server.ts`:

```ts
import { serveNode } from 'orvajs/adapters/node';
import { app } from './src/app';

serveNode(app, { port: 3000 });
```

## Start with a minimal production stack

Most projects should at least begin with:

```ts
import { createOrva } from 'orvajs';
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
  bodyLimit({ maxSize: 1024 * 1024 }),
  responseTime(),
);
```

## Add validator

```ts
import { z } from 'zod';
import { createOrva } from 'orvajs';
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

## Add OpenAPI and RPC

The server app stays the same. You add contract exports beside it:

```ts
import { createRPCMetadata } from 'orvajs/rpc';
import { createOpenAPIDocument } from 'orvajs/openapi';
import { app } from './app';

export const rpcMetadata = createRPCMetadata(app);

export const openapi = createOpenAPIDocument(app, {
  info: {
    title: 'Orva Example',
    version: '1.0.0',
  },
});
```

## Import strategy

### Application code

```ts
import { cors, requestId } from 'orvajs/middlewares';
```

### Published packages, templates, and platform tooling

```ts
import { cors } from 'orvajs/middlewares/cors';
import { requestId } from 'orvajs/middlewares/request-id';
```

<OrvaImportPlayground />

## Next steps

- Read [Routing and Composition](/guide/routing)
- Read [Context and Responses](/guide/context)
- Read [Middleware and Type Accumulation](/guide/production)
- Read [Testing and Quality](/guide/testing)

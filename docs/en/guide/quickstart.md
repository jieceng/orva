# Quickstart

## Install

```bash
pnpm add nano
pnpm add -D typescript tsx
```

To run the docs site locally:

```bash
pnpm docs:dev
```

## Your first service

```ts
import { createNano } from 'nano';
import { serveNode } from 'nano/adapters/node';

const app = createNano();

app.get('/', (c) => c.text('nano is running'));
app.get('/users/:id', (c) => c.json({ id: c.params.id, q: c.query.q ?? null }));

serveNode(app, { port: 3000 });
```

## Suggested layout

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
import { createNano } from 'nano';
import { cors, secureHeaders } from 'nano/middlewares';
import { usersApp } from './routes/users';

export const app = createNano()
  .use(cors(), secureHeaders())
  .route('/api', usersApp);
```

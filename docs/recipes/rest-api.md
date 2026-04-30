# REST API Recipe

This recipe shows the smallest service shape that still feels production-oriented.

## What you build

- grouped API routes
- request validation
- request id and security headers
- consistent error responses

## Step 1: create the app

```ts
import { createOrva } from 'orvajs';
import { requestId, secureHeaders } from 'orvajs/middlewares';

export const app = createOrva()
  .use(requestId(), secureHeaders())
  .onError((err, c) => c.json({
    error: 'INTERNAL_ERROR',
    message: err.message,
    requestId: c.get('requestId'),
  }, 500));
```

## Step 2: add user routes

```ts
import { z } from 'zod';
import { createOrva } from 'orvajs';
import { zodValidator } from 'orvajs/validator/zod';

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export const usersApp = createOrva()
  .get('/', (c) => c.json([{ id: 'u_1', name: 'Ada' }]))
  .get('/:id', (c) => c.json({ id: c.params.id, name: 'Ada' }))
  .post(
    '/',
    zodValidator('json', createUserSchema),
    (c) => c.json({
      id: crypto.randomUUID(),
      ...c.valid('json'),
    }, 201),
  );
```

## Step 3: mount the routes

```ts
import { app } from './app';
import { usersApp } from './routes/users';

app.route('/api/users', usersApp);
```

## What to learn from this

- Keep the root app for shared middleware and global error handling.
- Keep route groups focused on one business area.
- Let validators define request input instead of duplicating body types.

## Read next

- [Type Flow](/guide/type-flow)
- [Validator](/validator)
- [Testing and Quality](/guide/testing)

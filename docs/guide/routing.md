# Routing and Composition

## HTTP methods

`orva` ships the common HTTP helpers plus `all()`:

```ts
const app = createOrva();

app.get('/posts', (c) => c.json([]));
app.post('/posts', (c) => c.text('created', 201));
app.patch('/posts/:id', (c) => c.text(`patched ${c.params.id}`));
app.all('/health', (c) => c.text('ok'));
```

## Path params and wildcards

```ts
app.get('/users/:id', (c) => c.json({ id: c.params.id }));
app.get('/files/*', (c) => c.text(c.params['*']));
```

`HEAD` falls back to the `GET` handler, which is useful for health checks and simple resource endpoints.

## Grouping

```ts
const app = createOrva().group('/api', (api) => {
  return api
    .get('/ping', (c) => c.json({ ok: true }))
    .get('/version', (c) => c.text('v1'));
});
```

## Sub-app mounting

```ts
const users = createOrva()
  .get('/users', (c) => c.json([]))
  .get('/users/:id', (c) => c.json({ id: c.params.id }));

const app = createOrva().route('/api', users);
```

This pattern is especially useful for RPC type inference because the child app route registry stays preserved.

## Route-level middleware

```ts
import { basicAuth } from 'orvajs/middlewares';

app.get(
  '/admin',
  basicAuth({ username: 'admin', password: 'secret' }),
  (c) => c.text('ok'),
);
```

## Error handling and 404

```ts
const app = createOrva()
  .notFound((c) => c.json({ error: 'Not Found' }, 404))
  .onError((err, c) => c.json({ error: err.message }, 500));
```

## Recommendations

- Let the platform entry do only `serve`.
- Split the route tree into sub-apps by business domain.
- Keep shared middleware global, and keep business auth at route or group scope.

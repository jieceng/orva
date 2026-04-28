# Routing and Composition

## HTTP methods

```ts
const app = createNano();

app.get('/posts', (c) => c.json([]));
app.post('/posts', (c) => c.text('created', 201));
app.patch('/posts/:id', (c) => c.text(`patched ${c.params.id}`));
app.all('/health', (c) => c.text('ok'));
```

## Params and wildcards

```ts
app.get('/users/:id', (c) => c.json({ id: c.params.id }));
app.get('/files/*', (c) => c.text(c.params['*']));
```

`HEAD` falls back to `GET`, which keeps health checks and simple resource endpoints straightforward.

## Groups

```ts
const app = createNano().group('/api', (api) => {
  return api
    .get('/ping', (c) => c.json({ ok: true }))
    .get('/version', (c) => c.text('v1'));
});
```

## Mounted apps

```ts
const users = createNano()
  .get('/users', (c) => c.json([]))
  .get('/users/:id', (c) => c.json({ id: c.params.id }));

const app = createNano().route('/api', users);
```

# Context and Responses

`Context` is the per-request core object. It centralizes request reads, response helpers, shared variables, validated data, and response finalizers.

## Reading the request

```ts
app.post('/echo', async (c) => {
  const json = await c.req.json();
  return c.json({ json, query: c.query, url: c.url.toString() });
});
```

Main fields:

- `c.req`
- `c.url`
- `c.params`
- `c.query`

## Shared variables

```ts
app.use(async (c, next) => {
  c.set('requestStart', Date.now());
  await next();
});
```

## Reading validated data

After validators succeed, `c.valid()` preserves the parsed output type for each target:

```ts
app.post(
  '/users/:id',
  validator('json', (value: { name?: string }) => ({ name: value.name ?? '' })),
  validator('param', (value: Record<string, string>) => ({ id: value.id })),
  validator('query', (value: Record<string, string>) => ({
    expand: value.expand === '1',
  })),
  (c) => {
    const body = c.valid('json');
    const params = c.valid('param');
    const query = c.valid('query');

    return c.json({ body, params, query }, 201);
  },
);
```

Helper functions are available too:

```ts
import { getValidatedData, setValidatedData } from 'orvajs/validator';

app.post('/users/:id', validator('param', (value) => ({ id: value.id })), (c) => {
  const params = getValidatedData(c, 'param');
  setValidatedData(c, 'trace', 'request-1');

  return c.json({
    id: params.id,
    trace: c.valid('trace'),
  });
});
```

## Cookies

```ts
app.get('/session', (c) => {
  const session = c.cookie('session');
  c.setCookie('theme', 'dark', { httpOnly: true, sameSite: 'Lax' });
  return c.json({ session });
});
```

## Response helpers

- `c.text()`
- `c.json()`
- `c.html()`
- `c.redirect()`
- `c.stream()`
- `c.sse()`
- `c.download()`
- `c.notFound()`

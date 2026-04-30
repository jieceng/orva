# Context and Responses

`Context` is the core object for each request. It centralizes request reading, response building, shared variables, validation results, and post-processing hooks.

## Reading the request

```ts
app.post('/echo', async (c) => {
  const json = await c.req.json();
  return c.json({ json, query: c.query, url: c.url.toString() });
});
```

Available fields:

- `c.req`
- `c.url`
- `c.params`
- `c.query`

## Sharing variables

```ts
app.use(async (c, next) => {
  c.set('requestStart', Date.now());
  await next();
});

app.get('/stats', (c) => c.json({ start: c.get('requestStart') }));
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

Cookie support is built into `Context`, without an extra middleware:

```ts
app.get('/session', (c) => {
  const session = c.cookie('session');
  c.setCookie('theme', 'dark', { httpOnly: true, sameSite: 'Lax' });
  return c.json({ session });
});
```

## Response helpers

```ts
app.get('/page', (c) => c.html('<h1>Hello</h1>'));
app.get('/json', (c) => c.json({ ok: true }));
app.get('/jump', (c) => c.redirect('/login'));
```

Available helpers:

- `c.text()`
- `c.json()`
- `c.html()`
- `c.redirect()`
- `c.stream()`
- `c.sse()`
- `c.download()`
- `c.notFound()`

## Post-response processing

`c.after()` lets you attach headers, compression, telemetry, and similar logic after the response is created:

```ts
app.use(async (c, next) => {
  c.after((response) => {
    response.headers.set('x-served-by', 'orva');
    return response;
  });
  await next();
});
```

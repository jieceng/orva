# Context and Responses

`Context` is the per-request core object. It centralizes request reads, response helpers, shared variables, validated data and response finalizers.

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

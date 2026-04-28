# Context 与响应

`Context` 是每次请求的核心对象。它统一承载请求读取、响应构造、变量共享、校验结果和后处理钩子。

## 请求读取

```ts
app.post('/echo', async (c) => {
  const json = await c.req.json();
  return c.json({ json, query: c.query, url: c.url.toString() });
});
```

可用字段：

- `c.req`
- `c.url`
- `c.params`
- `c.query`

## 变量共享

```ts
app.use(async (c, next) => {
  c.set('requestStart', Date.now());
  await next();
});

app.get('/stats', (c) => c.json({ start: c.get('requestStart') }));
```

## 校验结果读取

validator 成功后，可以通过 `c.valid()` 获取类型化数据：

```ts
app.post('/users', zodValidator('json', schema), (c) => {
  const body = c.valid('json');
  return c.json(body, 201);
});
```

## Cookie

Cookie 能力直接内置在 Context 上，无需额外 middleware：

```ts
app.get('/session', (c) => {
  const session = c.cookie('session');
  c.setCookie('theme', 'dark', { httpOnly: true, sameSite: 'Lax' });
  return c.json({ session });
});
```

## 响应助手

```ts
app.get('/page', (c) => c.html('<h1>Hello</h1>'));
app.get('/json', (c) => c.json({ ok: true }));
app.get('/jump', (c) => c.redirect('/login'));
```

可用助手：

- `c.text()`
- `c.json()`
- `c.html()`
- `c.redirect()`
- `c.stream()`
- `c.sse()`
- `c.download()`
- `c.notFound()`

## 响应后置处理

`c.after()` 允许在响应生成后附加头、压缩、埋点等逻辑：

```ts
app.use(async (c, next) => {
  c.after((response) => {
    response.headers.set('x-served-by', 'nano');
    return response;
  });
  await next();
});
```

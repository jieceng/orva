# 路由与组合

## HTTP 方法

`orva` 提供常见 HTTP 方法与 `all()`：

```ts
const app = createOrva();

app.get('/posts', (c) => c.json([]));
app.post('/posts', (c) => c.text('created', 201));
app.patch('/posts/:id', (c) => c.text(`patched ${c.params.id}`));
app.all('/health', (c) => c.text('ok'));
```

## 路径参数与通配

```ts
app.get('/users/:id', (c) => c.json({ id: c.params.id }));
app.get('/files/*', (c) => c.text(c.params['*']));
```

`HEAD` 会回退到 `GET` 处理器，这对健康检查和简单资源接口很实用。

## 分组

```ts
const app = createOrva().group('/api', (api) => {
  return api
    .get('/ping', (c) => c.json({ ok: true }))
    .get('/version', (c) => c.text('v1'));
});
```

## 路由挂载

```ts
const users = createOrva()
  .get('/users', (c) => c.json([]))
  .get('/users/:id', (c) => c.json({ id: c.params.id }));

const app = createOrva().route('/api', users);
```

这类写法对于 RPC 类型推导尤其友好，因为子应用的路由注册表会被保留下来。

## 路由级中间件

```ts
import { basicAuth } from 'orva/middlewares';

app.get(
  '/admin',
  basicAuth({ username: 'admin', password: 'secret' }),
  (c) => c.text('ok'),
);
```

## 错误处理与 404

```ts
const app = createOrva()
  .notFound((c) => c.json({ error: 'Not Found' }, 404))
  .onError((err, c) => c.json({ error: err.message }, 500));
```

## 建议

- 平台入口只负责 `serve`。
- 路由树按业务域拆分为子应用。
- 共享中间件放全局，业务鉴权放路由级或分组级。

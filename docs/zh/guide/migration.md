# 从 Express 或 Hono 迁移

如果你已经有一个 Express 或 Hono 服务，想逐步迁到 `orva`，而不是整套重写，这一页就是给你的。

## 先建立新的心智模型

| 现有框架写法 | `orva` 对应方式 |
| --- | --- |
| 直接修改 `res` 并结束响应 | 返回 `c.json()`、`c.text()`、`c.html()` 或 `c.redirect()` |
| `req.params.id` 或 `c.req.param('id')` | `c.params.id` |
| `req.query.q` 或 `c.req.query('q')` | `c.query.q` |
| `res.locals` 或临时给 request 挂属性 | `c.set()` / `c.get()` |
| 手写 body TypeScript 接口 | `validator()` / `zodValidator()` + `c.valid()` |

最大的差别在于，`orva` 会把请求处理看成一条契约链：

1. middleware 可以补充 vars 和元数据
2. validator 定义可信输入
3. handler 返回 typed response
4. RPC 和 OpenAPI 复用同一套路由契约

## 从 Express 到 `orva`

一个典型的 Express 路由通常长这样：

```ts
import express from 'express';

const app = express();
app.use(express.json());

app.get('/users/:id', (req, res) => {
  res.json({
    id: req.params.id,
    q: req.query.q ?? null,
  });
});
```

对应的 `orva` 写法会更直接，因为 Web `Request` 已经在上下文里：

```ts
import { createOrva } from 'orvajs';
import { serveNode } from 'orvajs/adapters/node';

const app = createOrva().get('/users/:id', (c) => c.json({
  id: c.params.id,
  q: c.query.q ?? null,
}));

serveNode(app, { port: 3000 });
```

迁移时重点注意：

- 只是读取 JSON 时，通常不需要单独的 body parser 中间件，直接 `await c.req.json()` 或使用 validator 即可。
- 不要照搬 `res.locals`，改成在 middleware 里 `c.set('key', value)`，在后续 handler 里 `c.get('key')`。
- handler 的职责是“返回响应”，而不是“修改响应对象后再结束”。

## 从 Hono 到 `orva`

如果你原来就在用 Hono，这两个框架的模型会比较接近，因为都采用了 Fetch 风格的 context。

| Hono | `orva` |
| --- | --- |
| `new Hono()` | `createOrva()` |
| `c.req.param('id')` | `c.params.id` |
| `c.req.query('q')` | `c.query.q` |
| `c.req.header('x-token')` | `c.req.headers.get('x-token')` |
| `c.req.valid('json')` | `c.valid('json')` |
| `app.route('/api', users)` | `app.route('/api', users)` |

`orva` 更值得利用的点在于 middleware、validator、RPC、OpenAPI 会更明确地共用一条契约链。

## 推荐的迁移顺序

### 1. 先迁 handler

第一步只关心路由路径和响应形状：

```ts
const users = createOrva()
  .get('/:id', (c) => c.json({ id: c.params.id }))
  .patch('/:id', (c) => c.text(`patched ${c.params.id}`));

app.route('/users', users);
```

### 2. 再迁全局中间件

把旧项目里的通用链路重组进 `app.use()`：

```ts
import {
  bodyLimit,
  cors,
  logger,
  requestId,
  responseTime,
  secureHeaders,
} from 'orvajs/middlewares';

const app = createOrva().use(
  requestId(),
  logger({ includeQuery: true }),
  cors(),
  secureHeaders(),
  bodyLimit({ maxBytes: 1024 * 1024 }),
  responseTime(),
);
```

### 3. 用 validator 替换手写输入类型

```ts
import { z } from 'zod';
import { zodValidator } from 'orvajs/validator/zod';

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

app.post(
  '/users',
  zodValidator('json', createUserSchema),
  (c) => c.json(c.valid('json'), 201),
);
```

通常这一阶段对类型体验的提升最大。

### 4. 路由稳定后再补 RPC 和 OpenAPI

当 handler 契约已经干净稳定后，再让 `orva` 复用这些信息生成 typed client 和文档，比额外再维护一层 schema 更省心。

## 不要原样搬运的东西

- 不要保留旧的 Express body-parser 习惯，除非你确实需要自定义解析过程。
- 不要把 Hono helper 一比一映射过去，直接适应 `c.params`、`c.query`、`c.valid()` 这套更扁平的模型。
- 如果 validator 已经拥有输入契约，就不要再重复写一套请求接口类型。
- 如果你希望静态资源响应仍然经过日志、`etag()`、`compress()` 等处理中间件，不要把 `serveStatic()` 放得太靠前。

## 继续阅读

- [类型链路](/zh/guide/type-flow)
- [Middleware Cookbook](/zh/recipes/middleware-cookbook)
- [REST API Recipe](/zh/recipes/rest-api)

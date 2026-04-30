# 中间件与类型累积

这一页关注的是 `orva` 在真实服务里的用法，而不是单一路由 demo。

## `app.use()` 不只是运行时链路

在 `orva` 中，`app.use()` 同时承担：

- 运行时中间件编排
- `var` 类型累积
- validator 产物向后续路由传播
- OpenAPI / 安全元数据的间接来源

```ts
import { createOrva, defineMiddleware } from 'orvajs';
import { validator } from 'orvajs/validator';

const session = defineMiddleware<{ session: { id: string; role: string } }>(async (c, next) => {
  c.set('session', { id: 'u_1', role: 'admin' });
  await next();
});

const app = createOrva()
  .use(session)
  .use(validator('header', (headers: Record<string, string>) => ({
    authorization: headers.authorization ?? '',
  })));

app.get('/me', (c) => {
  return c.json({
    session: c.get('session'),
    header: c.valid('header'),
  });
});
```

## 推荐的导入策略

### 聚合导入

适合内部项目、原型或中小型应用：

```ts
import { cors, secureHeaders, requestId } from 'orvajs/middlewares';
```

### 细粒度导入

适合 npm 包、模板仓库、共享基建和对 tree-shaking 敏感的项目：

```ts
import { cors } from 'orvajs/middlewares/cors';
import { secureHeaders } from 'orvajs/middlewares/secure-headers';
import { requestId } from 'orvajs/middlewares/request-id';
```

<OrvaImportPlayground />

## 推荐的生产默认栈

```ts
import {
  bodyLimit,
  cors,
  logger,
  requestId,
  responseTime,
  secureHeaders,
} from 'orvajs/middlewares';

app.use(
  requestId(),
  logger(),
  cors(),
  secureHeaders(),
  bodyLimit({ maxBytes: 1024 * 1024 }),
  responseTime(),
);
```

按需继续补：

- `basicAuth()` / `bearerAuth()` / `apiKeyAuth()`
- `rateLimit()`
- `etag()`
- `serveStatic()`
- `compress()`

如果你不想自己从零拼装中间件栈，可以直接继续看 [Middleware Cookbook](/zh/recipes/middleware-cookbook)。

## 一个更完整的 API 入口示例

```ts
import { createOrva } from 'orvajs';
import { zodValidator } from 'orvajs/validator/zod';
import {
  basicAuth,
  bodyLimit,
  logger,
  requestId,
  responseTime,
  secureHeaders,
} from 'orvajs/middlewares';
import { z } from 'zod';

const app = createOrva()
  .use(requestId(), logger(), secureHeaders(), bodyLimit({ maxBytes: 1024 * 1024 }), responseTime())
  .use(basicAuth({ users: { admin: 'secret' } }))
  .post(
    '/admin/users',
    zodValidator('json', z.object({
      name: z.string().min(1),
      role: z.enum(['admin', 'editor', 'viewer']),
    })),
    (c) => c.json({
      createdBy: c.get('requestId'),
      user: c.valid('json'),
    }, 201),
  );
```

## 中间件顺序建议

推荐把中间件按照下面的顺序思考：

1. 请求标识与日志：`requestId()` `logger()`
2. 访问控制与安全：`cors()` `secureHeaders()` `basicAuth()` `requireOrigin()`
3. 输入限制：`bodyLimit()` `timeout()` `rateLimit()`
4. 响应修饰：`etag()` `compress()` `cacheControl()`
5. 观测与尾处理：`responseTime()` `serverTiming()` `after()`

## 错误处理建议

统一在应用层设置 `onError()`，避免错误风格四散：

```ts
const app = createOrva().onError((err, c) => {
  return c.json({
    error: 'INTERNAL_ERROR',
    message: err.message,
    requestId: c.get('requestId'),
  }, 500);
});
```

对于校验失败，优先在 validator 层就近返回 `400` / `422`，其余未预期异常再回到 `onError()`。

## 响应后处理建议

`c.after()` 适合处理：

- 追加响应头
- 写审计日志
- 打点与 tracing
- 条件压缩或响应变换

```ts
app.use(async (c, next) => {
  c.after((response) => {
    response.headers.set('x-request-id', c.get('requestId') ?? 'unknown');
    return response;
  });
  await next();
});
```

## 团队实践建议

- 所有跨服务可复用契约尽量进入 validator / OpenAPI / RPC 统一链路。
- 不要从根入口导入 adapters、RPC 或中间件。
- 中间件工厂优先无副作用、纯配置化。
- 对外发布的生态包优先使用 `orvajs/middlewares/*` 子模块路径。
- 静态资源、压缩、缓存头一类能力尽量收敛在边界层，不要分散进业务 handler。

下一步建议继续看 [Middleware Cookbook](/zh/recipes/middleware-cookbook)、[从 Express / Hono 迁移](/zh/guide/migration)、[测试与质量](/zh/guide/testing) 和 [部署与运行时](/zh/guide/deployment)。

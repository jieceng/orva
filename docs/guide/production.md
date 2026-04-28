# 中间件与类型累积

## `app.use()` 不只是运行时链路

在 `nano` 中，`app.use()` 还承担类型累积职责。中间件引入的 `var` 和 validator 产生的已验证数据，都会继续流向后续路由。

```ts
import { createNano, defineMiddleware } from 'nano';
import { validator } from 'nano/validator';

const session = defineMiddleware<{ session: { id: string; role: string } }>(async (c, next) => {
  c.set('session', { id: 'u_1', role: 'admin' });
  await next();
});

const app = createNano()
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
import { cors, secureHeaders, requestId } from 'nano/middlewares';
```

### 细粒度导入

适合 npm 包、模板仓库、共享基建和对 tree-shaking 敏感的项目：

```ts
import { cors } from 'nano/middlewares/cors';
import { secureHeaders } from 'nano/middlewares/secure-headers';
import { requestId } from 'nano/middlewares/request-id';
```

<NanoImportPlayground />

## 推荐的生产默认栈

```ts
import {
  bodyLimit,
  cors,
  logger,
  requestId,
  responseTime,
  secureHeaders,
} from 'nano/middlewares';

app.use(
  requestId(),
  logger(),
  cors(),
  secureHeaders(),
  bodyLimit({ maxSize: 1024 * 1024 }),
  responseTime(),
);
```

按需再补：

- `basicAuth()` / `bearerAuth()` / `apiKeyAuth()`
- `rateLimit()`
- `etag()`
- `serveStatic()`
- `compress()`

## 团队实践建议

- 所有跨服务可复用契约尽量进入 validator / OpenAPI / RPC 统一链路。
- 不要从根入口导入 adapters、RPC 或中间件。
- 中间件工厂优先无副作用、纯配置化。
- 对外发布的生态包优先使用 `nano/middlewares/*` 子模块路径。

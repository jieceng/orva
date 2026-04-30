# Middleware Cookbook

这一页适合这样的场景：你已经知道自己要做的是“公开 API”“带鉴权的写接口”“静态站点”或“面向公网的服务”，但不想从零拼一套中间件链。

## 导入策略

在业务应用里，直接用聚合导出：

```ts
import { cors, requestId, secureHeaders } from 'orvajs/middlewares';
```

在共享库、starter、基础设施包里，优先用细粒度子路径导出：

```ts
import { cors } from 'orvajs/middlewares/cors';
import { requestId } from 'orvajs/middlewares/request-id';
```

## 场景 1：公开 JSON API

这是大多数 HTTP API 都适合的默认栈。

```ts
import { createOrva } from 'orvajs';
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
  cors({ origin: ['https://app.example.com'] }),
  secureHeaders(),
  bodyLimit({ maxBytes: 1024 * 1024 }),
  responseTime(),
);
```

这个顺序的理由：

- `requestId()` 和 `logger()` 放前面，所有请求都会拿到追踪信息。
- `cors()` 和 `secureHeaders()` 会同时影响成功和失败响应。
- `bodyLimit()` 会在 validator 做更多工作前先挡掉超大请求体。
- `responseTime()` 放后面更容易覆盖整条链路耗时。

## 场景 2：带鉴权的写接口

适合管理后台、内部系统、合作方接入等场景。

```ts
import { z } from 'zod';
import { createOrva } from 'orvajs';
import {
  apiKeyAuth,
  idempotencyKey,
  requireJson,
  requestId,
  secureHeaders,
} from 'orvajs/middlewares';
import { zodValidator } from 'orvajs/validator/zod';

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const app = createOrva()
  .use(
    requestId(),
    secureHeaders(),
    apiKeyAuth({ key: process.env.API_KEY ?? 'dev-key' }),
    requireJson(),
    idempotencyKey(),
  )
  .post(
    '/users',
    zodValidator('json', createUserSchema),
    (c) => c.json(c.valid('json'), 201),
  );
```

这里的实战规则：

- 先做访问控制，再进业务逻辑
- `requireJson()` 放在 JSON validator 前面
- validator 不只是“拦坏请求”，更是“定义 handler 的可信输入”

## 场景 3：静态文件或 SPA 托管

当你希望 `orva` 直接提供静态资源时，可以这样组织：

```ts
import { createOrva } from 'orvajs';
import {
  compress,
  etag,
  logger,
  requestId,
  serveStatic,
} from 'orvajs/middlewares';

const app = createOrva().use(
  requestId(),
  logger(),
  etag(),
  compress({ threshold: 2048 }),
  serveStatic({
    root: './public',
    index: 'index.html',
    spaFallback: 'index.html',
    cacheControl: (path) => path.startsWith('assets/')
      ? 'public, max-age=31536000, immutable'
      : 'no-cache',
  }),
);
```

关键点：

如果某个 middleware 在没有 `await next()` 的情况下直接返回响应，后面的 middleware 就不会再执行。所以 `serveStatic()` 应该放在那些仍然需要作用于静态响应的中间件之后。

## 场景 4：面向公网的 API 加固

如果接口对外开放、需要考虑滥用保护，这套比较合适：

```ts
import { createOrva } from 'orvajs';
import {
  clientIp,
  hostAllowlist,
  httpsRedirect,
  rateLimit,
  requireAccept,
  secureHeaders,
} from 'orvajs/middlewares';

const app = createOrva().use(
  httpsRedirect(),
  secureHeaders(),
  clientIp(),
  hostAllowlist(['api.example.com']),
  requireAccept(['application/json']),
  rateLimit({
    limit: 120,
    windowMs: 60_000,
    keyGenerator: (c) => c.get('ip') ?? 'unknown',
  }),
);
```

这套主要覆盖：

- 协议约束
- Host 过滤
- 内容协商
- 突发流量保护

## 能省很多返工的排序规则

除非你有很明确的理由，否则优先按这个顺序组装：

1. 请求标识和日志
2. 协议与安全响应头
3. 鉴权、origin、host、rate limit 等 guard
4. 内容要求和 body 限制
5. validators
6. `etag()`、`compress()` 这类响应整形
7. 静态资源托管尽量靠后

## 按“工作职责”选中间件

| 职责 | 中间件 |
| --- | --- |
| 请求追踪 | `requestId()`、`responseTime()`、`logger()` |
| 鉴权 | `basicAuth()`、`bearerAuth()`、`apiKeyAuth()` |
| 抗滥用 | `rateLimit()`、`bodyLimit()`、`hostAllowlist()`、`blockUserAgents()` |
| 响应策略 | `cors()`、`cacheControl()`、`noStore()`、`vary()` |
| 浏览器安全 | `secureHeaders()`、`contentSecurityPolicy()`、`strictTransportSecurity()` |
| 资源分发 | `serveStatic()`、`etag()`、`compress()` |

## 继续阅读

- [中间件目录](/zh/middlewares)
- [类型链路](/zh/guide/type-flow)
- [REST API Recipe](/zh/recipes/rest-api)

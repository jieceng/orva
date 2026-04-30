# Middleware Cookbook

这一页适合这样的场景：你已经知道自己要做的是“公开 API”“带鉴权的写接口”“静态站点”或“面向公网的服务”，但不想从零开始拼装整条中间件链。

## 导入策略

在业务应用中，直接使用聚合导出即可：

```ts
import { cors, requestId, secureHeaders } from 'orvajs/middlewares';
```

在共享库、starter 或基础设施包中，优先使用细粒度子路径导出：

```ts
import { cors } from 'orvajs/middlewares/cors';
import { requestId } from 'orvajs/middlewares/request-id';
```

## 场景 1：公开 JSON API

这是大多数普通 HTTP API 都适合的默认组合。

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

推荐按这个顺序组织的原因：

- `requestId()` 和 `logger()` 放在前面，所有请求都会带上追踪信息。
- `cors()` 和 `secureHeaders()` 会同时影响成功和失败响应。
- `bodyLimit()` 会在 validator 做更多工作之前先拦掉超大的请求体。
- `responseTime()` 放在后面，更容易覆盖整条链路的耗时。

## 场景 2：带鉴权的写接口

适合管理后台、内部系统或合作方接入这类写操作接口。

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

这里有几个实用规则：

- 先做访问控制，再进入业务逻辑
- `requireJson()` 放在 JSON validator 前面
- validator 不只是“拦截非法请求”，更是在“定义 handler 可以信任的输入”

## 场景 3：静态文件或 SPA 托管

如果你希望 `orva` 直接分发静态资源，可以这样组织：

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

关键点如下：

如果某个 middleware 没有执行 `await next()` 就直接返回响应，后面的 middleware 就不会继续运行。所以 `serveStatic()` 应该放在那些仍然需要作用于静态响应的中间件之后。

## 场景 4：面向公网的 API 加固

如果接口直接暴露在公网、需要考虑滥用防护，这一组更合适：

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

这套组合主要解决：

- 协议约束
- Host 过滤
- 内容协商
- 突发流量保护

## 能减少返工的排序规则

除非你有非常明确的理由，否则建议优先按这个顺序组织：

1. 请求标识和日志
2. 协议与安全响应头
3. 鉴权、origin、host、rate limit 等防护层
4. 内容要求和 body 限制
5. validator
6. `etag()`、`compress()` 这类响应整形
7. 静态资源托管尽量靠后

## 按职责选择中间件

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
- [REST API 实践示例](/zh/recipes/rest-api)

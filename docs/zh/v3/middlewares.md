# 中间件目录

`orva` 已经有比较完整的中间件层，但前提是这些能力得“找得到、看得懂、拿来就能用”。这页就是当前主线版本的完整目录：每个中间件都包含用途说明、子模块导入路径和最小示例。

<OrvaMiddlewareMap locale="zh" />

## 导入方式

应用项目里，优先用聚合导入：

```ts
import { cors, requestId, secureHeaders } from 'orva/middlewares';
```

库、模板、脚手架、共享基建里，优先用细粒度子路径：

```ts
import { cors } from 'orva/middlewares/cors';
import { requestId } from 'orva/middlewares/request-id';
import { secureHeaders } from 'orva/middlewares/secure-headers';
```

## 快速选择

| 场景 | 推荐组合 |
| --- | --- |
| 浏览器 API | `requestId()` `logger()` `cors()` `secureHeaders()` `bodyLimit()` `responseTime()` |
| 内部后台 | `basicAuth()` `requireOrigin()` `rateLimit()` `secureHeaders()` |
| 对外接口 | `bearerAuth()` 或 `apiKeyAuth()` 再配 `rateLimit()` `requestId()` `responseTime()` |
| 静态资源 | `serveStatic()` 配合 `etag()` `compress()` `cacheControl()` |
| 安全基线 | `secureHeaders()` 再加 `contentSecurityPolicy()` 和 `strictTransportSecurity()` |

::: tip 如何看示例
示例都故意保持最小配置，方便你直接复制。更大的项目建议把这些栈收敛进路由组或共享中间件工厂。
:::

<a id="authentication"></a>

## Authentication

这一组负责鉴权，并会把认证结果写入下游 `Context` 变量。

| 中间件 | 导入路径 | 适用场景 | 最小示例 |
| --- | --- | --- | --- |
| `basicAuth()` | `orva/middlewares/basic-auth` | 浏览器登录弹窗、内部控制台、简易后台 | `app.use(basicAuth({ users: { admin: 'secret' } }))` |
| `bearerAuth()` | `orva/middlewares/bearer-auth` | Bearer Token API、服务间调用 | `app.use(bearerAuth({ token: ['token-a', 'token-b'] }))` |
| `apiKeyAuth()` | `orva/middlewares/api-key-auth` | Header / Query 形式的 API Key | `app.use(apiKeyAuth({ key: ['k1'], headerName: 'X-API-Key' }))` |

### 认证组合示例

```ts
import { createOrva } from 'orva';
import { apiKeyAuth, basicAuth, bearerAuth } from 'orva/middlewares';

const app = createOrva()
  .get('/admin', basicAuth({ users: { admin: 'secret' } }), (c) => c.text('ok'))
  .get('/internal', bearerAuth({ token: 'internal-token' }), (c) => c.text('ok'))
  .get('/partners', apiKeyAuth({ key: ['partner-key'], queryName: 'apiKey' }), (c) => c.text('ok'));
```

<a id="guards"></a>

## Guards

这组中间件适合在业务 handler 之前就把不合格请求挡掉。

| 中间件 | 导入路径 | 适用场景 | 最小示例 |
| --- | --- | --- | --- |
| `allowMethods()` | `orva/middlewares/allow-methods` | 只允许少数方法通过 | `app.use(allowMethods(['GET', 'POST']))` |
| `blockMethods()` | `orva/middlewares/block-methods` | 禁止危险或不支持的方法 | `app.use(blockMethods(['TRACE', 'CONNECT']))` |
| `requireHeader()` | `orva/middlewares/require-header` | 强制要求请求头存在 | `app.use(requireHeader(['x-tenant-id']))` |
| `requireQuery()` | `orva/middlewares/require-query` | 强制要求 query 参数存在 | `app.use(requireQuery(['page']))` |
| `requireJson()` | `orva/middlewares/require-json` | 写请求必须是 `application/json` | `app.use(requireJson())` |
| `requireAccept()` | `orva/middlewares/require-accept` | 强制 `Accept` 协商 | `app.use(requireAccept(['application/json']))` |
| `bodyLimit()` | `orva/middlewares/body-limit` | 拒绝超大请求体 | `app.use(bodyLimit({ maxBytes: 1024 * 1024 }))` |
| `timeout()` | `orva/middlewares/timeout` | 超时后直接返回失败响应 | `app.use(timeout({ ms: 5_000 }))` |
| `rateLimit()` | `orva/middlewares/rate-limit` | 抗突发流量和滥用 | `app.use(rateLimit({ limit: 100, windowMs: 60_000 }))` |
| `hostAllowlist()` | `orva/middlewares/host-allowlist` | 限制有效 Host | `app.use(hostAllowlist(['api.example.com']))` |
| `blockUserAgents()` | `orva/middlewares/block-user-agents` | 屏蔽爬虫或异常客户端 | `app.use(blockUserAgents([/curl/i, 'BadBot']))` |
| `requireOrigin()` | `orva/middlewares/require-origin` | 限制浏览器来源 | `app.use(requireOrigin(['https://app.example.com']))` |
| `idempotencyKey()` | `orva/middlewares/idempotency-key` | 写接口强制 `Idempotency-Key` | `app.use(idempotencyKey())` |
| `csrfOrigin()` | `orva/middlewares/csrf-origin` | 带 body 请求做 CSRF Origin 校验 | `app.use(csrfOrigin(['https://app.example.com']))` |

### 守卫组合示例

```ts
import { createOrva } from 'orva';
import {
  allowMethods,
  bodyLimit,
  idempotencyKey,
  rateLimit,
  requireJson,
  requireOrigin,
} from 'orva/middlewares';

const app = createOrva().use(
  allowMethods(['GET', 'POST', 'PATCH']),
  requireOrigin(['https://app.example.com']),
  requireJson(),
  bodyLimit({ maxBytes: 2 * 1024 * 1024 }),
  idempotencyKey(),
  rateLimit({ limit: 60, windowMs: 60_000 }),
);
```

<a id="http-response"></a>

## HTTP Response

这组负责响应头、重定向、缓存校验器和响应元数据修饰。

| 中间件 | 导入路径 | 适用场景 | 最小示例 |
| --- | --- | --- | --- |
| `poweredBy()` | `orva/middlewares/powered-by` | 添加 `X-Powered-By` | `app.use(poweredBy('orva'))` |
| `responseHeaders()` | `orva/middlewares/response-headers` | 追加静态或动态响应头 | `app.use(responseHeaders({ headers: { 'x-app': 'orva' } }))` |
| `cacheControl()` | `orva/middlewares/cache-control` | 设置缓存策略 | `app.use(cacheControl('public, max-age=60'))` |
| `noStore()` | `orva/middlewares/no-store` | 禁止缓存 | `app.use(noStore())` |
| `vary()` | `orva/middlewares/vary` | 补 `Vary` | `app.use(vary('Origin', 'Accept-Encoding'))` |
| `cors()` | `orva/middlewares/cors` | 浏览器跨域访问 | `app.use(cors({ origin: ['https://app.example.com'], credentials: true }))` |
| `httpsRedirect()` | `orva/middlewares/https-redirect` | HTTP 跳转 HTTPS | `app.use(httpsRedirect({ status: 308 }))` |
| `trailingSlash()` | `orva/middlewares/trailing-slash` | 统一尾斜杠策略 | `app.use(trailingSlash({ mode: 'remove' }))` |
| `etag()` | `orva/middlewares/etag` | 添加强 ETag 和 304 | `app.use(etag())` |
| `responseTag()` | `orva/middlewares/response-tag` | 打一个单独响应头标记 | `app.use(responseTag('x-release', '2026-04'))` |
| `contentType()` | `orva/middlewares/content-type` | 提供默认内容类型 | `app.use(contentType('application/json; charset=utf-8'))` |
| `checksum()` | `orva/middlewares/checksum` | 给响应体加摘要头 | `app.use(checksum('X-Body-SHA1'))` |
| `responseChecksumTrailer()` | `orva/middlewares/response-checksum-trailer` | 输出 `Digest` 风格摘要 | `app.use(responseChecksumTrailer('Digest'))` |
| `contentLength()` | `orva/middlewares/content-length` | 缺失时补 `Content-Length` | `app.use(contentLength())` |

### HTTP 组合示例

```ts
import { createOrva } from 'orva';
import {
  cacheControl,
  cors,
  etag,
  responseHeaders,
  secureHeaders,
  vary,
} from 'orva/middlewares';

const app = createOrva().use(
  cors({ origin: ['https://app.example.com'], credentials: true }),
  secureHeaders(),
  cacheControl('public, max-age=60'),
  vary('Origin', 'Accept-Encoding'),
  responseHeaders({ headers: { 'x-service': 'edge-api' } }),
  etag(),
);
```

<a id="observability"></a>

## Observability

这组负责记录请求信息，并写入响应头或 `c.var`。

| 中间件 | 导入路径 | 适用场景 | 最小示例 |
| --- | --- | --- | --- |
| `logger()` | `orva/middlewares/logger` | 控制台或自定义请求日志 | `app.use(logger({ includeQuery: true }))` |
| `requestId()` | `orva/middlewares/request-id` | 请求关联 ID | `app.use(requestId({ contextKey: 'requestId' }))` |
| `responseTime()` | `orva/middlewares/response-time` | 响应耗时头 | `app.use(responseTime())` |
| `requestMeta()` | `orva/middlewares/request-meta` | 把 method/path/query/headers 写入上下文 | `app.use(requestMeta())` |
| `userAgent()` | `orva/middlewares/user-agent` | 把 `User-Agent` 写入上下文 | `app.use(userAgent())` |
| `clientIp()` | `orva/middlewares/client-ip` | 从代理头提取 IP | `app.use(clientIp())` |
| `serverTiming()` | `orva/middlewares/server-timing` | 输出 `Server-Timing` | `app.use(serverTiming('app;dur=12'))` |
| `requestContext()` | `orva/middlewares/request-context` | 聚合 IP / UA / Origin 信息 | `app.use(requestContext())` |
| `requestSize()` | `orva/middlewares/request-size` | 记录请求大小 | `app.use(requestSize())` |
| `locale()` | `orva/middlewares/locale` | 解析 `Accept-Language` | `app.use(locale('zh-CN'))` |
| `requestBodyText()` | `orva/middlewares/request-body-text` | 保存原始 body 文本 | `app.use(requestBodyText())` |

### 观测组合示例

```ts
import { createOrva } from 'orva';
import {
  clientIp,
  logger,
  requestContext,
  requestId,
  responseTime,
  serverTiming,
} from 'orva/middlewares';

const app = createOrva().use(
  requestId(),
  clientIp(),
  requestContext(),
  logger({ includeQuery: true }),
  responseTime(),
  serverTiming('app;dur=8'),
);
```

<a id="security-headers"></a>

## Security Headers

如果你只是要一套安全默认值，先上 `secureHeaders()`；如果要企业级定制，再拆成单项策略。

| 中间件 | 导入路径 | 适用场景 | 最小示例 |
| --- | --- | --- | --- |
| `contentSecurityPolicy()` | `orva/middlewares/content-security-policy` | CSP 与 report-only 策略 | `app.use(contentSecurityPolicy({ directives: { defaultSrc: [\"'self'\"] } }))` |
| `referrerPolicy()` | `orva/middlewares/referrer-policy` | 控制 Referrer 泄露 | `app.use(referrerPolicy('strict-origin-when-cross-origin'))` |
| `frameOptions()` | `orva/middlewares/frame-options` | 防止点击劫持 | `app.use(frameOptions('DENY'))` |
| `xContentTypeOptions()` | `orva/middlewares/x-content-type-options` | 禁止 MIME sniffing | `app.use(xContentTypeOptions())` |
| `xDnsPrefetchControl()` | `orva/middlewares/x-dns-prefetch-control` | 控制 DNS 预取 | `app.use(xDnsPrefetchControl(false))` |
| `xDownloadOptions()` | `orva/middlewares/x-download-options` | IE 下载安全头 | `app.use(xDownloadOptions())` |
| `xPermittedCrossDomainPolicies()` | `orva/middlewares/x-permitted-cross-domain-policies` | 限制 Adobe/Flash 跨域策略 | `app.use(xPermittedCrossDomainPolicies('none'))` |
| `xXssProtection()` | `orva/middlewares/x-xss-protection` | 兼容旧浏览器 XSS 头 | `app.use(xXssProtection('0'))` |
| `strictTransportSecurity()` | `orva/middlewares/strict-transport-security` | HSTS | `app.use(strictTransportSecurity({ maxAge: 31536000, preload: true }))` |
| `permissionsPolicy()` | `orva/middlewares/permissions-policy` | 限制浏览器能力 | `app.use(permissionsPolicy({ directives: { geolocation: [] } }))` |
| `crossOriginEmbedderPolicy()` | `orva/middlewares/cross-origin-embedder-policy` | COEP | `app.use(crossOriginEmbedderPolicy('require-corp'))` |
| `crossOriginOpenerPolicy()` | `orva/middlewares/cross-origin-opener-policy` | COOP | `app.use(crossOriginOpenerPolicy('same-origin'))` |
| `crossOriginResourcePolicy()` | `orva/middlewares/cross-origin-resource-policy` | CORP | `app.use(crossOriginResourcePolicy('same-origin'))` |
| `originAgentCluster()` | `orva/middlewares/origin-agent-cluster` | Origin-Agent-Cluster 隔离 | `app.use(originAgentCluster('?1'))` |
| `secureHeaders()` | `orva/middlewares/secure-headers` | 一组合理的安全默认头 | `app.use(secureHeaders())` |

### 安全头组合示例

```ts
import { createOrva } from 'orva';
import {
  contentSecurityPolicy,
  secureHeaders,
  strictTransportSecurity,
} from 'orva/middlewares';

const app = createOrva().use(
  secureHeaders(),
  contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      scriptSrc: ["'self'"],
    },
  }),
  strictTransportSecurity({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  }),
);
```

<a id="asset-delivery"></a>

## Asset Delivery

这组通常会在文档站、控制台或上传文件入口里最先用到。

| 中间件 | 导入路径 | 适用场景 | 最小示例 |
| --- | --- | --- | --- |
| `serveStatic()` | `orva/middlewares/serve-static` | 静态文件、manifest、SPA fallback | `app.get('/assets/*', serveStatic({ root: 'public', prefix: '/assets', etag: true }))` |
| `compress()` | `orva/middlewares/compress` | Brotli / gzip / deflate 压缩 | `app.use(compress({ threshold: 1024, encodings: ['br', 'gzip'] }))` |

### 静态资源组合示例

```ts
import { createOrva } from 'orva';
import { cacheControl, compress, etag, serveStatic } from 'orva/middlewares';

const app = createOrva()
  .use(compress({ threshold: 1024, encodings: ['br', 'gzip'] }), cacheControl('public, max-age=600'), etag())
  .get('/assets/*', serveStatic({
    root: 'public',
    prefix: '/assets',
    index: false,
    etag: true,
  }))
  .get('/*', serveStatic({
    root: 'public',
    spaFallback: 'index.html',
  }));
```

<a id="cookie-utilities"></a>

## Cookie Utilities

这一组不是 `app.use()` 中间件，而是底层工具函数，适合给自定义中间件、适配器、认证流程和测试使用。

| 工具 | 导入路径 | 适用场景 | 最小示例 |
| --- | --- | --- | --- |
| `getCookie()` | `orva/middlewares/cookie` | 从请求里读单个 cookie | `const session = getCookie(request, 'session')` |
| `parseCookieHeader()` | `orva/middlewares/cookie` | 解析整条 `cookie` header | `const cookies = parseCookieHeader(request.headers.get('cookie'))` |
| `serializeCookie()` | `orva/middlewares/cookie` | 生成 `Set-Cookie` | `serializeCookie('theme', 'dark', { path: '/', httpOnly: true })` |
| `serializeDeleteCookie()` | `orva/middlewares/cookie` | 生成删除 cookie 的 header 值 | `serializeDeleteCookie('session', { path: '/' })` |

### Cookie 组合示例

```ts
import { defineMiddleware } from 'orva';
import { getCookie, serializeCookie, serializeDeleteCookie } from 'orva/middlewares/cookie';

export const sessionCookies = defineMiddleware(async (c, next) => {
  const session = getCookie(c.req, 'session');

  c.after((response) => {
    if (!session) {
      response.headers.append('Set-Cookie', serializeCookie('session', 'new-session', {
        path: '/',
        httpOnly: true,
      }));
    }
    return response;
  });

  await next();
});

export function logoutHeaders(): Headers {
  return new Headers({
    'Set-Cookie': serializeDeleteCookie('session', { path: '/' }),
  });
}
```

## 新项目先上什么

如果你只是想先拿到一套稳妥的默认栈，最短路径仍然是：

```ts
import { createOrva } from 'orva';
import {
  bodyLimit,
  cors,
  logger,
  requestId,
  responseTime,
  secureHeaders,
} from 'orva/middlewares';

const app = createOrva().use(
  requestId(),
  logger(),
  cors(),
  secureHeaders(),
  bodyLimit({ maxBytes: 1024 * 1024 }),
  responseTime(),
);
```

先跑起来，再按真实路由需求继续叠加。

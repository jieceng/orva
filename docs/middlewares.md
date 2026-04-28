# 中间件目录

`orva` 的中间件设计目标很明确：提供生产常用能力，同时保持细粒度子模块导出，方便 tree-shaking、生态发布和模板复用。

## 导入方式

### 聚合导入

```ts
import { cors, requestId, secureHeaders } from 'orva/middlewares';
```

### 细粒度导入

```ts
import { cors } from 'orva/middlewares/cors';
import { requestId } from 'orva/middlewares/request-id';
import { secureHeaders } from 'orva/middlewares/secure-headers';
```

推荐对外发布代码、脚手架和共享包使用第二种方式。

## 常见组合

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
  bodyLimit({ maxSize: 1024 * 1024 }),
  responseTime(),
);
```

## 分类总览

| 分类 | 能力 |
| --- | --- |
| Authentication | `basicAuth` `bearerAuth` `apiKeyAuth` |
| Guards | `allowMethods` `blockMethods` `requireHeader` `requireQuery` `requireJson` `requireAccept` `bodyLimit` `timeout` `rateLimit` `hostAllowlist` `blockUserAgents` `requireOrigin` `idempotencyKey` `csrfOrigin` |
| HTTP / Response | `poweredBy` `responseHeaders` `cacheControl` `noStore` `vary` `cors` `httpsRedirect` `trailingSlash` `etag` `responseTag` `contentType` `checksum` `responseChecksumTrailer` `contentLength` |
| Observability | `logger` `requestId` `responseTime` `requestMeta` `userAgent` `clientIp` `serverTiming` `requestContext` `requestSize` `locale` `requestBodyText` |
| Security Headers | `contentSecurityPolicy` `referrerPolicy` `frameOptions` `xContentTypeOptions` `xDnsPrefetchControl` `xDownloadOptions` `xPermittedCrossDomainPolicies` `xXssProtection` `strictTransportSecurity` `permissionsPolicy` `crossOriginEmbedderPolicy` `crossOriginOpenerPolicy` `crossOriginResourcePolicy` `originAgentCluster` `secureHeaders` |
| Asset / Delivery | `serveStatic` `compress` |
| Cookie Utils | `getCookie` `parseCookieHeader` `serializeCookie` `serializeDeleteCookie` |

## Authentication

```ts
import { basicAuth, bearerAuth, apiKeyAuth } from 'orva/middlewares';

app.get('/admin', basicAuth({ username: 'admin', password: 'secret' }), (c) => c.text('ok'));
app.get('/api', bearerAuth({ token: 'token-1' }), (c) => c.text('ok'));
app.get('/internal', apiKeyAuth({ header: 'x-api-key', keys: ['k1', 'k2'] }), (c) => c.text('ok'));
```

## Guards

### 常见输入保护

```ts
app.use(
  requireJson(),
  bodyLimit({ maxSize: 2 * 1024 * 1024 }),
  timeout({ timeout: 5_000 }),
);
```

### 访问规则

```ts
app.use(
  allowMethods({ methods: ['GET', 'POST'] }),
  hostAllowlist({ hosts: ['api.example.com'] }),
  requireOrigin({ origins: ['https://app.example.com'] }),
);
```

### 稳定性控制

```ts
app.use(
  idempotencyKey(),
  rateLimit({ limit: 100, windowMs: 60_000 }),
);
```

## HTTP / Response

```ts
app.use(
  cors(),
  cacheControl('public, max-age=60'),
  etag(),
  vary(['Accept-Encoding', 'Origin']),
);
```

## Observability

```ts
app.use(
  requestId(),
  logger(),
  responseTime(),
  serverTiming(),
  requestMeta(),
);
```

如果你需要结合应用变量类型：

```ts
type AppVars = { requestId: string };

app.use(logger<AppVars>({
  log(message, c) {
    console.log(c.get('requestId'), message);
  },
}));
```

## Security Headers

最省心的方式是直接启用 `secureHeaders()`：

```ts
app.use(secureHeaders());
```

如果要做更精细的企业安全基线，可以按项拆开：

```ts
app.use(
  contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
    },
  }),
  strictTransportSecurity({ maxAge: 31536000, includeSubDomains: true }),
  permissionsPolicy({
    geolocation: [],
    camera: [],
  }),
);
```

## 资源与传输

### 静态资源

```ts
import { serveStatic } from 'orva/middlewares/serve-static';

app.get('/assets/*', serveStatic({
  root: 'public',
  prefix: '/assets',
  etag: true,
  spaFallback: 'index.html',
}));
```

### 压缩

```ts
import { compress } from 'orva/middlewares/compress';

app.use(compress({
  gzip: true,
  br: true,
  deflate: true,
}));
```

## Cookie 工具

Cookie 读取与写入能力已经集成进 `Context`，此外还提供纯工具函数：

```ts
import { getCookie, serializeCookie } from 'orva/middlewares';

const session = getCookie(request, 'session');
const header = serializeCookie('theme', 'dark', { httpOnly: true, sameSite: 'Lax' });
```

## 选择建议

- 平台无关的业务接口：`requestId + logger + cors + secureHeaders + bodyLimit`
- 面向浏览器应用：再加 `etag + compress + serveStatic`
- 内部控制台：再加 `basicAuth` 或 `bearerAuth`
- 公开 API：再加 `rateLimit + requireOrigin + idempotencyKey`

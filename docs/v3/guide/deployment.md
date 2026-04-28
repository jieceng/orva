# 部署与运行时

`orva` 的应用层代码围绕 `app.fetch(request)` 组织，平台差异主要收敛在适配器层。

## 平台选择建议

| 目标平台 | 推荐入口 | 典型场景 |
| --- | --- | --- |
| Node.js | `serveNode` | 常规 API 服务、容器、PM2、systemd |
| Bun | `serveBun` | 轻量高性能实验或 Bun 原生部署 |
| Deno | `serveDeno` | Deno 原生 HTTP 服务 |
| Cloudflare | `createCloudflareWorker` | Edge API、全球低延迟分发 |
| Vercel | `createAppRouteHandler` `createVercelEdgeHandler` | App Router / Edge Route |
| AWS Lambda | `createAWSLambdaHandler` | API Gateway + Lambda |
| Netlify | `createNetlifyFunctionHandler` `createNetlifyEdgeHandler` | Functions / Edge Functions |
| Azure | `createAzureFunctionHandler` | Azure Functions |

更多入口见 [适配器](/adapters)。

## Node.js 部署

```ts
import { createOrva } from 'orva';
import { serveNode } from 'orva/adapters/node';

const app = createOrva().get('/health', (c) => c.json({ ok: true }));

serveNode(app, { port: Number(process.env.PORT ?? 3000) });
```

适合：

- Docker / Kubernetes
- ECS / Fly.io / Railway / Render
- 自建 VM + systemd / PM2

## Edge / Serverless 部署

保持 `app` 独立，平台入口只负责接线：

```ts
import { createOrva } from 'orva';
import { createCloudflareWorker } from 'orva/adapters/cloudflare';

export const app = createOrva().get('/health', (c) => c.json({ ok: true }));

export default createCloudflareWorker(app);
```

推荐结构：

```text
src/
  app.ts
platform/
  node.ts
  cloudflare.ts
  lambda.ts
```

## 多平台共用一套业务代码

```ts
// src/app.ts
export const app = createOrva()
  .get('/health', (c) => c.json({ ok: true }))
  .post('/users', createUserHandler);
```

```ts
// platform/node.ts
import { serveNode } from 'orva/adapters/node';
import { app } from '../src/app';

serveNode(app, { port: 3000 });
```

```ts
// platform/vercel.ts
import { createAppRouteHandler } from 'orva/adapters/vercel';
import { app } from '../src/app';

export const { GET, POST, PUT, DELETE, PATCH } = createAppRouteHandler(app);
```

## 生产建议

### Node 服务

- 在反向代理前使用 `secureHeaders()`、`compress()`、`etag()` 等边界能力
- 日志、request id、响应时间优先全局挂载
- 静态资源优先交给 CDN 或网关；如需框架层托管，再使用 `serveStatic()`

### Serverless / Edge

- 避免在模块初始化阶段做重连接或重 CPU 工作
- 把大体积依赖隔离到真正需要的路由
- 优先使用细粒度子模块导入，减少部署包体

## 环境变量建议

```ts
const port = Number(process.env.PORT ?? 3000);
const isProd = process.env.NODE_ENV === 'production';
const apiBase = process.env.API_BASE_URL ?? 'http://localhost:3000';
```

建议在应用外部完成：

- 环境变量校验
- 机密注入
- 日志采集与监控 SDK 初始化

## 发布前检查清单

1. `pnpm typecheck`
2. `pnpm test`
3. `pnpm build`
4. `pnpm docs:build`
5. 检查 `package.json` `exports` 与发布文件列表
6. 检查目标平台入口是否只做薄适配，不混入业务逻辑

## 常见部署策略

| 场景 | 建议 |
| --- | --- |
| 企业内网 API | Node + `serveNode()` + 反向代理 |
| 公网 BFF | Node / Bun + `cors` `secureHeaders` `bodyLimit` `rateLimit` |
| 全球低延迟接口 | Cloudflare / Vercel Edge |
| 云函数按量付费 | AWS Lambda / Netlify / Azure |

如果你在做选型比较，继续看 [常见问题](/guide/faq)。

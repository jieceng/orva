# 适配器

`nano` 以 `app.fetch(request)` 为统一运行时入口，再通过子模块适配到不同平台。

## 平台总览

| 平台 | 导出 | 适用场景 |
| --- | --- | --- |
| Node.js | `serveNode` | 常规服务器、容器、PM2、systemd |
| Deno | `serveDeno` `createDenoHandler` | Deno 原生 HTTP 服务 |
| Bun | `serveBun` `createBunHandler` | Bun 原生高性能服务 |
| Cloudflare | `createCloudflareWorker` `createPagesFunction` `createDefaultWorker` | Workers / Pages |
| AWS Lambda | `createAWSLambdaHandler` | API Gateway + Lambda |
| Netlify | `createNetlifyFunctionHandler` `createNetlifyEdgeHandler` | Function / Edge Function |
| Azure | `createAzureFunctionHandler` `createAzureFetchHandler` | Azure Functions |
| Vercel | `createVercelEdgeHandler` `createAppRouteHandler` | Edge / App Router |

## Node.js

```ts
import { createNano } from 'nano';
import { serveNode } from 'nano/adapters/node';

const app = createNano().get('/', (c) => c.text('hello from node'));

serveNode(app, { port: 3000 });
```

## Deno

```ts
import { createNano } from 'nano';
import { serveDeno } from 'nano/adapters/deno';

const app = createNano().get('/', (c) => c.text('hello from deno'));

serveDeno(app, { port: 8000 });
```

## Bun

```ts
import { createNano } from 'nano';
import { serveBun } from 'nano/adapters/bun';

const app = createNano().get('/', (c) => c.text('hello from bun'));

serveBun(app, { port: 3000, development: true });
```

## Cloudflare Workers / Pages

```ts
import { createNano } from 'nano';
import {
  createCloudflareWorker,
  createPagesFunction,
} from 'nano/adapters/cloudflare';

const app = createNano().get('/', (c) => c.text('hello from cloudflare'));

export default createCloudflareWorker(app);
export const onRequest = createPagesFunction(app);
```

如果你只需要默认 worker 形式，也可以直接使用：

```ts
import { createDefaultWorker } from 'nano/adapters/cloudflare';
export default createDefaultWorker(app);
```

## AWS Lambda

```ts
import { createNano } from 'nano';
import { createAWSLambdaHandler } from 'nano/adapters/aws-lambda';

const app = createNano().post('/echo', async (c) => c.json(await c.req.json()));

export const handler = createAWSLambdaHandler(app, {
  baseUrl: 'https://api.example.com',
});
```

## Netlify

```ts
import { createNano } from 'nano';
import {
  createNetlifyFunctionHandler,
  createNetlifyEdgeHandler,
} from 'nano/adapters/netlify';

const app = createNano().get('/', (c) => c.text('hello from netlify'));

export const handler = createNetlifyFunctionHandler(app);
export default createNetlifyEdgeHandler(app);
```

## Azure Functions

```ts
import { createNano } from 'nano';
import { createAzureFunctionHandler } from 'nano/adapters/azure';

const app = createNano().get('/', (c) => c.text('hello from azure'));

export default createAzureFunctionHandler(app);
```

如果你的宿主已经给了标准 `Request`，可用：

```ts
import { createAzureFetchHandler } from 'nano/adapters/azure';
export default createAzureFetchHandler(app);
```

## Vercel

```ts
import { createNano } from 'nano';
import { createAppRouteHandler } from 'nano/adapters/vercel';

const app = createNano().get('/api/hello', (c) => c.json({ ok: true }));

export const { GET, POST, PUT, DELETE, PATCH } = createAppRouteHandler(app);
```

## 选择建议

- 传统后端服务优先 `serveNode`
- 单文件部署或高并发实验可选 `serveBun`
- Edge / 全球分发优先 Cloudflare 或 Vercel
- 既有云函数体系按平台直接选对应 handler

所有适配器都建立在相同的应用层代码之上，因此建议把业务逻辑收敛到 `app`，平台入口只做一行接线。

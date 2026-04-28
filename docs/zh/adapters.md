# 适配器

`orva` 以 `app.fetch(request)` 为统一运行时入口，再通过子模块适配到不同平台。

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
import { createOrva } from 'orva';
import { serveNode } from 'orva/adapters/node';

const app = createOrva().get('/', (c) => c.text('hello from node'));

serveNode(app, { port: 3000 });
```

## Deno

```ts
import { createOrva } from 'orva';
import { serveDeno } from 'orva/adapters/deno';

const app = createOrva().get('/', (c) => c.text('hello from deno'));

serveDeno(app, { port: 8000 });
```

## Bun

```ts
import { createOrva } from 'orva';
import { serveBun } from 'orva/adapters/bun';

const app = createOrva().get('/', (c) => c.text('hello from bun'));

serveBun(app, { port: 3000, development: true });
```

## Cloudflare Workers / Pages

```ts
import { createOrva } from 'orva';
import {
  createCloudflareWorker,
  createPagesFunction,
} from 'orva/adapters/cloudflare';

const app = createOrva().get('/', (c) => c.text('hello from cloudflare'));

export default createCloudflareWorker(app);
export const onRequest = createPagesFunction(app);
```

如果你只需要默认 worker 形式，也可以直接使用：

```ts
import { createDefaultWorker } from 'orva/adapters/cloudflare';
export default createDefaultWorker(app);
```

## AWS Lambda

```ts
import { createOrva } from 'orva';
import { createAWSLambdaHandler } from 'orva/adapters/aws-lambda';

const app = createOrva().post('/echo', async (c) => c.json(await c.req.json()));

export const handler = createAWSLambdaHandler(app, {
  baseUrl: 'https://api.example.com',
});
```

## Netlify

```ts
import { createOrva } from 'orva';
import {
  createNetlifyFunctionHandler,
  createNetlifyEdgeHandler,
} from 'orva/adapters/netlify';

const app = createOrva().get('/', (c) => c.text('hello from netlify'));

export const handler = createNetlifyFunctionHandler(app);
export default createNetlifyEdgeHandler(app);
```

## Azure Functions

```ts
import { createOrva } from 'orva';
import { createAzureFunctionHandler } from 'orva/adapters/azure';

const app = createOrva().get('/', (c) => c.text('hello from azure'));

export default createAzureFunctionHandler(app);
```

如果你的宿主已经给了标准 `Request`，可用：

```ts
import { createAzureFetchHandler } from 'orva/adapters/azure';
export default createAzureFetchHandler(app);
```

## Vercel

```ts
import { createOrva } from 'orva';
import { createAppRouteHandler } from 'orva/adapters/vercel';

const app = createOrva().get('/api/hello', (c) => c.json({ ok: true }));

export const { GET, POST, PUT, DELETE, PATCH } = createAppRouteHandler(app);
```

## 选择建议

- 传统后端服务优先 `serveNode`
- 单文件部署或高并发实验可选 `serveBun`
- Edge / 全球分发优先 Cloudflare 或 Vercel
- 既有云函数体系按平台直接选对应 handler

所有适配器都建立在相同的应用层代码之上，因此建议把业务逻辑收敛到 `app`，平台入口只做一行接线。
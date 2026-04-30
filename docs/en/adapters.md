# Adapters

`orva` standardizes everything on `app.fetch(request)`, then adapts that entrypoint to each runtime through explicit subpaths.

## Runtime overview

| Runtime | Exports | Good fit |
| --- | --- | --- |
| Node.js | `serveNode` | Standard servers, containers, PM2, systemd |
| Deno | `serveDeno` `createDenoHandler` | Deno-native HTTP services |
| Bun | `serveBun` `createBunHandler` | Bun-native high-performance services |
| Cloudflare | `createCloudflareWorker` `createCloudflareWorkerWithEnv` `createPagesFunction` `createDefaultWorker` | Workers / Pages |
| AWS Lambda | `createAWSLambdaHandler` | API Gateway + Lambda |
| Netlify | `createNetlifyFunctionHandler` `createNetlifyEdgeHandler` | Functions / Edge Functions |
| Azure | `createAzureFunctionHandler` `createAzureFetchHandler` | Azure Functions |
| Vercel | `createVercelEdgeHandler` `createAppRouteHandler` | Edge / App Router |

## Node.js

```ts
import { createOrva } from 'orvajs';
import { serveNode } from 'orvajs/adapters/node';

const app = createOrva().get('/', (c) => c.text('hello from node'));

serveNode(app, { port: 3000 });
```

## Deno

```ts
import { createOrva } from 'orvajs';
import { serveDeno } from 'orvajs/adapters/deno';

const app = createOrva().get('/', (c) => c.text('hello from deno'));

serveDeno(app, { port: 8000 });
```

## Bun

```ts
import { createOrva } from 'orvajs';
import { serveBun } from 'orvajs/adapters/bun';

const app = createOrva().get('/', (c) => c.text('hello from bun'));

serveBun(app, { port: 3000, development: true });
```

## Cloudflare Workers / Pages

```ts
import { createOrva } from 'orvajs';
import {
  createCloudflareWorker,
  createPagesFunction,
} from 'orvajs/adapters/cloudflare';

const app = createOrva().get('/', (c) => c.text('hello from cloudflare'));

export default createCloudflareWorker(app);
export const onRequest = createPagesFunction(app);
```

If you need the environment-aware variant:

```ts
import { createCloudflareWorkerWithEnv } from 'orvajs/adapters/cloudflare';

export default createCloudflareWorkerWithEnv(app);
```

If you only want the default Worker shape:

```ts
import { createDefaultWorker } from 'orvajs/adapters/cloudflare';

export default createDefaultWorker(app);
```

## AWS Lambda

```ts
import { createOrva } from 'orvajs';
import { createAWSLambdaHandler } from 'orvajs/adapters/aws-lambda';

const app = createOrva().post('/echo', async (c) => c.json(await c.req.json()));

export const handler = createAWSLambdaHandler(app, {
  baseUrl: 'https://api.example.com',
});
```

## Netlify

```ts
import { createOrva } from 'orvajs';
import {
  createNetlifyFunctionHandler,
  createNetlifyEdgeHandler,
} from 'orvajs/adapters/netlify';

const app = createOrva().get('/', (c) => c.text('hello from netlify'));

export const handler = createNetlifyFunctionHandler(app);
export default createNetlifyEdgeHandler(app);
```

## Azure Functions

```ts
import { createOrva } from 'orvajs';
import { createAzureFunctionHandler } from 'orvajs/adapters/azure';

const app = createOrva().get('/', (c) => c.text('hello from azure'));

export default createAzureFunctionHandler(app);
```

If your host already gives you a standard `Request`, use:

```ts
import { createAzureFetchHandler } from 'orvajs/adapters/azure';

export default createAzureFetchHandler(app);
```

## Vercel

```ts
import { createOrva } from 'orvajs';
import {
  createAppRouteHandler,
  createVercelEdgeHandler,
} from 'orvajs/adapters/vercel';

const app = createOrva().get('/api/hello', (c) => c.json({ ok: true }));

export const { GET, POST, PUT, DELETE, PATCH } = createAppRouteHandler(app);
export default createVercelEdgeHandler(app);
```

## Selection advice

- Prefer `serveNode()` for classic backend services.
- Prefer `serveBun()` for Bun-native deployments or performance experiments.
- Prefer Cloudflare or Vercel for edge-first distribution.
- In existing cloud-function setups, use the platform-specific handler and keep the business app unchanged.

All adapters share the same application layer, so the best structure is still: keep business logic inside `app`, and let the runtime entry only wire the adapter.

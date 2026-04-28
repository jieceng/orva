# Deployment and Runtimes

`orva` app code is organized around `app.fetch(request)`, so platform differences are mostly isolated in the adapter layer.

## Choosing a platform

| Target platform | Recommended entry | Typical use case |
| --- | --- | --- |
| Node.js | `serveNode` | Standard API services, containers, PM2, systemd |
| Bun | `serveBun` | Lightweight high-performance experiments or native Bun deployment |
| Deno | `serveDeno` | Native Deno HTTP services |
| Cloudflare | `createCloudflareWorker` | Edge APIs and global low-latency distribution |
| Vercel | `createAppRouteHandler` `createVercelEdgeHandler` | App Router and Edge Route handlers |
| AWS Lambda | `createAWSLambdaHandler` | API Gateway + Lambda |
| Netlify | `createNetlifyFunctionHandler` `createNetlifyEdgeHandler` | Functions and Edge Functions |
| Azure | `createAzureFunctionHandler` | Azure Functions |

See [Adapters](/adapters) for the complete list.

## Node.js deployment

```ts
import { createOrva } from 'orva';
import { serveNode } from 'orva/adapters/node';

const app = createOrva().get('/health', (c) => c.json({ ok: true }));

serveNode(app, { port: Number(process.env.PORT ?? 3000) });
```

Good fits:

- Docker / Kubernetes
- ECS / Fly.io / Railway / Render
- self-hosted VMs with systemd or PM2

## Edge and serverless deployment

Keep `app` independent. Let the platform entry only wire it up:

```ts
import { createOrva } from 'orva';
import { createCloudflareWorker } from 'orva/adapters/cloudflare';

export const app = createOrva().get('/health', (c) => c.json({ ok: true }));

export default createCloudflareWorker(app);
```

Recommended layout:

```text
src/
  app.ts
platform/
  node.ts
  cloudflare.ts
  lambda.ts
```

## Reusing one business app across platforms

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

## Production recommendations

### Node services

- Use boundary middleware such as `secureHeaders()`, `compress()`, and `etag()` in front of the app.
- Mount logging, request IDs, and response timing globally.
- Prefer serving static assets through a CDN or gateway; only use `serveStatic()` in-app when you need framework-level hosting.

### Serverless and edge

- Avoid reconnect-heavy work or CPU-heavy initialization at module load time.
- Isolate large dependencies to the routes that actually need them.
- Prefer granular submodule imports to keep deployment bundles smaller.

## Environment variable guidance

```ts
const port = Number(process.env.PORT ?? 3000);
const isProd = process.env.NODE_ENV === 'production';
const apiBase = process.env.API_BASE_URL ?? 'http://localhost:3000';
```

Prefer handling these outside the app itself:

- environment validation
- secret injection
- logging and monitoring SDK initialization

## Pre-release checklist

1. `pnpm typecheck`
2. `pnpm test`
3. `pnpm build`
4. `pnpm docs:build`
5. check `package.json` `exports` and the publish file list
6. confirm each platform entry is only a thin adapter and does not mix in business logic

## Common deployment patterns

| Scenario | Recommendation |
| --- | --- |
| Internal enterprise API | Node + `serveNode()` + reverse proxy |
| Public BFF | Node / Bun + `cors` `secureHeaders` `bodyLimit` `rateLimit` |
| Global low-latency endpoints | Cloudflare / Vercel Edge |
| Pay-per-use functions | AWS Lambda / Netlify / Azure |

If you are comparing options, continue with [FAQ](/guide/faq).

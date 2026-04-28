---
layout: home

hero:
  name: nano
  text: A production-ready Fetch API web framework
  tagline: Build typed middleware, validator, RPC, OpenAPI and multi-runtime adapters with a workflow that stays close to Hono.
  actions:
    - theme: brand
      text: Start in 5 minutes
      link: /en/guide/quickstart
    - theme: alt
      text: Browse middleware
      link: /en/middlewares
    - theme: alt
      text: Explore exports
      link: /en/exports

features:
  - title: Small core, explicit exports
    details: The root entry only exposes the framework core. RPC, adapters, middlewares, validator and openapi all live behind subpaths for cleaner bundling.
  - title: End-to-end contract typing
    details: app.use() type accumulation, validator outputs, RPC client inference and OpenAPI metadata stay aligned through one route model.
  - title: Ready for real delivery
    details: Authentication, rate limiting, security headers, static assets, compression and observability are available out of the box across Node, Bun, Deno and major serverless platforms.
---

## Why nano

`nano` aims to stay lightweight without collapsing into a toy framework:

- Routing, Context and Middleware remain direct.
- Typed validator, RPC and OpenAPI share one contract chain.
- Subpath exports are clean enough for package publishing and tree-shaking.
- Adapters and middleware cover mainstream web and serverless deployment targets.

<NanoContractPipeline />

## Minimal example

```ts
import { createNano } from 'nano';
import { serveNode } from 'nano/adapters/node';
import { cors, requestId } from 'nano/middlewares';

const app = createNano()
  .use(requestId(), cors())
  .get('/health', (c) => c.json({ ok: true, requestId: c.get('requestId') }));

serveNode(app, { port: 3000 });
```

## Recommended reading order

1. Start with [Quickstart](/en/guide/quickstart).
2. Read [Routing and Composition](/en/guide/routing) and [Context and Responses](/en/guide/context).
3. Add [Validator](/en/validator), [RPC](/en/rpc) and [OpenAPI](/en/openapi).
4. Choose your deployment path from [Adapters](/en/adapters) and [Middleware](/en/middlewares).

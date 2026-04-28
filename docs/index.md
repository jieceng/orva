---
layout: home

hero:
  name: orva
  text: A production-ready Fetch API web framework
  tagline: Keep a Hono-like mental model while shipping typed middleware, validator, RPC, OpenAPI, and multi-runtime adapters in one cohesive server stack.
  actions:
    - theme: brand
      text: Start in 5 minutes
      link: /guide/quickstart
    - theme: alt
      text: Production guide
      link: /guide/production
    - theme: alt
      text: Middleware catalog
      link: /middlewares
    - theme: alt
      text: GitHub
      link: https://github.com/jieceng/orva

features:
  - title: Small core, explicit exports
    details: The root entry stays focused on the framework core. RPC, adapters, middlewares, validator, and openapi ship through subpaths that are easier to tree-shake and publish.
  - title: End-to-end type flow
    details: app.use() accumulation, validator output, RPC input inference, and OpenAPI metadata can move through the same contract chain instead of drifting apart.
  - title: Ready for deployment
    details: Node, Bun, Deno, Cloudflare, Vercel, Netlify, Azure, and AWS Lambda are covered, with common middleware for auth, security headers, rate limits, static assets, cookies, and compression.
---

## Why orva

`orva` is not trying to be only a thin router. It is aimed at teams that want a low-overhead mental model while still shipping a production TypeScript server workflow:

- routing, `Context`, and middleware stay direct without forcing large abstractions
- validator, RPC, and OpenAPI share route metadata instead of duplicating interface descriptions
- export boundaries stay explicit, which fits monorepos, templates, SDKs, and shared infra
- stable entry points exist for Node and mainstream serverless or edge platforms

<OrvaContractPipeline />

## Minimal runnable example

```ts
import { createOrva } from 'orva';
import { serveNode } from 'orva/adapters/node';
import { cors, requestId, secureHeaders } from 'orva/middlewares';

const app = createOrva()
  .use(requestId(), cors(), secureHeaders())
  .get('/health', (c) => c.json({
    ok: true,
    requestId: c.get('requestId'),
  }));

serveNode(app, { port: 3000 });
```

## Best fit

| Scenario | Why it fits |
| --- | --- |
| APIs and BFFs | Straightforward routing, validator support, and typed response workflows fit interface-heavy services |
| Platform gateways | Middleware breadth plus reusable OpenAPI metadata supports governance layers |
| Multi-runtime services | The same app code can move across Node, edge, and serverless targets |
| Templates and shared infrastructure | Granular submodules keep exports stable and easier to package |

## Reading path

1. Start with [Quickstart](/guide/quickstart).
2. Read [Routing and Composition](/guide/routing) and [Context and Responses](/guide/context).
3. Connect [Validator](/validator), [RPC](/rpc), and [OpenAPI](/openapi).
4. Move to [Middleware and Type Accumulation](/guide/production), [Testing and Quality](/guide/testing), and [Deployment and Runtimes](/guide/deployment).
5. Use [FAQ](/guide/faq) for positioning and migration questions.

## Capability map

| Area | Current coverage |
| --- | --- |
| Core | `createOrva()` `group()` `route()` `onError()` `notFound()` |
| Context | `req` `params` `query` `cookie` `after()` `text/json/html/stream/sse/download` |
| Middleware | 50+ middleware exports and `orva/middlewares/*` subpaths |
| Validation | built-in `validator()` and `zodValidator()` |
| Contracts | `createRPC()` `createRPCMetadata()` `createOpenAPIDocument()` |
| Adapters | Node / Bun / Deno / Cloudflare / Vercel / Netlify / Azure / AWS Lambda |

## Adoption guidance

::: tip Team profile
If your team wants a stronger type and contract story than a traditional Express stack, but does not want to buy into a much heavier framework model, `orva` is a balanced middle ground.
:::

::: info Docs site
This site ships with multilingual docs, reusable demo components, brand assets, and Algolia search wiring. When Algolia credentials are not configured, it falls back to local search automatically.
:::

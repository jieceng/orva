---
layout: home

hero:
  name: orva
  text: Learn the framework by building with it
  tagline: Start with a small Fetch API server, then grow into validator, typed RPC, OpenAPI, and production middleware without switching mental models.
  actions:
    - theme: brand
      text: Start the Quickstart
      link: /en/guide/quickstart
    - theme: alt
      text: See the Type Flow
      link: /en/guide/type-flow
    - theme: alt
      text: Build a REST API
      link: /en/recipes/rest-api
    - theme: alt
      text: Browse Reference
      link: /en/reference/

features:
  - title: Learn in layers
    details: "The docs are organized so you can first run a server, then understand Context, then add validator, RPC, and OpenAPI in sequence."
  - title: One contract chain
    details: "`app.use()` types, validator output, RPC request inference, and OpenAPI metadata are explained as one connected system instead of separate features."
  - title: Ready for real services
    details: "Adapters, middleware, testing, deployment, and reference material are all available once you move past the first demo."
---

## Start here

If this is your first time with `orva`, use this order:

1. [Quickstart](/en/guide/quickstart): run a real service in a few minutes
2. [Context and Responses](/en/guide/context): learn request reads and response helpers
3. [Routing and Composition](/en/guide/routing): split routes without losing type information
4. [Type Flow](/en/guide/type-flow): understand how middleware, validator, RPC, and OpenAPI connect
5. [Recipes](/en/recipes/rest-api): build something close to production

If you are moving from another Node or Fetch framework, read [Migrate from Express or Hono](/en/guide/migration) early.

## What `orva` is good at

- small request-handling model based on the Fetch API
- explicit subpath exports for framework core, RPC, adapters, validator, middleware, and OpenAPI
- contract reuse across runtime validation, handler context, RPC clients, and OpenAPI output
- deployment across Node, Bun, Deno, serverless, and edge targets

<OrvaContractPipeline />

## Your first useful app

```ts
import { createOrva } from 'orvajs';
import { serveNode } from 'orvajs/adapters/node';
import { requestId, secureHeaders } from 'orvajs/middlewares';

const app = createOrva()
  .use(requestId(), secureHeaders())
  .get('/health', (c) => c.json({
    ok: true,
    requestId: c.get('requestId'),
  }));

serveNode(app, { port: 3000 });
```

## Learn by task

| Goal | Go here |
| --- | --- |
| Run the first service | [Quickstart](/en/guide/quickstart) |
| Understand the request model | [Context and Responses](/en/guide/context) |
| Understand contract propagation | [Type Flow](/en/guide/type-flow) |
| Build a REST API | [REST API Recipe](/en/recipes/rest-api) |
| Build a typed client workflow | [Typed RPC App Recipe](/en/recipes/typed-rpc-app) |
| Assemble a production middleware stack | [Middleware Cookbook](/en/recipes/middleware-cookbook) |
| Port an existing service from another framework | [Migration Guide](/en/guide/migration) |
| Look up exports and modules | [Reference](/en/reference/) |

## Reference areas

| Area | Entry |
| --- | --- |
| Core framework | [Reference overview](/en/reference/) |
| Validator | [Validator](/en/validator) |
| RPC | [RPC](/en/rpc) |
| OpenAPI | [OpenAPI](/en/openapi) |
| Middleware | [Middleware catalog](/en/middlewares) |
| Adapters | [Adapters](/en/adapters) |

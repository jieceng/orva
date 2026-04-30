---
layout: home

hero:
  name: orva
  text: Learn the framework by building with it
  tagline: Start with a small Fetch API server, then grow into validator, typed RPC, OpenAPI, and production middleware without switching mental models.
  actions:
    - theme: brand
      text: Start the Quickstart
      link: /guide/quickstart
    - theme: alt
      text: See the Type Flow
      link: /guide/type-flow
    - theme: alt
      text: Build a REST API
      link: /recipes/rest-api
    - theme: alt
      text: Browse Reference
      link: /reference/

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

1. [Quickstart](/guide/quickstart): run a real service in a few minutes
2. [Context and Responses](/guide/context): learn request reads and response helpers
3. [Routing and Composition](/guide/routing): split routes without losing type information
4. [Type Flow](/guide/type-flow): understand how middleware, validator, RPC, and OpenAPI connect
5. [Recipes](/recipes/rest-api): build something close to production

If you are moving from another Node or Fetch framework, read [Migrate from Express or Hono](/guide/migration) early.

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
| Run the first service | [Quickstart](/guide/quickstart) |
| Understand the request model | [Context and Responses](/guide/context) |
| Understand contract propagation | [Type Flow](/guide/type-flow) |
| Build a REST API | [REST API Recipe](/recipes/rest-api) |
| Build a typed client workflow | [Typed RPC App Recipe](/recipes/typed-rpc-app) |
| Assemble a production middleware stack | [Middleware Cookbook](/recipes/middleware-cookbook) |
| Port an existing service from another framework | [Migration Guide](/guide/migration) |
| Look up exports and modules | [Reference](/reference/) |

## Reference areas

| Area | Entry |
| --- | --- |
| Core framework | [Reference overview](/reference/) |
| Validator | [Validator](/validator) |
| RPC | [RPC](/rpc) |
| OpenAPI | [OpenAPI](/openapi) |
| Middleware | [Middleware catalog](/middlewares) |
| Adapters | [Adapters](/adapters) |

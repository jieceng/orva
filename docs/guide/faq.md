# FAQ

## How does `orva` relate to Hono and Express?

`orva` will feel close to Hono in day-to-day use: lightweight routing, a Fetch API style, and a Context-driven model. Its emphasis is different in a few places:

- the root entry stays core-only, with clearer submodule boundaries
- `app.use()` participates in type accumulation
- RPC / OpenAPI / validator features are connected through the same contract chain
- middleware is split into smaller publishable units

Compared with Express, `orva` stays closer to modern web platform APIs and makes it easier to connect types, docs, and clients end to end.

## Can it be used commercially?

Yes. The project uses the MIT license and is suitable for commercial services, internal platforms, and public-facing APIs.

## Is there any copyright or plagiarism risk?

It is normal for framework APIs to be influenced by modern Fetch-style server frameworks, but your docs, implementation, export structure, middleware system, and contract features should be defined by the actual code and license in this repository. In practice:

- keep your own `LICENSE` explicit
- do not copy copyrighted docs or implementations from other projects
- comply with the licenses of your dependencies

That is the normal standard open-source maintenance model.

## What kinds of projects fit `orva` best today?

- API services
- admin and internal BFFs
- platform gateway and governance layers
- full-stack teams that need typed RPC or OpenAPI
- multi-runtime deployment scenarios

## If I only need validation, can I use a third-party middleware?

Yes. If your team already has an established validation stack, you can use `orva` routing and `Context` while plugging in your own validation layer.

But if you want validation results to keep flowing into:

- `c.valid()`
- RPC input inference
- OpenAPI parameter and `requestBody` constraints

then `orva/validator` or `orva/validator/zod` will integrate more smoothly.

## Why does the root entry not export RPC, adapters, or middleware?

That is intentional:

- it avoids a bloated root entry
- it keeps tree-shaking friendly
- it gives ecosystem packages and templates stable granular subpaths

See [Exports and Submodules](/exports) for the recommended import pattern.

## Why do the docs emphasize granular submodule imports?

Because it is closely tied to the ecosystem design of `orva`:

- app code can use aggregate imports for better ergonomics
- libraries, shared packages, templates, and CLI tooling are usually better served by subpath imports

That keeps package size, boundaries, and long-term maintenance more controllable.

## Where does performance generally land?

`orva` aims to keep the request path lightweight and stay close to comparable Fetch-style frameworks for common GET / JSON / middleware scenarios, while clearly outperforming heavier traditional Node-style pipelines. Real-world results still depend on:

- middleware stack depth
- response serialization volume
- adapter overhead
- runtime differences across Node, Bun, and edge platforms

Benchmark with your real business routes instead of relying only on a single hello-world number.

## What should I migrate first?

When migrating an existing service, this is the safest order:

1. move routing and `Context` first
2. move shared middleware next
3. add validator after that
4. add RPC / OpenAPI last

That makes risk easier to control and behavior or performance easier to compare step by step.

## What is the recommended reading order for the docs?

1. [Quickstart](/guide/quickstart)
2. [Routing and Composition](/guide/routing)
3. [Context and Responses](/guide/context)
4. [Middleware and Type Accumulation](/guide/production)
5. [Validator](/validator) / [RPC](/rpc) / [OpenAPI](/openapi)
6. [Testing and Quality](/guide/testing)
7. [Deployment and Runtimes](/guide/deployment)

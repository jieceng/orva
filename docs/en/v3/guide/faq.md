# FAQ

## How does `orva` relate to Hono and Express

`orva` feels closer to Hono in day-to-day usage because it keeps a Fetch-style request model and a context-driven API. Compared with both Hono and Express, it puts more emphasis on:

- a smaller root entry with explicit subpath exports
- app-level type accumulation
- validator, RPC, and OpenAPI contract linkage
- fine-grained middleware packaging

## Can it be used commercially

Yes. The project uses the MIT license and is suitable for commercial and internal use.

## Why keep RPC, adapters, and middlewares out of the root entry

That is intentional:

- less root-entry bloat
- better tree-shaking behavior
- clearer boundaries for templates and ecosystem packages

See [Exports](/en/exports).

## What should I migrate first

Recommended order:

1. routes and context
2. shared middleware
3. validator
4. RPC and OpenAPI

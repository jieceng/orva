# orva

Lightweight Fetch API web framework with typed middleware, validator, RPC, OpenAPI and multi-runtime adapters.

## Install

```bash
pnpm add orva
```

## Quick Start

```ts
import { createOrva } from 'orva';
import { serveNode } from 'orva/adapters/node';
import { cors, requestId, secureHeaders } from 'orva/middlewares';

const app = createOrva()
  .use(requestId(), cors(), secureHeaders())
  .get('/health', (c) => c.json({ ok: true, requestId: c.get('requestId') }));

serveNode(app, { port: 3000 });
```

## Package Structure

The root `orva` entry only exports the framework core.

Use subpaths for ecosystem modules:

```ts
import { createOrva, defineMiddleware } from 'orva';
import { validator } from 'orva/validator';
import { zodValidator } from 'orva/validator/zod';
import { createRPC } from 'orva/rpc';
import { createOpenAPIDocument } from 'orva/openapi';
import { serveNode } from 'orva/adapters/node';
import { cors } from 'orva/middlewares/cors';
```

Backward-compatible aliases remain available during migration:

```ts
import { Orva, createOrva } from 'orva';
```

## Middleware Imports

Aggregate imports are convenient for apps:

```ts
import { cors, requestId, secureHeaders } from 'orva/middlewares';
```

Fine-grained imports are better for libraries, templates and tree-shaking-sensitive builds:

```ts
import { cors } from 'orva/middlewares/cors';
import { requestId } from 'orva/middlewares/request-id';
import { secureHeaders } from 'orva/middlewares/secure-headers';
```

## Typed `app.use()`

You can accumulate route-visible types through `app.use()` with `defineMiddleware()` and validator middleware:

```ts
import { createOrva, defineMiddleware } from 'orva';
import { validator } from 'orva/validator';

const session = defineMiddleware<{ session: string }>(async (c, next) => {
  c.set('session', 'session-1');
  await next();
});

const app = createOrva()
  .use(session)
  .use(validator('header', (value: Record<string, string>) => ({
    authorization: value.authorization ?? '',
  })));

app.get('/me', (c) => {
  c.get('session');
  c.valid('header');
  return c.text('ok');
});
```

## Typed Route Composition

For route registry inference across grouped apps, prefer one of these patterns:

```ts
const users = createOrva().get('/users/:id', (c) => c.json({ id: c.params.id }));
const app = createOrva().route('/api', users);
```

```ts
const app = createOrva().group('/api', (group) => {
  return group.get('/ping', (c) => c.json({ ok: true }));
});
```

## Documentation

The project ships with a VitePress documentation site in [`docs/`](./docs/).

```bash
pnpm docs:dev
pnpm docs:build
pnpm docs:preview
```

Algolia DocSearch can be enabled by providing these environment variables at build time:

```bash
ORVA_DOCSEARCH_APP_ID=
ORVA_DOCSEARCH_API_KEY=
ORVA_DOCSEARCH_INDEX_NAME=
ORVA_DOCSEARCH_ASSISTANT_ID=
```

If they are not set, the docs site automatically falls back to VitePress local search.

## Publishing to npm

The package is configured to publish only the minimal public surface:

- `dist/`
- `README.md`
- `LICENSE`

Release-related scripts:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm pack:check
pnpm release:check
```

Typical publish flow:

```bash
pnpm install
pnpm release:check
npm login
npm publish --access public
```

`prepublishOnly` already runs `typecheck`, `test` and `build`, and `publishConfig.access` is set to `public`.

## License

[MIT](./LICENSE)

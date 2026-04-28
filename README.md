# nano

Ultra-lightweight Web Framework based on the Fetch API.

## Documentation

The project ships with a VitePress documentation site in [`docs/`](./docs/).

```bash
pnpm docs:dev
pnpm docs:build
pnpm docs:preview
```

Algolia DocSearch can be enabled by providing these environment variables at build time:

```bash
NANO_DOCSEARCH_APP_ID=
NANO_DOCSEARCH_API_KEY=
NANO_DOCSEARCH_INDEX_NAME=
NANO_DOCSEARCH_ASSISTANT_ID=
```

If they are not set, the docs site automatically falls back to VitePress local search.

## Middleware Imports

`nano` now ships with 57 built-in middleware factories. You can import them in three ways:

```ts
import { cors, requestId, secureHeaders } from 'nano/middlewares';
```

```ts
import { cors } from 'nano/middlewares/cors';
import { requestId } from 'nano/middlewares/request-id';
import { secureHeaders } from 'nano/middlewares/secure-headers';
```

The third form is the most tree-shaking-friendly and is the recommended style for published apps, templates, and plugins.

The root `nano` entry only exports the framework core. Use subpaths for everything else:

```ts
import { createRPC } from 'nano/rpc';
import { serveNode } from 'nano/adapters/node';
import { cors } from 'nano/middlewares/cors';
import { validator } from 'nano/validator';
import { zodValidator } from 'nano/validator/zod';
import {
  describeRoute,
  createOpenAPIDocument,
  defineSecurityScheme,
  requireSecurity,
} from 'nano/openapi';
```

## Typed Usage

Built-in middleware factories are compatible with `createNano<AppVars>()` by default:

```ts
import { createNano } from 'nano';
import { cors, requestId, secureHeaders } from 'nano/middlewares';

type AppVars = {
  requestId: string;
  user?: { id: string; role: string };
};

const app = createNano<AppVars>();

app.use(
  requestId(),
  cors(),
  secureHeaders()
);
```

If you need typed middleware option callbacks, pass the app vars generic explicitly:

```ts
import { logger } from 'nano/middlewares/logger';

app.use(logger<AppVars>({
  log(message, c) {
    console.log(c.get('requestId'), message);
  },
}));
```

## Typed `app.use()`

You can accumulate route-visible types through `app.use()` with `defineMiddleware()` and validator middleware:

```ts
import { createNano, defineMiddleware } from 'nano';
import { validator } from 'nano/validator';

const session = defineMiddleware<{ session: string }>(async (c, next) => {
  c.set('session', 'session-1');
  await next();
});

const app = createNano()
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
const users = createNano().get('/users/:id', (c) => c.json({ id: c.params.id }));
const app = createNano().route('/api', users);
```

```ts
const app = createNano().group('/api', (group) => {
  return group.get('/ping', (c) => c.json({ ok: true }));
});
```

## Docs

Detailed middleware categories, API notes, and examples live in [docs/middlewares.md](./docs/middlewares.md).

Adapter usage notes and platform examples live in [docs/adapters.md](./docs/adapters.md).

Validator contract and third-party integration notes live in [docs/validator.md](./docs/validator.md).

OpenAPI metadata and document generation notes live in [docs/openapi.md](./docs/openapi.md).

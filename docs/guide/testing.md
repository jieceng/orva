# Testing and Quality

One advantage of `orva` is that the app is centered around `fetch(request)`, so many tests do not need a real HTTP server first.

## Recommended test layers

| Layer | Goal | Recommended approach |
| --- | --- | --- |
| Handler / Route | Verify business behavior, status codes, and response bodies | `app.fetch(new Request(...))` |
| Middleware | Verify headers, auth, rate limiting, compression | Build a focused app and assert the response |
| Adapter | Verify platform bridge behavior | Integration tests for `serveNode()` or function handlers |
| Contract | Verify RPC / OpenAPI output | Assert metadata structures directly |

## Minimal route test

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrva } from 'orvajs';

test('GET /health returns ok', async () => {
  const app = createOrva().get('/health', (c) => c.json({ ok: true }));

  const response = await app.fetch(new Request('https://example.com/health'));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});
```

## Testing params and query strings

```ts
test('reads params and query', async () => {
  const app = createOrva().get('/users/:id', (c) => c.json({
    id: c.params.id,
    q: c.query.q ?? null,
  }));

  const response = await app.fetch(new Request('https://example.com/users/42?q=active'));

  assert.deepEqual(await response.json(), {
    id: '42',
    q: 'active',
  });
});
```

## Testing middleware order and shared vars

```ts
test('middleware can accumulate vars', async () => {
  const app = createOrva<{ trace: string[] }>();

  app.use(async (c, next) => {
    c.set('trace', ['before']);
    await next();
    c.get('trace')?.push('after');
  });

  app.get('/trace', (c) => c.json({ trace: c.get('trace') }));

  const response = await app.fetch(new Request('https://example.com/trace'));
  assert.deepEqual(await response.json(), {
    trace: ['before'],
  });
});
```

If you need to assert post-processing behavior, it is usually better to check response headers, cookies, or external side effects.

## Testing validator

```ts
import { z } from 'zod';
import { zodValidator } from 'orvajs/validator/zod';

test('validator returns 422 for invalid json', async () => {
  const app = createOrva().post(
    '/users',
    zodValidator('json', z.object({ name: z.string().min(1) })),
    (c) => c.json(c.valid('json'), 201),
  );

  const response = await app.fetch(new Request('https://example.com/users', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: '' }),
  }));

  assert.equal(response.status, 422);
});
```

## Testing RPC and OpenAPI

```ts
import { createRPCMetadata } from 'orvajs/rpc';
import { createOpenAPIDocument } from 'orvajs/openapi';

test('contract metadata can be generated', () => {
  const rpc = createRPCMetadata(app);
  const openapi = createOpenAPIDocument(app, {
    info: { title: 'Test API', version: '1.0.0' },
  });

  assert.ok(rpc.length > 0);
  assert.equal(openapi.info.title, 'Test API');
});
```

## Testing the Node adapter

When you need to verify Node bridging, streaming responses, or real port behavior, use `serveNode()`:

```ts
import { serveNode } from 'orvajs/adapters/node';

test('node adapter serves requests', async () => {
  const app = createOrva().get('/', (c) => c.text('ok'));
  const server = serveNode(app, { port: 3100 });

  try {
    const response = await fetch('http://127.0.0.1:3100/');
    assert.equal(await response.text(), 'ok');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
```

## CI recommendations

Keep at least these checks:

```bash
pnpm typecheck
pnpm test
pnpm build
```

If you also maintain the docs site, add:

```bash
pnpm docs:build
```

## Recommended quality baseline

- Cover at least success, validation failure, and permission failure on core routes.
- Cover headers, cookies, `notFound`, and early response behavior for middleware.
- When contracts change, update RPC or OpenAPI assertions too.
- Before publishing, run `typecheck + test + build + docs:build` at least once.

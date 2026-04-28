# Testing and Quality

Because `orva` apps are centered on `fetch(request)`, many tests do not need a real HTTP server.

## Recommended layers

| Layer | Goal | Recommended style |
| --- | --- | --- |
| Handler / Route | business behavior, status, payload | `app.fetch(new Request(...))` |
| Middleware | headers, auth, rate limits, compression | small focused apps |
| Adapter | host bridging behavior | integration tests per adapter |
| Contract | RPC / OpenAPI output | direct metadata assertions |

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

## CI baseline

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm docs:build
```

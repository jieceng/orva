import test from 'node:test';
import assert from 'node:assert/strict';

import { createOrva } from '../../src/index.ts';
import { rateLimit } from '../../src/middlewares/index.ts';

test('rateLimit adds headers and enforces limits', async () => {
  const app = createOrva();

  app.use(rateLimit({
    limit: 1,
    windowMs: 60_000,
    keyGenerator: () => 'test-key',
  }));
  app.get('/asset', (c) => c.text('orva'));

  const first = await app.fetch(new Request('https://example.com/asset'));
  assert.equal(first.status, 200);
  assert.equal(first.headers.get('x-ratelimit-limit'), '1');
  assert.equal(first.headers.get('x-ratelimit-remaining'), '0');

  const second = await app.fetch(new Request('https://example.com/asset'));
  assert.equal(second.status, 429);

  const retryAfter = Number(second.headers.get('retry-after'));
  assert.equal(Number.isNaN(retryAfter), false);
  assert.equal(retryAfter >= 59 && retryAfter <= 60, true);
});

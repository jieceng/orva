import test from 'node:test';
import assert from 'node:assert/strict';

import { createNano } from '../../src/index.ts';
import { etag } from '../../src/middlewares/index.ts';

test('etag adds validators and returns 304 on match', async () => {
  const app = createNano();

  app.get('/asset', etag(), (c) => c.text('nano'));

  const first = await app.fetch(new Request('https://example.com/asset'));
  const tag = first.headers.get('etag');

  assert.equal(first.status, 200);
  assert.ok(tag);

  const second = await app.fetch(new Request('https://example.com/asset', {
    headers: { 'If-None-Match': tag! },
  }));

  assert.equal(second.status, 304);
});

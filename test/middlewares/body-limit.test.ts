import test from 'node:test';
import assert from 'node:assert/strict';

import { createNano } from '../../src/index.ts';
import { bodyLimit } from '../../src/middlewares/index.ts';

test('bodyLimit rejects oversized payloads', async () => {
  const app = createNano();

  app.post('/upload', bodyLimit({ maxBytes: 8 }), (c) => c.text('ok'));

  const response = await app.fetch(new Request('https://example.com/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ too: 'large' }),
  }));

  assert.equal(response.status, 413);
  assert.equal(await response.text(), 'Payload Too Large');
});

test('bodyLimit allows payloads within the limit', async () => {
  const app = createNano();

  app.post('/upload', bodyLimit({ maxBytes: 8 }), (c) => c.text('ok'));

  const response = await app.fetch(new Request('https://example.com/upload', {
    method: 'POST',
    body: '12345678',
  }));

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'ok');
});

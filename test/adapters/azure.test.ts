import test from 'node:test';
import assert from 'node:assert/strict';

import { createNano } from '../../src/index.ts';
import { createAzureFunctionHandler } from '../../src/adapters/index.ts';

test('azure function adapter accepts request-like objects', async () => {
  const app = createNano();

  app.put('/items/:id', async (c) => {
    const body = await c.req.json();
    return c.json({
      id: c.params.id,
      query: c.query.mode ?? null,
      body,
    });
  });

  const handler = createAzureFunctionHandler(app);
  const response = await handler({
    method: 'PUT',
    url: 'https://fn.example.com/items/9?mode=edit',
    headers: { 'content-type': 'application/json' },
    text: async () => JSON.stringify({ framework: 'nano' }),
  });

  assert.equal(response.status, 200);
  assert.equal(response.isBase64Encoded, false);
  assert.deepEqual(JSON.parse(response.body || '{}'), {
    id: '9',
    query: 'edit',
    body: { framework: 'nano' },
  });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';

import { createNano } from '../../src/index.ts';
import { serveNode } from '../../src/adapters/index.ts';

test('serveNode forwards requests to nano fetch', async () => {
  const app = createNano();
  app.post('/echo/:id', async (c) => {
    const body = await c.req.json();
    return c.json({ id: c.params.id, body, q: c.query.q ?? null });
  });

  const server = serveNode(app, { hostname: '127.0.0.1', port: 0 });
  await once(server, 'listening');

  try {
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Unexpected server address');
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/echo/7?q=ok`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ framework: 'nano' }),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      id: '7',
      body: { framework: 'nano' },
      q: 'ok',
    });
  } finally {
    server.close();
    await once(server, 'close');
  }
});

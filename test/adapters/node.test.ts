import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';

import { createOrva } from '../../src/index.ts';
import { serveNode } from '../../src/adapters/index.ts';

test('serveNode forwards requests to orva fetch', async () => {
  const app = createOrva();
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
      body: JSON.stringify({ framework: 'orva' }),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      id: '7',
      body: { framework: 'orva' },
      q: 'ok',
    });
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('serveNode keeps request body lazy when handlers do not read it', async () => {
  const app = createOrva();
  app.post('/lazy', (c) => c.json({ bodyUsed: c.req.bodyUsed }));

  const server = serveNode(app, { hostname: '127.0.0.1', port: 0 });
  await once(server, 'listening');

  try {
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Unexpected server address');
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/lazy`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { bodyUsed: false });
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('serveNode preserves request body caching and clone support', async () => {
  const app = createOrva();
  app.post('/cache', async (c) => {
    const cloneText = await c.req.clone().text();
    const first = await c.req.json();
    const second = await c.req.json();
    return c.json({
      sameReference: first === second,
      cloneText,
      payload: first,
    });
  });

  const server = serveNode(app, { hostname: '127.0.0.1', port: 0 });
  await once(server, 'listening');

  try {
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Unexpected server address');
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/cache`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ framework: 'orva' }),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      sameReference: true,
      cloneText: '{"framework":"orva"}',
      payload: { framework: 'orva' },
    });
  } finally {
    server.close();
    await once(server, 'close');
  }
});

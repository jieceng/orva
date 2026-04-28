import test from 'node:test';
import assert from 'node:assert/strict';

import { createNano } from '../../src/index.ts';
import { createNetlifyFunctionHandler } from '../../src/adapters/index.ts';

test('netlify function adapter maps event to nano fetch', async () => {
  const app = createNano();

  app.post('/submit', async (c) => {
    const body = await c.req.json();
    return c.json({
      method: c.req.method,
      from: c.query.from ?? null,
      body,
      host: c.req.headers.get('host'),
    });
  });

  const handler = createNetlifyFunctionHandler(app, { baseUrl: 'https://site.netlify.app' });
  const response = await handler({
    httpMethod: 'POST',
    path: '/submit',
    rawQuery: 'from=netlify',
    headers: {
      host: 'site.netlify.app',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ ok: true }),
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.isBase64Encoded, false);
  assert.deepEqual(JSON.parse(response.body), {
    method: 'POST',
    from: 'netlify',
    body: { ok: true },
    host: 'site.netlify.app',
  });
});

import test from 'node:test';
import assert from 'node:assert/strict';

import { createOrva } from '../../src/index.ts';
import { cors } from '../../src/middlewares/index.ts';

test('cors handles preflight requests and response headers', async () => {
  const app = createOrva();

  app.use(cors({
    origin: ['https://client.example.com'],
    methods: ['GET', 'POST'],
    credentials: true,
    maxAge: 600,
  }));
  app.get('/resource', (c) => c.json({ ok: true }));

  const preflight = await app.fetch(new Request('https://example.com/resource', {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://client.example.com',
      'Access-Control-Request-Headers': 'content-type,x-api-key',
    },
  }));

  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://client.example.com');
  assert.equal(preflight.headers.get('access-control-allow-methods'), 'GET, POST');
  assert.equal(preflight.headers.get('access-control-allow-headers'), 'content-type, x-api-key');
  assert.equal(preflight.headers.get('access-control-allow-credentials'), 'true');

  const normal = await app.fetch(new Request('https://example.com/resource', {
    headers: { Origin: 'https://client.example.com' },
  }));

  assert.equal(normal.status, 200);
  assert.equal(normal.headers.get('access-control-allow-origin'), 'https://client.example.com');
});

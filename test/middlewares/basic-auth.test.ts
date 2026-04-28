import test from 'node:test';
import assert from 'node:assert/strict';

import { createOrva } from '../../src/index.ts';
import { basicAuth } from '../../src/middlewares/index.ts';

test('basicAuth rejects requests without valid credentials', async () => {
  const app = createOrva();

  app.get('/protected', basicAuth({ users: { admin: 'secret' } }), (c) => c.text('ok'));

  const missing = await app.fetch(new Request('https://example.com/protected'));
  assert.equal(missing.status, 401);
  assert.equal(missing.headers.get('www-authenticate'), 'Basic realm="Protected"');

  const invalid = await app.fetch(new Request('https://example.com/protected', {
    headers: { Authorization: `Basic ${btoa('admin:wrong')}` },
  }));
  assert.equal(invalid.status, 401);
});

test('basicAuth allows requests with valid credentials', async () => {
  const app = createOrva();

  app.get('/protected', basicAuth({ users: { admin: 'secret' } }), (c) => c.text('ok'));

  const response = await app.fetch(new Request('https://example.com/protected', {
    headers: { Authorization: `Basic ${btoa('admin:secret')}` },
  }));
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'ok');
});

import test from 'node:test';
import assert from 'node:assert/strict';

import { createOrva } from '../../src/index.ts';
import { allowMethods } from '../../src/middlewares/index.ts';

test('allowMethods rejects disallowed methods with allow header', async () => {
  const app = createOrva();

  app.all('/protected', allowMethods(['POST']), (c) => c.text('ok'));

  const response = await app.fetch(new Request('https://example.com/protected'));
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'POST');
  assert.equal(await response.text(), 'Method Not Allowed');
});

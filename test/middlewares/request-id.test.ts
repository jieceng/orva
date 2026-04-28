import test from 'node:test';
import assert from 'node:assert/strict';

import { createOrva } from '../../src/index.ts';
import { requestId } from '../../src/middlewares/index.ts';

test('requestId exposes the generated id on the response', async () => {
  const app = createOrva();

  app.use(requestId({ generator: () => 'req-fixed' }));
  app.get('/ok', (c) => c.text('ok'));

  const response = await app.fetch(new Request('https://example.com/ok'));
  assert.equal(response.headers.get('x-request-id'), 'req-fixed');
});

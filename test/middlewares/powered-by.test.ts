import test from 'node:test';
import assert from 'node:assert/strict';

import { createOrva } from '../../src/index.ts';
import { poweredBy } from '../../src/middlewares/index.ts';

test('poweredBy decorates notFound responses from global middleware', async () => {
  const app = createOrva();

  app.use(poweredBy('orva-test'));

  const response = await app.fetch(new Request('https://example.com/missing'));
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('x-powered-by'), 'orva-test');
});

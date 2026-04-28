import test from 'node:test';
import assert from 'node:assert/strict';

import { createOrva } from '../../src/index.ts';
import { responseTime } from '../../src/middlewares/index.ts';

test('responseTime adds a timing header', async () => {
  const app = createOrva();

  app.use(responseTime({ headerName: 'X-Time', precision: 0 }));
  app.get('/ok', (c) => c.text('ok'));

  const response = await app.fetch(new Request('https://example.com/ok'));
  assert.match(response.headers.get('x-time') || '', /^\d+ms$/);
});

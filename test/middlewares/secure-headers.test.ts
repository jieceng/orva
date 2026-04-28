import test from 'node:test';
import assert from 'node:assert/strict';

import { createNano } from '../../src/index.ts';
import { secureHeaders } from '../../src/middlewares/index.ts';

test('secureHeaders applies a baseline set of security headers', async () => {
  const app = createNano();

  app.use(secureHeaders());
  app.get('/secure', (c) => c.text('ok'));

  const response = await app.fetch(new Request('https://example.com/secure'));
  assert.equal(response.headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('cross-origin-opener-policy'), 'same-origin');
  assert.equal(response.headers.get('origin-agent-cluster'), '?1');
});

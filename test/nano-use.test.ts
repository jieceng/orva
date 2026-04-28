import test from 'node:test';
import assert from 'node:assert/strict';

import { createNano, defineMiddleware } from '../src/index.ts';
import { validator } from '../src/validator/index.ts';

test('app.use can accumulate vars and validated data types for downstream routes', async () => {
  const sessionMiddleware = defineMiddleware<{ session: string }>(async (c, next) => {
    c.set('session', 'session-1');
    await next();
  });

  const authHeaderValidator = validator(
    'header',
    (value: Record<string, string>) => ({ authorization: value.authorization ?? '' })
  );

  const app = createNano()
    .use(sessionMiddleware)
    .use(authHeaderValidator);

  app.get('/me', (c) => {
    const session: string | undefined = c.get('session');
    const header = c.valid('header');

    return c.json({
      session,
      authorization: header.authorization,
    });
  });

  const response = await app.fetch(new Request('https://example.com/me', {
    headers: { authorization: 'Bearer test' },
  }));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    session: 'session-1',
    authorization: 'Bearer test',
  });
});

test('group can promote route registry when callback returns the grouped app', async () => {
  const app = createNano().group('/api', (group) => {
    return group.get('/ping', (c) => c.json({ ok: true }));
  });

  const response = await app.fetch(new Request('https://example.com/api/ping'));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});

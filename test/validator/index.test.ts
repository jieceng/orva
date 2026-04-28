import test from 'node:test';
import assert from 'node:assert/strict';

import { createNano } from '../../src/index.ts';
import { getValidatedData, setValidatedData, validator } from '../../src/validator/index.ts';

test('validator parses request data and exposes typed validated values to handlers', async () => {
  const app = createNano();

  app.post(
    '/users/:id',
    validator('json', (value: unknown) => {
      const input = value as { name?: string };
      if (!input.name) {
        throw new Error('name is required');
      }
      return { name: input.name.trim() };
    }),
    validator('param', (value) => ({ id: value.id })),
    (c) => {
      const body = c.valid('json');
      const params = getValidatedData(c, 'param');
      return c.json({
        id: params.id,
        name: body.name,
      }, 201);
    }
  );

  const response = await app.fetch(new Request('https://example.com/users/7', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: ' nano ' }),
  }));

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    id: '7',
    name: 'nano',
  });
});

test('validator supports custom sources and custom error responses', async () => {
  const app = createNano();

  app.get(
    '/session',
    validator(
      'session',
      (value: string | null) => {
        if (!value) {
          throw new Error('session missing');
        }
        return value.toUpperCase();
      },
      {
        value: (c) => c.req.headers.get('x-session'),
        onError: (error, c) => c.json({ message: (error as Error).message }, 400),
      }
    ),
    (c) => {
      setValidatedData(c, 'trace', 'ok');
      return c.json({
        session: c.valid('session'),
        trace: c.valid('trace'),
      });
    }
  );

  const missing = await app.fetch(new Request('https://example.com/session'));
  assert.equal(missing.status, 400);
  assert.deepEqual(await missing.json(), { message: 'session missing' });

  const ok = await app.fetch(new Request('https://example.com/session', {
    headers: { 'x-session': 'abc' },
  }));
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), {
    session: 'ABC',
    trace: 'ok',
  });
});

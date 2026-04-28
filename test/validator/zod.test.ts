import test from 'node:test';
import assert from 'node:assert/strict';

import { z } from 'zod';

import { createOrva } from '../../src/index.ts';
import { zValidator, zodValidator } from '../../src/validator/zod.ts';

test('zodValidator parses data, preserves output types, and returns default errors', async () => {
  const app = createOrva();

  const schema = z.object({
    name: z.string().min(1).transform((value) => value.trim()),
    age: z.string().transform((value) => Number(value)),
  });

  app.post(
    '/users',
    zodValidator('json', schema),
    (c) => {
      const body = c.valid('json');
      const typedName: string = body.name;
      const typedAge: number = body.age;

      return c.json({
        name: typedName,
        age: typedAge,
      }, 201);
    }
  );

  const ok = await app.fetch(new Request('https://example.com/users', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: ' orva ', age: '18' }),
  }));
  assert.equal(ok.status, 201);
  assert.deepEqual(await ok.json(), { name: 'orva', age: 18 });

  const bad = await app.fetch(new Request('https://example.com/users', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: '', age: '18' }),
  }));
  assert.equal(bad.status, 422);
  const payload = await bad.json() as { error: string; issues: Array<{ path: string[] }> };
  assert.equal(payload.error, 'Validation Error');
  assert.equal(Array.isArray(payload.issues), true);
  assert.equal(payload.issues[0]?.path[0], 'name');
});

test('zValidator alias supports custom zod error handling', async () => {
  const app = createOrva();

  app.get(
    '/session',
    zValidator(
      'query',
      z.object({ token: z.string().min(3) }),
      {
        onError: (error, c) => c.json({ issues: error.issues }, 422),
      }
    ),
    (c) => c.json(c.valid('query'))
  );

  const bad = await app.fetch(new Request('https://example.com/session?token=ab'));
  assert.equal(bad.status, 422);

  const ok = await app.fetch(new Request('https://example.com/session?token=abcd'));
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), { token: 'abcd' });
});

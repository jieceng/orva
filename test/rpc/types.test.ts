import test from 'node:test';
import assert from 'node:assert/strict';

import { z } from 'zod';

import { createNano } from '../../src/index.ts';
import { createRPC } from '../../src/rpc/index.ts';
import { describeRoute } from '../../src/openapi/index.ts';
import { zodOpenAPISchema } from '../../src/openapi/zod.ts';
import { zodValidator } from '../../src/validator/zod.ts';

test('rpc typing requires path params and body validators as request inputs', async () => {
  const app = createNano().post(
    '/users/:id',
    zodValidator('json', z.object({ name: z.string() })),
    (c) => c.json({ ok: c.valid('json').name, id: c.params.id })
  );

  const rpc = createRPC<typeof app>({
    baseURL: 'https://api.example.com',
    fetch: async (_url, init) => {
      const body = JSON.parse(String(init?.body ?? '{}'));
      return new Response(JSON.stringify({ ok: body.name, id: '7' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  const typedMethod: (options: { body: { name: string }; param: { id: string } }) => Promise<{ ok: string; id: string }> =
    rpc.users[':id'].$post;
  const result = await typedMethod({
    body: { name: 'nano' },
    param: { id: '7' },
  });

  assert.deepEqual(result, { ok: 'nano', id: '7' });
});

test('route(prefix, subApp) preserves route registry for rpc typing', async () => {
  const users = createNano().get(
    '/users/:id',
    describeRoute({
      responses: {
        200: {
          description: 'User',
          schema: zodOpenAPISchema(z.object({ id: z.string() }), { componentName: 'RouteUser' }),
        },
      },
    }),
    (c) => c.json({ id: c.params.id })
  );

  const app = createNano().route('/api', users);

  const rpc = createRPC<typeof app>({
    baseURL: 'https://api.example.com',
    fetch: async () => new Response(JSON.stringify({ id: '7' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  });

  const promise = rpc.api.users[':id'].$get({ param: { id: '7' } });
  const typed: Promise<{ id: string }> = promise;
  assert.deepEqual(await typed, { id: '7' });
});

import test from 'node:test';
import assert from 'node:assert/strict';

import { z } from 'zod';

import { createOrva } from '../../src/index.ts';
import { createRPC } from '../../src/rpc/index.ts';
import { createRPCMetadata } from '../../src/rpc/metadata.ts';
import { describeRoute } from '../../src/openapi/index.ts';
import { zodOpenAPISchema } from '../../src/openapi/zod.ts';
import { zodValidator } from '../../src/validator/zod.ts';

test('rpc types and metadata read validator and schema contracts', async () => {
  const requestSchema = z.object({
    name: z.string().min(1),
  });
  const responseSchema = z.object({
    id: z.string(),
    name: z.string(),
  });

  const app = createOrva().post(
    '/users/:id',
    zodValidator('json', requestSchema),
    zodValidator('param', z.object({ id: z.string() })),
    describeRoute({
      summary: 'Create user',
      responses: {
        201: {
          description: 'Created',
          schema: zodOpenAPISchema(responseSchema),
        },
      },
    }),
    (c) => {
      const body = c.valid('json');
      const params = c.valid('param');
      return c.json({ id: params.id, name: body.name }, 201);
    }
  );

  const rpc = createRPC<typeof app>({
    baseURL: 'https://api.example.com',
    fetch: async (_url, init) => {
      const body = JSON.parse(String(init?.body ?? '{}'));
      return new Response(JSON.stringify({ id: '42', name: body.name }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  const resultPromise = rpc.users[':id'].$post({
    param: { id: '42' },
    body: { name: 'orva' },
  });
  const result: Promise<{ id: string; name: string }> = resultPromise;
  assert.deepEqual(await result, { id: '42', name: 'orva' });

  const metadata = createRPCMetadata(app);
  assert.equal(metadata[0]?.validators[0]?.provider, 'zod');
  assert.equal(metadata[0]?.responseSchemas[0]?.status, 201);
});

import test from 'node:test';
import assert from 'node:assert/strict';

import { z } from 'zod';

import type {
  Orva,
  RouteDefinition,
} from '../../src/index.ts';
import { createOrva } from '../../src/index.ts';
import { createRPC, type InferResponseType } from '../../src/rpc/index.ts';
import { createRPCMetadata } from '../../src/rpc/metadata.ts';
import { describeRoute } from '../../src/openapi/index.ts';
import { zodOpenAPISchema } from '../../src/openapi/zod.ts';
import { zodValidator } from '../../src/validator/zod.ts';
import type { OpenAPIOperationMetadata, SchemaContract } from '../../src/metadata.ts';

type AppWithRoutes<Routes extends Record<string, RouteDefinition>> = Orva<any, any, Routes, any>;
type TypedSchema<T> = SchemaContract<T, T>;

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

  type CreateUserOperation = OpenAPIOperationMetadata<{
    201: {
      description: string;
      schema: TypedSchema<{ id: string; name: string }>;
    };
  }>;
  type RPCApp = AppWithRoutes<{
    'POST /users/:id': RouteDefinition<
      '/users/:id',
      'POST',
      { param: { id: string }; body: { name: string } },
      { id: string; name: string },
      CreateUserOperation,
      { 201: { id: string; name: string } }
    >;
  }>;

  const rpc = createRPC<RPCApp>({
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
  const createUserMethod = rpc.users[':id'].$post;
  type CreateUserMethod = typeof createUserMethod;
  type CreatedUser = InferResponseType<CreateUserMethod, 201>;
  const result: Promise<{ status: 201; value(): Promise<CreatedUser> }> = resultPromise;
  const response = await result;
  assert.equal(response.status, 201);
  assert.deepEqual(await response.value(), { id: '42', name: 'orva' });

  const metadata = createRPCMetadata(app);
  assert.equal(metadata[0]?.validators[0]?.provider, 'zod');
  assert.equal(metadata[0]?.responseSchemas[0]?.status, 201);
});

import test from 'node:test';
import assert from 'node:assert/strict';

import { z } from 'zod';

import type {
  Orva,
  RouteDefinition,
} from '../../src/index.ts';
import { createOrva } from '../../src/index.ts';
import { createRPC } from '../../src/rpc/index.ts';
import { describeRoute } from '../../src/openapi/index.ts';
import { zodOpenAPISchema } from '../../src/openapi/zod.ts';
import { zodValidator } from '../../src/validator/zod.ts';
import type { OpenAPIOperationMetadata, SchemaContract } from '../../src/metadata.ts';

type AppWithRoutes<Routes extends Record<string, RouteDefinition>> = Orva<any, any, Routes, any>;
type TypedSchema<T> = SchemaContract<T, T>;

test('rpc typing requires path params and body validators as request inputs', async () => {
  const app = createOrva().post(
    '/users/:id',
    zodValidator('json', z.object({ name: z.string() })),
    describeRoute({
      responses: {
        201: {
          description: 'Created',
          schema: zodOpenAPISchema(z.object({ ok: z.string(), id: z.string() })),
        },
        422: {
          description: 'Invalid',
          schema: zodOpenAPISchema(z.object({ error: z.string() })),
        },
      },
    }),
    (c) => c.json({ ok: c.valid('json').name, id: c.params.id })
  );

  type CreateUserOperation = OpenAPIOperationMetadata<{
    201: {
      description: string;
      schema: TypedSchema<{ ok: string; id: string }>;
    };
    422: {
      description: string;
      schema: TypedSchema<{ error: string }>;
    };
  }>;
  type RPCApp = AppWithRoutes<{
    'POST /users/:id': RouteDefinition<
      '/users/:id',
      'POST',
      { param: { id: string }; body: { name: string } },
      { ok: string; id: string },
      CreateUserOperation
    >;
  }>;

  const rpc = createRPC<RPCApp>({
    baseURL: 'https://api.example.com',
    fetch: async (_url, init) => {
      const body = JSON.parse(String(init?.body ?? '{}'));
      return new Response(JSON.stringify({ ok: body.name, id: '7' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  const typedMethod: (options: { body: { name: string }; param: { id: string } }) => Promise<{
    status: 201;
    value(): Promise<{ ok: string; id: string }>;
  } | {
    status: 422;
    value(): Promise<{ error: string }>;
  }> =
    rpc.users[':id'].$post;
  const result = await typedMethod({
    body: { name: 'orva' },
    param: { id: '7' },
  });

  assert.equal(result.status, 201);
  assert.deepEqual(await result.value(), { ok: 'orva', id: '7' });
});

test('route(prefix, subApp) preserves route registry for rpc typing', async () => {
  const users = createOrva().get(
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

  const app = createOrva().route('/api', users);

  type GetUserOperation = OpenAPIOperationMetadata<{
    200: {
      description: string;
      schema: TypedSchema<{ id: string }>;
    };
  }>;
  type RPCApp = AppWithRoutes<{
    'GET /api/users/:id': RouteDefinition<
      '/api/users/:id',
      'GET',
      { param: { id: string } },
      { id: string },
      GetUserOperation
    >;
  }>;

  const rpc = createRPC<RPCApp>({
    baseURL: 'https://api.example.com',
    fetch: async () => new Response(JSON.stringify({ id: '7' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  });

  const promise = rpc.api.users[':id'].$get({ param: { id: '7' } });
  const typed: Promise<{ status: 200; value(): Promise<{ id: string }> }> = promise;
  const response = await typed;
  assert.equal(response.status, 200);
  assert.deepEqual(await response.value(), { id: '7' });
});

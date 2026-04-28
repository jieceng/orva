import test from 'node:test';
import assert from 'node:assert/strict';

import { z } from 'zod';

import type {
  Orva,
  RouteDefinition,
} from '../../src/index.ts';
import { createOrva } from '../../src/index.ts';
import { createRPC, type InferResponseType } from '../../src/rpc/index.ts';
import { describeRoute } from '../../src/openapi/index.ts';
import { zodOpenAPISchema } from '../../src/openapi/zod.ts';
import { validator } from '../../src/validator/index.ts';
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
      CreateUserOperation,
      {
        201: { ok: string; id: string };
        422: { error: string };
      }
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
      GetUserOperation,
      { 200: { id: string } }
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

test('rpc can infer response bodies directly from c.json without openapi metadata', async () => {
  const app = createOrva()
    .get('/posts', (c) => c.json([{ id: 1, title: 'Post 1' }]))
    .get('/posts/:id', (c) => c.json({ id: c.params.id, title: 'Post details' }));

  const rpc = createRPC<typeof app>({
    baseURL: 'https://api.example.com',
    fetch: async (url) => {
      const path = new URL(String(url)).pathname;
      if (path.endsWith('/posts')) {
        return new Response(JSON.stringify([{ id: 1, title: 'Post 1' }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ id: '123', title: 'Post details' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  const listGetter = rpc.posts.$get;
  const detailGetter = rpc.posts[':id'].$get;
  type PostsBody = InferResponseType<typeof listGetter>;
  type PostBody = InferResponseType<typeof detailGetter>;

  const postsTypeCheck: PostsBody = [{ id: 1, title: 'Post 1' }];
  const postTypeCheck: PostBody = { id: '123', title: 'Post details' };
  void postsTypeCheck;
  void postTypeCheck;
  // @ts-expect-error rpc.posts.$get should not resolve to string
  const invalidPostsType: PostsBody = 'bad';
  // @ts-expect-error rpc.posts[':id'].$get should not resolve to number
  const invalidPostType: PostBody = 1;
  void invalidPostsType;
  void invalidPostType;

  const posts = await rpc.posts.$get();
  // @ts-expect-error typed rpc json body should not be assignable to string
  const invalidPostsJson: string = await posts.json();
  void invalidPostsJson;
  const postsValue: { id: number; title: string }[] = await posts.value();
  assert.deepEqual(postsValue, [{ id: 1, title: 'Post 1' }]);

  const post = await rpc.posts[':id'].$get({ param: { id: '123' } });
  // @ts-expect-error typed rpc json body should not be assignable to number
  const invalidPostJson: number = await post.json();
  void invalidPostJson;
  const postValue: { id: string; title: string } = await post.json();
  assert.deepEqual(postValue, { id: '123', title: 'Post details' });
});

test('plain validator can contribute rpc request body shape when raw input is unknown', async () => {
  const userValidation = validator('json', (value: any) => ({
    name: value.name || '',
    email: value.email || '',
    age: value.age || 0,
  }));

  const app = createOrva().post('/users', userValidation, (c) => c.json({
    message: 'User validated',
    data: c.valid('json'),
  }));

  const rpc = createRPC<typeof app>({
    baseURL: 'https://api.example.com',
    fetch: async (_url, init) => new Response(String(init?.body ?? ''), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  });

  type CreateUserBody = Parameters<typeof rpc.users.$post>[0]['body'];
  const validBody: CreateUserBody = {
    name: 'orva',
    email: 'team@example.com',
    age: 1,
  };
  void validBody;
  // @ts-expect-error body should include the inferred validator output shape
  const invalidBody: CreateUserBody = {};
  void invalidBody;

  const response = await rpc.users.$post({
    body: {
      name: 'orva',
      email: 'team@example.com',
      age: 1,
    },
  });

  assert.equal(response.status, 200);
});

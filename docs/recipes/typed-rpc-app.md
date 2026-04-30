# Typed RPC App Recipe

This recipe shows how to make the server route contract visible to client code without generating a separate SDK first.

## Server

```ts
import { createOrva } from 'orvajs';
import { validator } from 'orvajs/validator';

export const app = createOrva()
  .get('/posts', (c) => c.json([{ id: 1, title: 'Post 1' }]))
  .get('/posts/:id', (c) => c.json({ id: c.params.id, title: 'Post details' }))
  .post(
    '/users',
    validator('json', (value: any) => ({
      name: String(value.name ?? ''),
      age: Number(value.age ?? 0),
    })),
    (c) => c.json({ ok: true, user: c.valid('json') }, 201),
  );
```

## Client

```ts
import { createRPC } from 'orvajs/rpc';
import { app } from './server';

const rpc = createRPC<typeof app>({
  baseURL: 'https://api.example.com',
});

const posts = await rpc.posts.$get();
const list = await posts.json();

const post = await rpc.posts[':id'].$get({
  param: { id: '123' },
});
const detail = await post.json();

await rpc.users.$post({
  body: {
    name: 'Ada',
    age: 20,
  },
});
```

## What gets inferred

- `list` becomes `{ id: number; title: string }[]`
- `detail` becomes `{ id: string; title: string }`
- `rpc.users.$post()` expects `body` as `{ name: string; age: number }`

## When to use this pattern

- frontend and backend live in the same monorepo
- internal tools want typed clients quickly
- you want RPC ergonomics without hiding the HTTP shape

## Read next

- [Type Flow](/guide/type-flow)
- [RPC](/rpc)
- [OpenAPI](/openapi)

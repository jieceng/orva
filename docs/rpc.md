# RPC

`orvajs/rpc` builds a typed client from your server-side routes instead of forcing you to redefine the contract elsewhere.

## Create a client

```ts
import { createRPC } from 'orvajs/rpc';
import { app } from '../src/app';

const client = createRPC<typeof app>({
  baseURL: 'https://api.example.com',
});
```

## Call shape

```ts
const user = await client.api.users[':id'].$get({
  param: { id: '42' },
  query: { expand: 'posts' },
});
```

Methods are exposed as `$get`, `$post`, `$put`, `$delete`, `$patch`, `$options`, and `$head`.

## Response types inferred from `c.json()`

If the server route returns `c.json(...)`, the RPC response body is inferred automatically:

```ts
const app = createOrva()
  .get('/posts', (c) => c.json([{ id: 1, title: 'Post 1' }]))
  .get('/posts/:id', (c) => c.json({ id: c.params.id, title: 'Post details' }));

const rpc = createRPC<typeof app>({
  baseURL: 'https://api.example.com',
});

const posts = await rpc.posts.$get();
const list = await posts.json();

const post = await rpc.posts[':id'].$get({
  param: { id: '123' },
});
const detail = await post.json();
```

In this example:

- `list` is `{ id: number; title: string }[]`
- `detail` is `{ id: string; title: string }`

## Request input inferred from validator output

Validator output also flows into RPC request types:

```ts
import { createOrva } from 'orvajs';
import { createRPC } from 'orvajs/rpc';
import { validator } from 'orvajs/validator';

const app = createOrva().post(
  '/users',
  validator('json', (value: any) => ({
    name: String(value.name ?? ''),
    age: Number(value.age ?? 0),
  })),
  (c) => c.json({ ok: true, user: c.valid('json') }),
);

const rpc = createRPC<typeof app>({
  baseURL: 'https://api.example.com',
});

await rpc.users.$post({
  body: {
    name: 'Ada',
    age: 20,
  },
});
```

Here the client-side `body` type is inferred as `{ name: string; age: number }`.

## Request options

```ts
await client.api.users.$post({
  body: { name: 'Ada' },
  headers: { Authorization: 'Bearer token' },
  cookie: { session: 'abc' },
});
```

Supported fields:

- `param`
- `query`
- `body`
- `headers`
- `cookie`

## Content-Type and body serialization

The RPC client serializes request bodies based on `Content-Type`:

- implicit default: JSON
- `application/x-www-form-urlencoded`: `URLSearchParams`
- `text/*`: string
- `FormData`: passthrough
- `Blob` / `ArrayBuffer` / `Uint8Array` / `ReadableStream`: passthrough

## Metadata access

If you need route contract metadata for tooling, code generation, or governance:

```ts
import { createRPCMetadata } from 'orvajs/rpc';

const routes = createRPCMetadata(app);
```

# Typed RPC App Recipe

这个 recipe 展示如何让服务端路由契约直接被客户端代码读取，而不需要先额外生成一套 SDK。

## 服务端

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

## 客户端

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

## 会推导出什么

- `list` 会变成 `{ id: number; title: string }[]`
- `detail` 会变成 `{ id: string; title: string }`
- `rpc.users.$post()` 的 `body` 会被限制为 `{ name: string; age: number }`

## 什么时候适合这种模式

- 前后端在同一个 monorepo
- 内部工具链需要快速获得 typed client
- 你想要 RPC 调用体验，但不想隐藏底层 HTTP 形状

## 下一步

- [类型链路](/zh/guide/type-flow)
- [RPC](/zh/rpc)
- [OpenAPI](/zh/openapi)

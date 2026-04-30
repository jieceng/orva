# 类型安全 RPC 应用示例

这一页演示如何把服务端路由契约直接暴露给客户端使用，而不需要先额外生成一套 SDK。

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

## 可以推导出的类型

- `list` 会变成 `{ id: number; title: string }[]`
- `detail` 会变成 `{ id: string; title: string }`
- `rpc.users.$post()` 的 `body` 会被约束为 `{ name: string; age: number }`

## 什么时候适合这种模式

- 前后端代码位于同一个 monorepo
- 内部系统需要尽快得到类型安全的客户端调用体验
- 你想获得 RPC 风格的调用方式，但又不想把底层 HTTP 结构完全藏起来

## 下一步

- [类型链路](/zh/guide/type-flow)
- [RPC](/zh/rpc)
- [OpenAPI](/zh/openapi)

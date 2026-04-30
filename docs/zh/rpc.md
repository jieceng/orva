# RPC

`orvajs/rpc` 让你基于服务端路由定义构建 typed client，而不需要再手写一层接口描述。

## 创建客户端

```ts
import { createRPC } from 'orvajs/rpc';
import type { app } from '../src/app';

const client = createRPC<typeof app>({
  baseURL: 'https://api.example.com',
  headers: {
    'x-client': 'orva-dashboard',
  },
});
```

## 调用方式

```ts
const user = await client.api.users[':id'].$get({
  param: { id: '42' },
  query: { expand: 'posts' },
});
```

HTTP 方法通过 `$get`、`$post`、`$put`、`$delete`、`$patch` 这类属性暴露。

## `c.json()` 的响应类型推导

如果服务端路由直接返回 `c.json(...)`，RPC 客户端的响应体类型会自动推导出来：

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

这里：

- `list` 的类型是 `{ id: number; title: string }[]`
- `detail` 的类型是 `{ id: string; title: string }`

## validator 输出到 RPC 入参推导

validator 的输出也会流入 RPC 请求参数类型：

```ts
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

这里客户端的 `body` 会被推导成 `{ name: string; age: number }`。

## 请求选项

```ts
await client.api.users.$post({
  body: { name: 'Ada' },
  headers: { Authorization: 'Bearer token' },
  cookie: { session: 'abc' },
});
```

支持的字段：

- `param`
- `query`
- `body`
- `headers`
- `cookie`

## Content-Type 与 body 序列化

RPC 客户端会根据 `Content-Type` 决定如何序列化请求体：

- 未显式指定时：默认 JSON
- `application/x-www-form-urlencoded`：转为 `URLSearchParams`
- `text/*`：转为字符串
- `FormData`：直接透传
- `Blob` / `ArrayBuffer` / `Uint8Array` / `ReadableStream`：直接透传

```ts
await client.api.forms.submit.$post({
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: { name: 'Ada', role: 'admin' },
});
```

## 错误行为

当响应 `!response.ok` 时，客户端会抛出错误，并附带响应文本内容。

```ts
try {
  await client.api.users.$post({ body: {} });
} catch (error) {
  console.error(error);
}
```

## 元数据读取

如果你需要把路由契约暴露给前端工具链、代码生成器或平台治理层，可以读取 RPC 元数据：

```ts
import { createRPCMetadata } from 'orvajs/rpc';

const routes = createRPCMetadata(app);
```

它会返回每条路由的：

- `method`
- `path`
- `validators`
- `responseSchemas`

## 最佳实践

- 把 `typeof app` 作为客户端泛型来源，避免重复声明接口。
- 路由拆分优先用 `route()` 或返回分组 app，以便保留类型注册表。
- 将 validator 与 OpenAPI 一起接入，RPC 类型会更完整。

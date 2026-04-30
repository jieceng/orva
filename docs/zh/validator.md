# Validator

`orva` 的 validator 中间件负责两件事：

1. 在运行时读取并解析请求输入
2. 把解析后的结果以类型安全方式暴露给 `c.valid()`

## 内置目标

| Target | 来源 |
| --- | --- |
| `json` | `await c.req.json()` |
| `form` | `await c.req.formData()` |
| `query` | `c.query` |
| `param` | `c.params` |
| `header` | `Object.fromEntries(c.req.headers.entries())` |
| `cookie` | `cookie` header |
| `text` | `await c.req.text()` |

## 基础用法

```ts
import { createOrva } from 'orvajs';
import { validator } from 'orvajs/validator';

const app = createOrva().post(
  '/users',
  validator('json', (value: { name?: string }) => {
    if (!value.name) throw new Error('name is required');
    return { name: value.name.trim() };
  }),
  (c) => {
    const body = c.valid('json');
    return c.json(body, 201);
  },
);
```

这里 `c.valid('json')` 的类型会是 `{ name: string }`。

## 多目标组合

```ts
const app = createOrva().get(
  '/users/:id',
  validator('param', (value: Record<string, string>) => ({ id: Number(value.id) })),
  validator('query', (value: Record<string, string>) => ({ expand: value.expand === '1' })),
  (c) => c.json({
    param: c.valid('param'),
    query: c.valid('query'),
  }),
);
```

## `getValidatedData()` 与 `setValidatedData()`

如果你更喜欢 helper，或者要在同一次请求里动态追加 validated data，可以这样写：

```ts
import {
  getValidatedData,
  setValidatedData,
  validator,
} from 'orvajs/validator';

const app = createOrva().post(
  '/users/:id',
  validator('json', (value: { name?: string }) => ({ name: value.name ?? '' })),
  validator('param', (value: Record<string, string>) => ({ id: value.id })),
  (c) => {
    const body = c.valid('json');
    const params = getValidatedData(c, 'param');

    setValidatedData(c, 'trace', 'ok');
    const trace = c.valid('trace');

    return c.json({ id: params.id, name: body.name, trace });
  },
);
```

类型行为：

- `c.valid('json')` 返回目标对应的解析后输出类型
- `getValidatedData(c, 'param')` 与 `c.valid('param')` 返回同样的类型
- `setValidatedData(c, key, value)` 会收窄当前请求上下文，后续 `c.valid(key)` 能直接拿到追加后的类型

## 自定义输入来源

```ts
validator('header', (value: { authorization: string }) => value, {
  value: (c) => ({
    authorization: c.req.headers.get('authorization') ?? '',
  }),
});
```

## 错误处理

```ts
validator('json', parseBody, {
  onError(error, c) {
    return c.json({ error: String(error) }, 400);
  },
});
```

如果不在这里处理，错误会继续交给 `app.onError()`。

## Zod 集成

```ts
import { z } from 'zod';
import { createOrva } from 'orvajs';
import { zodValidator } from 'orvajs/validator/zod';

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const app = createOrva().post(
  '/users',
  zodValidator('json', createUserSchema),
  (c) => c.json(c.valid('json'), 201),
);
```

`zodValidator()` 会默认做这些事：

- 推导输入与输出类型
- 保存 OpenAPI 兼容 schema 元数据
- 对 `json` / `form` / `text` 默认返回 `422`
- 对 `query` / `param` / `header` / `cookie` 默认返回 `400`

## 与 OpenAPI / RPC 的关系

validator 元数据会继续流向：

- `createOpenAPIDocument()`
- `createRPCMetadata()`
- 路由级输入类型推导

这也意味着 validator 的输出可以直接进入 RPC 客户端入参推导：

```ts
const app = createOrva().post(
  '/users',
  validator('json', (value: any) => ({
    name: String(value.name ?? ''),
    age: Number(value.age ?? 0),
  })),
  (c) => c.json({ ok: true, user: c.valid('json') }),
);
```

对 `createRPC<typeof app>()` 来说，客户端侧的 `body` 会被推成 `{ name: string; age: number }`。

这意味着一个校验声明，不只是一次运行时检查，而是整个契约链的一部分。

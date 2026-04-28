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
  (c) => c.json(c.valid('json'), 201),
);
```

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

这意味着一个校验声明，不只是一次运行时检查，而是整个契约链的一部分。
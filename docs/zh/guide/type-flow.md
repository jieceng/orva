# 类型链路

这一页讲 `orva` 最核心的设计优势：类型不会只停留在某一个 API 边界。

## 这条链路是什么

在一条典型的 `orva` 路由里，有价值的类型链路大致是：

1. `app.use()` 注入共享变量或 validated data
2. `validator()` 或 `zodValidator()` 解析请求输入
3. 路由 handler 从 `c` 上读取类型化数据
4. `c.json()` 定义响应体形状
5. `createRPC<typeof app>()` 读取请求和响应类型
6. `createOpenAPIDocument()` 读取同一批元数据生成文档

<OrvaContractPipeline />

## 一个完整例子

```ts
import { z } from 'zod';
import { createOrva, defineMiddleware } from 'orvajs';
import { createRPC } from 'orvajs/rpc';
import { zodValidator } from 'orvajs/validator/zod';

const session = defineMiddleware<{ session: { role: string } }>(async (c, next) => {
  c.set('session', { role: 'admin' });
  await next();
});

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const app = createOrva()
  .use(session)
  .post(
    '/users/:id',
    zodValidator('json', createUserSchema),
    (c) => {
      const body = c.valid('json');
      const role = c.get('session')?.role;

      return c.json({
        id: c.params.id,
        role,
        user: body,
      }, 201);
    },
  );

const rpc = createRPC<typeof app>({
  baseURL: 'https://api.example.com',
});
```

## 链路里分别流动了什么

### `app.use()`

`defineMiddleware()` 可以把类型化变量推入后续路由。

这样 `c.get('session')` 就不是松散挂载的状态，而是有静态类型的上下文。

### validator 输出

`zodValidator('json', schema)` 会把请求体解析结果变成 handler 的类型化输入。

所以 `c.valid('json')` 不只是运行时 helper，而是一条契约边界。

### 路由响应

当你返回 `c.json(...)` 时，响应体类型会被保留下来。

即使没有额外写 OpenAPI 响应声明，RPC 侧也能直接读到这部分类型。

### RPC 请求与响应

对 `createRPC<typeof app>()` 来说：

- `body` 会从 validator 输出推导
- `param` 会从路径参数推导
- `json()` 和 `value()` 会从 `c.json(...)` 或路由元数据推导

### OpenAPI 输出

当你再补充路由元数据或 schema-aware validator 时，同一条路由还能继续产出 OpenAPI 定义，而不需要再写一套重复契约。

## 这件事为什么重要

如果没有这条链路，团队通常要在四个地方重复描述同一个接口：

- 运行时校验
- handler 类型
- 客户端类型
- API 文档

`orva` 的目标就是让这些层尽量靠近，减少漂移。

## 下一步看什么

- [快速开始](/zh/guide/quickstart)
- [Validator](/zh/validator)
- [RPC](/zh/rpc)
- [OpenAPI](/zh/openapi)

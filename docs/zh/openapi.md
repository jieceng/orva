# OpenAPI

`orva/openapi` 提供的是一套“从路由出发”的文档生成能力，而不是单独维护一份 YAML。

## 最小示例

```ts
import { z } from 'zod';
import { createOrva } from 'orva';
import { zodValidator } from 'orva/validator/zod';
import { createOpenAPIDocument, describeRoute } from 'orva/openapi';

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const app = createOrva().post(
  '/users/:id',
  zodValidator('param', z.object({ id: z.string() })),
  zodValidator('json', z.object({ name: z.string() })),
  describeRoute({
    operationId: 'createUser',
    summary: 'Create a user',
    tags: ['Users'],
    responses: {
      201: {
        description: 'Created',
        schema: {
          provider: 'zod',
          componentName: 'User',
          schema: userSchema,
        },
      },
    },
  }),
  (c) => c.json({ id: c.valid('param').id, name: c.valid('json').name }, 201),
);

const document = createOpenAPIDocument(app, {
  info: {
    title: 'Orva API',
    version: '1.0.0',
  },
});
```

## 路由元数据

`describeRoute()` 可以声明：

- `operationId`
- `summary`
- `description`
- `tags`
- `parameters`
- `requestBody`
- `responses`
- `security`
- `callbacks`
- `servers`
- `externalDocs`
- path item 级元数据

## 组件化 helper

为了把文档站和 API 网关常用的 `components.*` 补齐，`orva/openapi` 提供了统一 helper API：

- `defineParameter()`
- `defineRequestBody()`
- `defineResponse()`
- `defineSecurityScheme()`
- `defineHeader()`
- `defineExample()`
- `defineLink()`
- `defineCallback()`
- `definePathItem()`

### 复用安全方案

```ts
import { defineSecurityScheme, requireSecurity } from 'orva/openapi';

const bearer = defineSecurityScheme('BearerAuth', {
  type: 'http',
  scheme: 'bearer',
});

describeRoute({
  security: [requireSecurity(bearer)],
});
```

## 自动推导

文档生成器会结合 validator 与 middleware 元数据自动补充：

- `parameter` / `requestBody` 约束
- 常见 `400` / `401` / `403` / `404` / `422` 响应
- `components.schemas` 复用
- `response headers`
- `securitySchemes`

## 高级能力

当前文档构建器支持：

- `components.schemas`
- `components.parameters`
- `components.responses`
- `components.requestBodies`
- `components.pathItems`
- `components.headers`
- `components.examples`
- `components.links`
- `components.callbacks`
- `components.securitySchemes`
- `webhooks`
- callback / link / example 引用
- 组件命名冲突检测与重命名策略

## 组件命名策略

如果多个组件名称冲突，可以通过 `componentConflicts` 与 `resolveComponentName` 控制行为：

```ts
const document = createOpenAPIDocument(app, {
  info: { title: 'Orva API', version: '1.0.0' },
  componentConflicts: {
    schemas: 'rename',
    responses: 'reuse',
  },
});
```

## 适合谁用

- 需要自动产出 OpenAPI 给前端、SDK 或网关
- 希望验证逻辑和文档契约保持单源
- 需要在 `components.*` 上做深度复用的团队
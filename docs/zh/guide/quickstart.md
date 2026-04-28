# 快速开始

这一页的目标不是只返回一个 `Hello World`，而是让你在几分钟内得到一个适合继续扩展的项目骨架。

## 安装

```bash
pnpm add orva
pnpm add -D typescript tsx
```

已发布的 `orva` npm 包只包含 `dist`、`README.md` 和 `LICENSE`。如果你要本地运行文档站，需要先获取完整仓库：

```bash
git clone https://github.com/jieceng/orva.git
cd orva
pnpm install
pnpm docs:dev
```

## 第一个服务

```ts
import { createOrva } from 'orva';
import { serveNode } from 'orva/adapters/node';

const app = createOrva();

app.get('/', (c) => c.text('orva is running'));
app.get('/users/:id', (c) => c.json({
  id: c.params.id,
  q: c.query.q ?? null,
}));

serveNode(app, { port: 3000 });
```

启动后访问：

- `GET http://localhost:3000/`
- `GET http://localhost:3000/users/42?q=active`

## 推荐目录结构

```text
src/
  app.ts
  routes/
    users.ts
  middlewares/
    auth.ts
  contracts/
    user.ts
server.ts
```

`src/app.ts`:

```ts
import { createOrva } from 'orva';
import { cors, secureHeaders } from 'orva/middlewares';
import { usersApp } from './routes/users';

export const app = createOrva()
  .use(cors(), secureHeaders())
  .route('/api', usersApp);
```

`src/routes/users.ts`:

```ts
import { createOrva } from 'orva';

export const usersApp = createOrva()
  .get('/', (c) => c.json([{ id: 'u_1', name: 'Ada' }]))
  .get('/:id', (c) => c.json({ id: c.params.id, name: 'Ada' }));
```

`server.ts`:

```ts
import { serveNode } from 'orva/adapters/node';
import { app } from './src/app';

serveNode(app, { port: 3000 });
```

## 先接上最基本的生产默认栈

大多数项目起步时，建议至少先加这些：

```ts
import { createOrva } from 'orva';
import {
  bodyLimit,
  cors,
  requestId,
  responseTime,
  secureHeaders,
} from 'orva/middlewares';

export const app = createOrva().use(
  requestId(),
  cors(),
  secureHeaders(),
  bodyLimit({ maxSize: 1024 * 1024 }),
  responseTime(),
);
```

## 接入 validator

```ts
import { z } from 'zod';
import { createOrva } from 'orva';
import { zodValidator } from 'orva/validator/zod';

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export const app = createOrva().post(
  '/users',
  zodValidator('json', createUserSchema),
  (c) => c.json(c.valid('json'), 201),
);
```

## 接入 OpenAPI 和 RPC

服务端应用保持不变，只是在旁边增加契约出口：

```ts
import { createRPCMetadata } from 'orva/rpc';
import { createOpenAPIDocument } from 'orva/openapi';
import { app } from './app';

export const rpcMetadata = createRPCMetadata(app);

export const openapi = createOpenAPIDocument(app, {
  info: {
    title: 'Orva Example',
    version: '1.0.0',
  },
});
```

## 导入策略建议

### 应用项目

```ts
import { cors, requestId } from 'orva/middlewares';
```

### 对外发布包、模板、基建层

```ts
import { cors } from 'orva/middlewares/cors';
import { requestId } from 'orva/middlewares/request-id';
```

<OrvaImportPlayground />

## 下一步

- 看 [路由与组合](/zh/guide/routing)
- 看 [Context 与响应](/zh/guide/context)
- 看 [中间件与类型累积](/zh/guide/production)
- 看 [测试与质量](/zh/guide/testing)

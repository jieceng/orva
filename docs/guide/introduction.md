# 介绍

`nano` 是一个基于 Fetch API 的 TypeScript Web 框架。它保留了极简的处理模型，同时把生产应用最常需要的几层能力补齐：

- 可组合的路由与中间件
- `app.use()` 级别的类型累积
- validator / zod validator
- 基于路由定义的 typed RPC 客户端
- OpenAPI 文档与组件化元数据
- Node、Bun、Deno、Cloudflare、Vercel、Netlify、Azure、AWS Lambda 适配器

## 适合什么项目

- API 服务
- BFF / Backend for Frontend
- Serverless / Edge 服务
- 希望用较小心智负担获得 typed contract 的团队

## 核心设计

### 1. 根入口只导出核心

```ts
import { createNano, defineMiddleware } from 'nano';
```

非核心能力统一走子模块：

```ts
import { createRPC } from 'nano/rpc';
import { serveNode } from 'nano/adapters/node';
import { cors } from 'nano/middlewares/cors';
import { validator } from 'nano/validator';
import { zodValidator } from 'nano/validator/zod';
import { createOpenAPIDocument } from 'nano/openapi';
```

### 2. 中间件类型不是装饰品

`nano` 允许通过 `defineMiddleware()` 和 validator 把类型累积到后续路由中：

```ts
import { createNano, defineMiddleware } from 'nano';

const session = defineMiddleware<{ session: { userId: string } }>(async (c, next) => {
  c.set('session', { userId: 'u_1' });
  await next();
});

const app = createNano()
  .use(session)
  .get('/me', (c) => c.json({ userId: c.get('session')?.userId }));
```

### 3. 接口契约应当复用，而不是重复描述

一个路由定义可以同时服务于：

- 运行时校验
- 类型推导
- RPC 客户端调用
- OpenAPI 文档生成

这也是 `nano` 区别于很多“只有路由、没有契约”的轻框架的地方。

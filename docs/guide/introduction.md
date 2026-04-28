# 介绍

`orva` 是一个基于 Fetch API 的 TypeScript Web 框架。它保持轻量的处理模型，同时把现代服务端项目最常需要的几层能力补齐：

- 可组合的路由与中间件
- `app.use()` 级别的类型累积
- validator / zod validator
- 基于路由注册表的 typed RPC 客户端
- OpenAPI 文档与组件化元数据
- Node、Bun、Deno、Cloudflare、Vercel、Netlify、Azure、AWS Lambda 适配器

## 设计目标

`orva` 的核心目标只有三个：

1. 保持一眼能看懂的请求处理模型。
2. 把类型、文档、客户端和运行时校验尽量收敛到同一份路由契约。
3. 让导出边界足够清晰，便于拆包、复用和生态发布。

这意味着它既不是只追求最小 API 面的“玩具框架”，也不是强绑定一整套大型约定的重框架。

## 适合什么项目

- API 服务
- BFF / Backend for Frontend
- Serverless / Edge 服务
- 需要 OpenAPI 或 typed client 的中后台系统
- 希望以较小心智负担获得契约链路的团队

## 不适合什么项目

- 你只需要一个单文件 demo，且不会使用中间件、校验、RPC、文档任一能力
- 你需要的是内置全栈页面渲染框架，而不是服务端应用框架
- 团队已经完全绑定到另一个强约定平台，且不打算复用现有业务逻辑

## 核心设计

### 1. 根入口只导出核心

```ts
import { createOrva, defineMiddleware } from 'orva';
```

非核心能力统一走子模块：

```ts
import { createRPC } from 'orva/rpc';
import { serveNode } from 'orva/adapters/node';
import { cors } from 'orva/middlewares/cors';
import { validator } from 'orva/validator';
import { zodValidator } from 'orva/validator/zod';
import { createOpenAPIDocument } from 'orva/openapi';
```

这样做有两个直接好处：

- 避免根入口膨胀
- 让应用层和生态层都更容易按需引入

### 2. 中间件类型不是装饰品

`orva` 允许通过 `defineMiddleware()` 和 validator 把类型累积到后续路由中：

```ts
import { createOrva, defineMiddleware } from 'orva';

const session = defineMiddleware<{ session: { userId: string; role: string } }>(async (c, next) => {
  c.set('session', { userId: 'u_1', role: 'admin' });
  await next();
});

const app = createOrva()
  .use(session)
  .get('/me', (c) => c.json({
    userId: c.get('session')?.userId,
    role: c.get('session')?.role,
  }));
```

### 3. 接口契约应当复用，而不是重复描述

一个路由定义可以同时服务于：

- 运行时校验
- 类型推导
- RPC 客户端调用
- OpenAPI 文档生成

这也是 `orva` 与很多“只有路由、没有契约链”的轻框架的主要区别。

## 与常见选择的区别

| 维度 | orva | 传统 Express 风格 |
| --- | --- | --- |
| 请求模型 | Fetch API 风格 | Node / Express 自有对象 |
| 类型链路 | 从中间件、validator 到 RPC / OpenAPI 可贯通 | 需要额外拼接多层工具 |
| 导出策略 | 根入口轻、子模块细 | 常见做法是全量聚合 |
| 多运行时 | 默认支持 Node + 多平台适配 | 以 Node 为核心，外部桥接更多 |

## 推荐的采用方式

- 新项目：先从 [快速开始](/guide/quickstart) 建立一个最小服务。
- 现有 API 服务：优先接 validator、错误处理和中间件，再补 RPC / OpenAPI。
- 平台基建：优先采用细粒度子模块路径，如 `orva/middlewares/cors`。

下一步建议阅读 [快速开始](/guide/quickstart) 和 [中间件与类型累积](/guide/production)。

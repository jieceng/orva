---
layout: home

hero:
  name: orva
  text: 以“学会”为目标的服务端框架文档
  tagline: 先跑起一个 Fetch API 服务，再循序渐进接入 validator、typed RPC、OpenAPI 和生产中间件，不需要切换心智模型。
  actions:
    - theme: brand
      text: 开始快速上手
      link: /zh/guide/quickstart
    - theme: alt
      text: 看懂类型链路
      link: /zh/guide/type-flow
    - theme: alt
      text: 构建 REST API
      link: /zh/recipes/rest-api
    - theme: alt
      text: 查阅参考资料
      link: /zh/reference/

features:
  - title: 分层学习
    details: "先运行服务，再理解 Context，再接入 validator、RPC、OpenAPI，文档顺序按学习路径组织，而不是只按模块堆叠。"
  - title: 一条契约链
    details: "`app.use()` 类型累积、validator 输出、RPC 输入推导、OpenAPI 元数据会被作为同一条链路来讲清楚。"
  - title: 面向真实服务
    details: "跑通 demo 之后，可以继续接入 adapters、中间件、测试、部署和参考资料，逐步落到生产场景。"
---

## 从这里开始

如果你是第一次使用 `orva`，建议按这个顺序学习：

1. [快速开始](/zh/guide/quickstart)：几分钟内跑起真实服务
2. [Context 与响应](/zh/guide/context)：掌握请求读取和响应辅助
3. [路由与组合](/zh/guide/routing)：学会拆分路由且不丢类型
4. [类型链路](/zh/guide/type-flow)：理解 middleware、validator、RPC、OpenAPI 如何贯通
5. [Recipes](/zh/recipes/rest-api)：开始做接近生产的应用

如果你是从其他 Node 或 Fetch 框架迁移过来，建议尽早阅读 [从 Express / Hono 迁移](/zh/guide/migration)。

## `orva` 擅长什么

- 基于 Fetch API 的小心智请求模型
- 明确的子路径导出，适合核心框架、RPC、adapters、validator、中间件、OpenAPI 分层使用
- 在运行时校验、handler 上下文、RPC 客户端、OpenAPI 输出之间复用契约
- 面向 Node、Bun、Deno、Serverless、Edge 的部署能力

<OrvaContractPipeline />

## 第一段真正有用的服务

```ts
import { createOrva } from 'orvajs';
import { serveNode } from 'orvajs/adapters/node';
import { requestId, secureHeaders } from 'orvajs/middlewares';

const app = createOrva()
  .use(requestId(), secureHeaders())
  .get('/health', (c) => c.json({
    ok: true,
    requestId: c.get('requestId'),
  }));

serveNode(app, { port: 3000 });
```

## 按任务学习

| 目标 | 对应页面 |
| --- | --- |
| 跑起第一个服务 | [快速开始](/zh/guide/quickstart) |
| 理解请求模型 | [Context 与响应](/zh/guide/context) |
| 理解契约传播 | [类型链路](/zh/guide/type-flow) |
| 构建 REST API | [REST API Recipe](/zh/recipes/rest-api) |
| 构建 typed client 工作流 | [Typed RPC App Recipe](/zh/recipes/typed-rpc-app) |
| 组装生产可用的中间件栈 | [Middleware Cookbook](/zh/recipes/middleware-cookbook) |
| 从其他框架迁移现有服务 | [迁移指南](/zh/guide/migration) |
| 查询模块和导出 | [参考资料](/zh/reference/) |

## 参考资料入口

| 能力域 | 入口 |
| --- | --- |
| 核心框架 | [参考资料总览](/zh/reference/) |
| Validator | [Validator](/zh/validator) |
| RPC | [RPC](/zh/rpc) |
| OpenAPI | [OpenAPI](/zh/openapi) |
| Middleware | [中间件目录](/zh/middlewares) |
| Adapters | [适配器](/zh/adapters) |

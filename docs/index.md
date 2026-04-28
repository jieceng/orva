---
layout: home

hero:
  name: orva
  text: 商用可落地的 Fetch API Web 框架
  tagline: 以接近 Hono 的使用方式，交付 typed middleware、validator、RPC、OpenAPI 和多运行时适配的一体化服务端能力。
  actions:
    - theme: brand
      text: 5 分钟上手
      link: /guide/quickstart
    - theme: alt
      text: 生产实践
      link: /guide/production
    - theme: alt
      text: 中间件目录
      link: /middlewares
    - theme: alt
      text: GitHub
      link: https://github.com/jieceng/orva

features:
  - title: 轻核心，不堆根导出
    details: 根入口只保留核心 API。RPC、adapters、middlewares、validator、openapi 统一走子路径，适合 tree-shaking、模板拆分和生态发布。
  - title: 类型链路可贯通
    details: app.use() 类型累积、validator 输出、RPC 输入推导、OpenAPI 元数据契约可以串成单链路，减少接口漂移和重复描述。
  - title: 运行时覆盖完整
    details: 覆盖 Node、Bun、Deno、Cloudflare、Vercel、Netlify、Azure、AWS Lambda，并提供 cookie、static、compress、安全头、认证、限流等常用能力。
---

## 为什么是 orva

`orva` 的目标不是只做一层轻路由，而是给希望保持小心智负担的团队，一套可以直接交付线上服务的 TypeScript 服务端工作流：

- 路由、Context、Middleware 足够直观，不强迫引入复杂抽象。
- validator、RPC、OpenAPI 共享路由与元数据，不需要多套接口描述。
- 导出结构清晰，适合多包仓库、CLI 模板、SDK、基建层复用。
- 对 Node 和主流 Serverless / Edge 平台都有稳定入口。

<OrvaContractPipeline />

## 一段最小可运行示例

```ts
import { createOrva } from 'orva';
import { serveNode } from 'orva/adapters/node';
import { cors, requestId, secureHeaders } from 'orva/middlewares';

const app = createOrva()
  .use(requestId(), cors(), secureHeaders())
  .get('/health', (c) => c.json({
    ok: true,
    requestId: c.get('requestId'),
  }));

serveNode(app, { port: 3000 });
```

## 适合什么场景

| 场景 | 为什么合适 |
| --- | --- |
| API / BFF 服务 | 路由、validator、typed response 组合简单，适合业务接口密集型项目 |
| 平台网关与中台 | OpenAPI、RPC、组件化 metadata 和中间件目录足够支撑治理场景 |
| 多运行时部署 | 同一应用代码可复用到 Node、Edge、Serverless |
| 基建模板与脚手架 | 子模块边界清晰，方便按需导出和生态封装 |

## 文档阅读路径

1. 从 [快速开始](/guide/quickstart) 跑通第一个 Node 服务，并理解推荐目录结构。
2. 阅读 [路由与组合](/guide/routing)、[Context 与响应](/guide/context)，掌握核心 API。
3. 接上 [Validator](/validator)、[RPC](/rpc)、[OpenAPI](/openapi)，把契约链打通。
4. 参考 [中间件与类型累积](/guide/production)、[测试与质量](/guide/testing)、[部署与运行时](/guide/deployment) 完成工程化落地。
5. 遇到选型或迁移问题时，再看 [常见问题](/guide/faq)。

## 能力总览

| 能力域 | 当前提供 |
| --- | --- |
| Core | `createOrva()` `group()` `route()` `onError()` `notFound()` |
| Context | `req` `params` `query` `cookie` `after()` `text/json/html/stream/sse/download` |
| Middleware | 50+ 细粒度中间件与 `orva/middlewares/*` 子模块导出 |
| Validation | 内置 `validator()` 与 `zodValidator()` |
| Contracts | `createRPC()` `createRPCMetadata()` `createOpenAPIDocument()` |
| Adapters | Node / Bun / Deno / Cloudflare / Vercel / Netlify / Azure / AWS Lambda |

## 采用建议

::: tip 适合怎样的团队
如果你的团队想要比传统 Express 体系更完整的类型链路，但又不想为了契约和部署层引入太重的框架约束，`orva` 是更平衡的选择。
:::

::: info 文档站能力
当前站点已接入多语言、版本入口、品牌资源、可复用演示组件与 Algolia 搜索配置。未提供 Algolia 环境变量时，会自动回退到本地搜索。
:::

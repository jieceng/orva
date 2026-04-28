---
layout: home

hero:
  name: nano
  text: 商用可落地的 Fetch API Web 框架
  tagline: 用接近 Hono 的心智模型，构建 typed middleware、validator、RPC、OpenAPI 和多运行时适配的一体化服务端应用。
  actions:
    - theme: brand
      text: 5 分钟上手
      link: /guide/quickstart
    - theme: alt
      text: 查看中间件目录
      link: /middlewares
    - theme: alt
      text: 导出与子模块
      link: /exports

features:
  - title: 小核心，清晰导出
    details: 根入口只暴露框架核心。RPC、adapters、middlewares、validator、openapi 全部走子路径，适合 tree-shaking 和生态拆包。
  - title: 类型链路完整
    details: app.use() 类型累积、validator 输出、RPC 客户端推导、OpenAPI 元数据契约可以贯通，减少接口漂移。
  - title: 面向生产交付
    details: 内置认证、限流、安全头、静态资源、压缩、观测等常用中间件，并覆盖 Node、Bun、Deno、Cloudflare、Vercel、Netlify、Azure、AWS Lambda。
---

## 为什么是 nano

`nano` 的目标不是做一个只会返回 `Hello World` 的极简玩具，而是提供一套轻量但完整的生产级服务端开发体验：

- 路由、Context、Middleware 保持直观。
- Typed validator / RPC / OpenAPI 彼此打通。
- 子模块拆分细，适合 npm 发布和按需引入。
- 适配器和中间件覆盖主流 Web / Serverless 运行时。

<NanoContractPipeline />

## 一段最小可运行示例

```ts
import { createNano } from 'nano';
import { serveNode } from 'nano/adapters/node';
import { cors, requestId } from 'nano/middlewares';

const app = createNano()
  .use(requestId(), cors())
  .get('/health', (c) => c.json({ ok: true, requestId: c.get('requestId') }));

serveNode(app, { port: 3000 });
```

## 推荐阅读顺序

1. 从 [快速开始](/guide/quickstart) 跑通第一个服务。
2. 用 [路由与组合](/guide/routing) 和 [Context 与响应](/guide/context) 熟悉核心 API。
3. 接入 [Validator](/validator)、[RPC](/rpc)、[OpenAPI](/openapi) 完成接口契约闭环。
4. 根据部署目标查看 [适配器](/adapters) 和 [中间件目录](/middlewares)。

::: tip 文档站能力
当前站点已经接入多语言、版本入口、品牌资源、可复用演示组件和 Algolia 搜索配置。若未提供 Algolia 环境变量，站点会自动回退到本地搜索。
:::

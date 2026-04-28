# orva

[English README](./README.md) | [中文文档站](https://jieceng.github.io/orva/zh/)

面向 Fetch API 的轻量 TypeScript Web 框架，提供 typed middleware、validator、RPC、OpenAPI 与多运行时适配能力。

## 安装

```bash
pnpm add orvajs
```

## 快速开始

```ts
import { createOrva } from 'orvajs';
import { serveNode } from 'orvajs/adapters/node';
import { cors, requestId, secureHeaders } from 'orvajs/middlewares';

const app = createOrva()
  .use(requestId(), cors(), secureHeaders())
  .get('/health', (c) => c.json({ ok: true, requestId: c.get('requestId') }));

serveNode(app, { port: 3000 });
```

## 文档入口

- 英文 README: [README.md](./README.md)
- 中文文档站: `https://jieceng.github.io/orva/zh/`
- 中文快速开始: `https://jieceng.github.io/orva/zh/guide/quickstart`
- 英文文档站: `https://jieceng.github.io/orva/`

## 包结构

根入口 `orvajs` 只导出核心框架能力，生态模块建议使用子路径导入：

```ts
import { createOrva, defineMiddleware } from 'orvajs';
import { validator } from 'orvajs/validator';
import { zodValidator } from 'orvajs/validator/zod';
import { createRPC } from 'orvajs/rpc';
import { createOpenAPIDocument } from 'orvajs/openapi';
import { serveNode } from 'orvajs/adapters/node';
import { cors } from 'orvajs/middlewares/cors';
```

## 常用链接

- GitHub: `https://github.com/jieceng/orva`
- npm: `https://www.npmjs.com/package/orvajs`
- 中文文档: `https://jieceng.github.io/orva/zh/`

## 许可证

[MIT](./LICENSE)

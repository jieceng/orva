# 导出与子模块

`orva` 的导出结构刻意保持分层，避免根入口膨胀。

## 根入口

根入口只导出框架核心：

```ts
import {
  Orva,
  createOrva,
  defineMiddleware,
  type Context,
  type Handler,
  type MiddlewareHandler,
} from 'orvajs';
```

## Validator

```ts
import { validator, getValidatedData, setValidatedData } from 'orvajs/validator';
import { zodValidator, zValidator } from 'orvajs/validator/zod';
```

## RPC

```ts
import { createRPC, createRPCMetadata } from 'orvajs/rpc';
```

## OpenAPI

```ts
import {
  createOpenAPIDocument,
  describeRoute,
  defineParameter,
  defineRequestBody,
  defineResponse,
  defineSecurityScheme,
  defineHeader,
  defineExample,
  defineLink,
  defineCallback,
  definePathItem,
  requireSecurity,
} from 'orvajs/openapi';
```

## Adapters

```ts
import { serveNode } from 'orvajs/adapters/node';
import { serveDeno } from 'orvajs/adapters/deno';
import { serveBun } from 'orvajs/adapters/bun';
import { createAWSLambdaHandler } from 'orvajs/adapters/aws-lambda';
import { createNetlifyFunctionHandler } from 'orvajs/adapters/netlify';
import { createAzureFunctionHandler } from 'orvajs/adapters/azure';
import { createCloudflareWorker } from 'orvajs/adapters/cloudflare';
import { createAppRouteHandler } from 'orvajs/adapters/vercel';
```

也可以从聚合入口导入：

```ts
import { serveNode, serveBun } from 'orvajs/adapters';
```

## Middlewares

```ts
import { cors, secureHeaders } from 'orvajs/middlewares';
import { cors as corsFactory } from 'orvajs/middlewares/cors';
```

## 建议

- 应用代码中，根入口只用于核心类型和 `createOrva()`
- 构建库或模板时，尽量使用细粒度子路径
- 不要再把 adapters / RPC / validator / openapi 重新回灌到根入口
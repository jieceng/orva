# 导出与子模块

`nano` 的导出结构刻意保持分层，避免根入口膨胀。

## 根入口

根入口只导出框架核心：

```ts
import {
  Nano,
  createNano,
  defineMiddleware,
  type Context,
  type Handler,
  type MiddlewareHandler,
} from 'nano';
```

## Validator

```ts
import { validator, getValidatedData, setValidatedData } from 'nano/validator';
import { zodValidator, zValidator } from 'nano/validator/zod';
```

## RPC

```ts
import { createRPC, createRPCMetadata } from 'nano/rpc';
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
} from 'nano/openapi';
```

## Adapters

```ts
import { serveNode } from 'nano/adapters/node';
import { serveDeno } from 'nano/adapters/deno';
import { serveBun } from 'nano/adapters/bun';
import { createAWSLambdaHandler } from 'nano/adapters/aws-lambda';
import { createNetlifyFunctionHandler } from 'nano/adapters/netlify';
import { createAzureFunctionHandler } from 'nano/adapters/azure';
import { createCloudflareWorker } from 'nano/adapters/cloudflare';
import { createAppRouteHandler } from 'nano/adapters/vercel';
```

也可以从聚合入口导入：

```ts
import { serveNode, serveBun } from 'nano/adapters';
```

## Middlewares

```ts
import { cors, secureHeaders } from 'nano/middlewares';
import { cors as corsFactory } from 'nano/middlewares/cors';
```

## 建议

- 应用代码中，根入口只用于核心类型和 `createNano()`
- 构建库或模板时，尽量使用细粒度子路径
- 不要再把 adapters / RPC / validator / openapi 重新回灌到根入口

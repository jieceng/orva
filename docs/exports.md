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
} from 'orva';
```

## Validator

```ts
import { validator, getValidatedData, setValidatedData } from 'orva/validator';
import { zodValidator, zValidator } from 'orva/validator/zod';
```

## RPC

```ts
import { createRPC, createRPCMetadata } from 'orva/rpc';
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
} from 'orva/openapi';
```

## Adapters

```ts
import { serveNode } from 'orva/adapters/node';
import { serveDeno } from 'orva/adapters/deno';
import { serveBun } from 'orva/adapters/bun';
import { createAWSLambdaHandler } from 'orva/adapters/aws-lambda';
import { createNetlifyFunctionHandler } from 'orva/adapters/netlify';
import { createAzureFunctionHandler } from 'orva/adapters/azure';
import { createCloudflareWorker } from 'orva/adapters/cloudflare';
import { createAppRouteHandler } from 'orva/adapters/vercel';
```

也可以从聚合入口导入：

```ts
import { serveNode, serveBun } from 'orva/adapters';
```

## Middlewares

```ts
import { cors, secureHeaders } from 'orva/middlewares';
import { cors as corsFactory } from 'orva/middlewares/cors';
```

## 建议

- 应用代码中，根入口只用于核心类型和 `createOrva()`
- 构建库或模板时，尽量使用细粒度子路径
- 不要再把 adapters / RPC / validator / openapi 重新回灌到根入口

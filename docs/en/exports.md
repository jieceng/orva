# Exports

`nano` keeps the root entry focused and pushes non-core features into explicit subpaths.

## Core

```ts
import { Nano, createNano, defineMiddleware } from 'nano';
```

## Subpaths

```ts
import { validator } from 'nano/validator';
import { createRPC } from 'nano/rpc';
import { createOpenAPIDocument } from 'nano/openapi';
import { serveNode } from 'nano/adapters/node';
import { cors } from 'nano/middlewares/cors';
```

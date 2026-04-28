# 快速开始

<NanoVersionBanner
  version="v3.1"
  channel="Stable snapshot"
  updated="2026-04"
  summary="适用于仍然运行在 nano 3.1.x 线上的服务。"
/>

```ts
import { createNano } from 'nano';
import { serveNode } from 'nano/adapters/node';

const app = createNano().get('/', (c) => c.text('nano v3.1'));

serveNode(app, { port: 3000 });
```

# Quickstart

<NanoVersionBanner
  version="v3.1"
  channel="Stable snapshot"
  updated="2026-04"
  summary="Use this page when your service is pinned to the nano 3.1.x line."
/>

```ts
import { createNano } from 'nano';
import { serveNode } from 'nano/adapters/node';

const app = createNano().get('/', (c) => c.text('nano v3.1'));

serveNode(app, { port: 3000 });
```

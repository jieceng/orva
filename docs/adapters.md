# Adapters

`orva` standardizes everything on `app.fetch(request)`, then adapts that entrypoint to each runtime.

## Supported runtimes

- Node.js
- Deno
- Bun
- Cloudflare Workers / Pages
- AWS Lambda
- Netlify
- Azure Functions
- Vercel

## Node.js

```ts
import { createOrva } from 'orva';
import { serveNode } from 'orva/adapters/node';

const app = createOrva().get('/', (c) => c.text('hello from node'));

serveNode(app, { port: 3000 });
```

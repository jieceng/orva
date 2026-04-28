# Deployment and Runtimes

`orva` keeps application code centered on `app.fetch(request)`. Platform differences live in adapters.

## Platform choices

| Target | Entry | Typical use |
| --- | --- | --- |
| Node.js | `serveNode` | regular APIs, containers, PM2, systemd |
| Bun | `serveBun` | Bun-native services |
| Deno | `serveDeno` | Deno-native HTTP apps |
| Cloudflare | `createCloudflareWorker` | edge APIs |
| Vercel | `createAppRouteHandler` | App Router and edge routes |
| AWS Lambda | `createAWSLambdaHandler` | API Gateway + Lambda |
| Netlify | `createNetlifyFunctionHandler` | functions and edge functions |
| Azure | `createAzureFunctionHandler` | Azure Functions |

See [Adapters](/en/adapters) for the full matrix.

## Deployment rule of thumb

Keep business logic in `src/app.ts`, and keep each platform file as a thin adapter entrypoint.

## Release checklist

1. `pnpm typecheck`
2. `pnpm test`
3. `pnpm build`
4. `pnpm docs:build`
5. verify `exports` and package files

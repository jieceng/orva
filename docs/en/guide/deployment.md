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

## GitHub Pages for docs

This repository is configured to deploy VitePress docs to GitHub Pages from GitHub Actions.

Required repository settings:

1. Open `Settings -> Pages`
2. Set `Source` to `GitHub Actions`
3. Keep the default branch as `main`

The workflow lives at `.github/workflows/docs.yml` and publishes `docs/.vitepress/dist`.

For this repository, the Pages site will be served under the `/orva/` base path, so the VitePress config sets the production base automatically during CI.
The workflow currently builds with Node.js 24.
The published docs URL is `https://jieceng.github.io/orva/`.

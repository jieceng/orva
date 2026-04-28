# Middleware Catalog

`orva` ships with a production-oriented middleware layer, but the ergonomics only matter if you can quickly find the right one. This page is the full catalog for the active release line: every middleware export, what it is for, where to import it from, and the smallest useful example.

<OrvaMiddlewareMap locale="en" />

## Import styles

Use aggregate imports in applications:

```ts
import { cors, requestId, secureHeaders } from 'orvajs/middlewares';
```

Use subpath imports in libraries, templates, CLIs, and shared infrastructure packages:

```ts
import { cors } from 'orvajs/middlewares/cors';
import { requestId } from 'orvajs/middlewares/request-id';
import { secureHeaders } from 'orvajs/middlewares/secure-headers';
```

## Quick picks

| Scenario | Recommended stack |
| --- | --- |
| Browser-facing API | `requestId()` `logger()` `cors()` `secureHeaders()` `bodyLimit()` `responseTime()` |
| Internal admin panel | `basicAuth()` `requireOrigin()` `rateLimit()` `secureHeaders()` |
| Public API | `bearerAuth()` or `apiKeyAuth()` plus `rateLimit()` `requestId()` `responseTime()` |
| Static assets | `serveStatic()` with `etag()` `compress()` `cacheControl()` |
| Security baseline | `secureHeaders()` plus `contentSecurityPolicy()` and `strictTransportSecurity()` |

::: tip How to read the examples
Examples use the smallest meaningful configuration. For larger apps, prefer wrapping these stacks in route groups or shared middleware factories.
:::

<a id="authentication"></a>

## Authentication

These middlewares all gate access and set `c.get('auth')` / `c.var.auth` style metadata for downstream handlers.

| Middleware | Import | Use it for | Example |
| --- | --- | --- | --- |
| `basicAuth()` | `orvajs/middlewares/basic-auth` | Browser prompts, internal tools, admin consoles | `app.use(basicAuth({ users: { admin: 'secret' } }))` |
| `bearerAuth()` | `orvajs/middlewares/bearer-auth` | Bearer token APIs and service-to-service auth | `app.use(bearerAuth({ token: ['token-a', 'token-b'] }))` |
| `apiKeyAuth()` | `orvajs/middlewares/api-key-auth` | Header or query based API keys | `app.use(apiKeyAuth({ key: ['k1'], headerName: 'X-API-Key' }))` |

### Authentication recipe

```ts
import { createOrva } from 'orvajs';
import { basicAuth, bearerAuth, apiKeyAuth } from 'orvajs/middlewares';

const app = createOrva()
  .get('/admin', basicAuth({ users: { admin: 'secret' } }), (c) => c.text('ok'))
  .get('/internal', bearerAuth({ token: 'internal-token' }), (c) => c.text('ok'))
  .get('/partners', apiKeyAuth({ key: ['partner-key'], queryName: 'apiKey' }), (c) => c.text('ok'));
```

<a id="guards"></a>

## Guards

Use these when the request should be rejected before the main handler runs.

| Middleware | Import | Use it for | Example |
| --- | --- | --- | --- |
| `allowMethods()` | `orvajs/middlewares/allow-methods` | Allow only a small method set | `app.use(allowMethods(['GET', 'POST']))` |
| `blockMethods()` | `orvajs/middlewares/block-methods` | Block dangerous or unsupported methods | `app.use(blockMethods(['TRACE', 'CONNECT']))` |
| `requireHeader()` | `orvajs/middlewares/require-header` | Require one or more headers | `app.use(requireHeader(['x-tenant-id']))` |
| `requireQuery()` | `orvajs/middlewares/require-query` | Require one or more query params | `app.use(requireQuery(['page']))` |
| `requireJson()` | `orvajs/middlewares/require-json` | Enforce `application/json` on write methods | `app.use(requireJson())` |
| `requireAccept()` | `orvajs/middlewares/require-accept` | Enforce `Accept` negotiation | `app.use(requireAccept(['application/json']))` |
| `bodyLimit()` | `orvajs/middlewares/body-limit` | Reject oversized request bodies | `app.use(bodyLimit({ maxBytes: 1024 * 1024 }))` |
| `timeout()` | `orvajs/middlewares/timeout` | Fail slow requests with a timeout response | `app.use(timeout({ ms: 5_000 }))` |
| `rateLimit()` | `orvajs/middlewares/rate-limit` | Protect endpoints against bursts and abuse | `app.use(rateLimit({ limit: 100, windowMs: 60_000 }))` |
| `hostAllowlist()` | `orvajs/middlewares/host-allowlist` | Restrict valid hosts | `app.use(hostAllowlist(['api.example.com']))` |
| `blockUserAgents()` | `orvajs/middlewares/block-user-agents` | Block bots or broken clients by pattern | `app.use(blockUserAgents([/curl/i, 'BadBot']))` |
| `requireOrigin()` | `orvajs/middlewares/require-origin` | Restrict browser origins | `app.use(requireOrigin(['https://app.example.com']))` |
| `idempotencyKey()` | `orvajs/middlewares/idempotency-key` | Require `Idempotency-Key` on mutating endpoints | `app.use(idempotencyKey())` |
| `csrfOrigin()` | `orvajs/middlewares/csrf-origin` | CSRF-style origin checks for body-carrying requests | `app.use(csrfOrigin(['https://app.example.com']))` |

### Guard recipe

```ts
import { createOrva } from 'orvajs';
import {
  allowMethods,
  bodyLimit,
  idempotencyKey,
  rateLimit,
  requireJson,
  requireOrigin,
} from 'orvajs/middlewares';

const app = createOrva().use(
  allowMethods(['GET', 'POST', 'PATCH']),
  requireOrigin(['https://app.example.com']),
  requireJson(),
  bodyLimit({ maxBytes: 2 * 1024 * 1024 }),
  idempotencyKey(),
  rateLimit({ limit: 60, windowMs: 60_000 }),
);
```

<a id="http-response"></a>

## HTTP Response

These middlewares shape headers, redirects, validators, and response metadata.

| Middleware | Import | Use it for | Example |
| --- | --- | --- | --- |
| `poweredBy()` | `orvajs/middlewares/powered-by` | Add `X-Powered-By` | `app.use(poweredBy('orva'))` |
| `responseHeaders()` | `orvajs/middlewares/response-headers` | Append one or more dynamic/static headers | `app.use(responseHeaders({ headers: { 'x-app': 'orva' } }))` |
| `cacheControl()` | `orvajs/middlewares/cache-control` | Set cache policy | `app.use(cacheControl('public, max-age=60'))` |
| `noStore()` | `orvajs/middlewares/no-store` | Disable caching | `app.use(noStore())` |
| `vary()` | `orvajs/middlewares/vary` | Add `Vary` headers | `app.use(vary('Origin', 'Accept-Encoding'))` |
| `cors()` | `orvajs/middlewares/cors` | Cross-origin browser access | `app.use(cors({ origin: ['https://app.example.com'], credentials: true }))` |
| `httpsRedirect()` | `orvajs/middlewares/https-redirect` | Redirect HTTP traffic to HTTPS | `app.use(httpsRedirect({ status: 308 }))` |
| `trailingSlash()` | `orvajs/middlewares/trailing-slash` | Add or remove trailing slashes | `app.use(trailingSlash({ mode: 'remove' }))` |
| `etag()` | `orvajs/middlewares/etag` | Add strong ETag validators and 304 support | `app.use(etag())` |
| `responseTag()` | `orvajs/middlewares/response-tag` | Stamp a single response header | `app.use(responseTag('x-release', '2026-04'))` |
| `contentType()` | `orvajs/middlewares/content-type` | Provide a fallback content type | `app.use(contentType('application/json; charset=utf-8'))` |
| `checksum()` | `orvajs/middlewares/checksum` | Add a body hash header | `app.use(checksum('X-Body-SHA1'))` |
| `responseChecksumTrailer()` | `orvajs/middlewares/response-checksum-trailer` | Add a digest-style response hash | `app.use(responseChecksumTrailer('Digest'))` |
| `contentLength()` | `orvajs/middlewares/content-length` | Compute `Content-Length` when missing | `app.use(contentLength())` |

### HTTP recipe

```ts
import { createOrva } from 'orvajs';
import {
  cacheControl,
  cors,
  etag,
  responseHeaders,
  secureHeaders,
  vary,
} from 'orvajs/middlewares';

const app = createOrva().use(
  cors({ origin: ['https://app.example.com'], credentials: true }),
  secureHeaders(),
  cacheControl('public, max-age=60'),
  vary('Origin', 'Accept-Encoding'),
  responseHeaders({ headers: { 'x-service': 'edge-api' } }),
  etag(),
);
```

<a id="observability"></a>

## Observability

These middlewares capture request metadata and write it into response headers or `c.var`.

| Middleware | Import | Use it for | Example |
| --- | --- | --- | --- |
| `logger()` | `orvajs/middlewares/logger` | Console or custom request logging | `app.use(logger({ includeQuery: true }))` |
| `requestId()` | `orvajs/middlewares/request-id` | Stable request correlation IDs | `app.use(requestId({ contextKey: 'requestId' }))` |
| `responseTime()` | `orvajs/middlewares/response-time` | Add an elapsed-time header | `app.use(responseTime())` |
| `requestMeta()` | `orvajs/middlewares/request-meta` | Store method/path/query/headers in context | `app.use(requestMeta())` |
| `userAgent()` | `orvajs/middlewares/user-agent` | Store `User-Agent` in context | `app.use(userAgent())` |
| `clientIp()` | `orvajs/middlewares/client-ip` | Store client IP from proxy headers | `app.use(clientIp())` |
| `serverTiming()` | `orvajs/middlewares/server-timing` | Add `Server-Timing` | `app.use(serverTiming('app;dur=12'))` |
| `requestContext()` | `orvajs/middlewares/request-context` | Store combined IP / UA / origin metadata | `app.use(requestContext())` |
| `requestSize()` | `orvajs/middlewares/request-size` | Capture request size in bytes | `app.use(requestSize())` |
| `locale()` | `orvajs/middlewares/locale` | Parse `Accept-Language` | `app.use(locale('en'))` |
| `requestBodyText()` | `orvajs/middlewares/request-body-text` | Store the raw request body text | `app.use(requestBodyText())` |

### Observability recipe

```ts
import { createOrva } from 'orvajs';
import {
  clientIp,
  logger,
  requestContext,
  requestId,
  responseTime,
  serverTiming,
} from 'orvajs/middlewares';

const app = createOrva().use(
  requestId(),
  clientIp(),
  requestContext(),
  logger({ includeQuery: true }),
  responseTime(),
  serverTiming('app;dur=8'),
);
```

<a id="security-headers"></a>

## Security Headers

Use `secureHeaders()` for a fast baseline, or compose individual policies when you need tighter control.

| Middleware | Import | Use it for | Example |
| --- | --- | --- | --- |
| `contentSecurityPolicy()` | `orvajs/middlewares/content-security-policy` | CSP and report-only policies | `app.use(contentSecurityPolicy({ directives: { defaultSrc: [\"'self'\"] } }))` |
| `referrerPolicy()` | `orvajs/middlewares/referrer-policy` | Referrer leakage control | `app.use(referrerPolicy('strict-origin-when-cross-origin'))` |
| `frameOptions()` | `orvajs/middlewares/frame-options` | Clickjacking protection | `app.use(frameOptions('DENY'))` |
| `xContentTypeOptions()` | `orvajs/middlewares/x-content-type-options` | MIME sniffing protection | `app.use(xContentTypeOptions())` |
| `xDnsPrefetchControl()` | `orvajs/middlewares/x-dns-prefetch-control` | DNS prefetch policy | `app.use(xDnsPrefetchControl(false))` |
| `xDownloadOptions()` | `orvajs/middlewares/x-download-options` | IE download safety header | `app.use(xDownloadOptions())` |
| `xPermittedCrossDomainPolicies()` | `orvajs/middlewares/x-permitted-cross-domain-policies` | Adobe/Flash cross-domain restrictions | `app.use(xPermittedCrossDomainPolicies('none'))` |
| `xXssProtection()` | `orvajs/middlewares/x-xss-protection` | Legacy browser XSS header | `app.use(xXssProtection('0'))` |
| `strictTransportSecurity()` | `orvajs/middlewares/strict-transport-security` | HSTS | `app.use(strictTransportSecurity({ maxAge: 31536000, preload: true }))` |
| `permissionsPolicy()` | `orvajs/middlewares/permissions-policy` | Restrict browser capabilities | `app.use(permissionsPolicy({ directives: { geolocation: [] } }))` |
| `crossOriginEmbedderPolicy()` | `orvajs/middlewares/cross-origin-embedder-policy` | COEP | `app.use(crossOriginEmbedderPolicy('require-corp'))` |
| `crossOriginOpenerPolicy()` | `orvajs/middlewares/cross-origin-opener-policy` | COOP | `app.use(crossOriginOpenerPolicy('same-origin'))` |
| `crossOriginResourcePolicy()` | `orvajs/middlewares/cross-origin-resource-policy` | CORP | `app.use(crossOriginResourcePolicy('same-origin'))` |
| `originAgentCluster()` | `orvajs/middlewares/origin-agent-cluster` | Origin-Agent-Cluster isolation | `app.use(originAgentCluster('?1'))` |
| `secureHeaders()` | `orvajs/middlewares/secure-headers` | Sensible security-header defaults | `app.use(secureHeaders())` |

### Security recipe

```ts
import { createOrva } from 'orvajs';
import {
  contentSecurityPolicy,
  secureHeaders,
  strictTransportSecurity,
} from 'orvajs/middlewares';

const app = createOrva().use(
  secureHeaders(),
  contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      scriptSrc: ["'self'"],
    },
  }),
  strictTransportSecurity({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  }),
);
```

<a id="asset-delivery"></a>

## Asset Delivery

These are the delivery middlewares most teams want once docs, dashboards, or uploaded assets show up.

| Middleware | Import | Use it for | Example |
| --- | --- | --- | --- |
| `serveStatic()` | `orvajs/middlewares/serve-static` | Static files, manifests, SPA fallback | `app.get('/assets/*', serveStatic({ root: 'public', prefix: '/assets', etag: true }))` |
| `compress()` | `orvajs/middlewares/compress` | Brotli / gzip / deflate compression | `app.use(compress({ threshold: 1024, encodings: ['br', 'gzip'] }))` |

### Asset delivery recipe

```ts
import { createOrva } from 'orvajs';
import { cacheControl, compress, etag, serveStatic } from 'orvajs/middlewares';

const app = createOrva()
  .use(compress({ threshold: 1024, encodings: ['br', 'gzip'] }), cacheControl('public, max-age=600'), etag())
  .get('/assets/*', serveStatic({
    root: 'public',
    prefix: '/assets',
    index: false,
    etag: true,
  }))
  .get('/*', serveStatic({
    root: 'public',
    spaFallback: 'index.html',
  }));
```

<a id="cookie-utilities"></a>

## Cookie Utilities

These are utility exports, not `app.use()` middlewares. Use them inside custom middleware, adapters, auth flows, and tests.

| Utility | Import | Use it for | Example |
| --- | --- | --- | --- |
| `getCookie()` | `orvajs/middlewares/cookie` | Read a single cookie from a request | `const session = getCookie(request, 'session')` |
| `parseCookieHeader()` | `orvajs/middlewares/cookie` | Parse the full `cookie` header | `const cookies = parseCookieHeader(request.headers.get('cookie'))` |
| `serializeCookie()` | `orvajs/middlewares/cookie` | Build a `Set-Cookie` value | `serializeCookie('theme', 'dark', { path: '/', httpOnly: true })` |
| `serializeDeleteCookie()` | `orvajs/middlewares/cookie` | Expire and remove cookies | `serializeDeleteCookie('session', { path: '/' })` |

### Cookie recipe

```ts
import { defineMiddleware } from 'orvajs';
import { getCookie, serializeCookie, serializeDeleteCookie } from 'orvajs/middlewares/cookie';

export const sessionCookies = defineMiddleware(async (c, next) => {
  const session = getCookie(c.req, 'session');

  c.after((response) => {
    if (!session) {
      response.headers.append('Set-Cookie', serializeCookie('session', 'new-session', {
        path: '/',
        httpOnly: true,
      }));
    }
    return response;
  });

  await next();
});

export function logoutHeaders(): Headers {
  return new Headers({
    'Set-Cookie': serializeDeleteCookie('session', { path: '/' }),
  });
}
```

## What to use first

If you are just getting started, the shortest stable stack is still:

```ts
import { createOrva } from 'orvajs';
import {
  bodyLimit,
  cors,
  logger,
  requestId,
  responseTime,
  secureHeaders,
} from 'orvajs/middlewares';

const app = createOrva().use(
  requestId(),
  logger(),
  cors(),
  secureHeaders(),
  bodyLimit({ maxBytes: 1024 * 1024 }),
  responseTime(),
);
```

Then expand from there only when the route shape actually needs it.

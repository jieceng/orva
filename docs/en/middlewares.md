# Middleware Catalog

`nano` ships with a production-oriented middleware set and fine-grained subpath exports.

## Import styles

```ts
import { cors, requestId, secureHeaders } from 'nano/middlewares';
```

```ts
import { cors } from 'nano/middlewares/cors';
import { requestId } from 'nano/middlewares/request-id';
import { secureHeaders } from 'nano/middlewares/secure-headers';
```

Use subpath imports for libraries, templates and published infrastructure packages.

## Main groups

- Authentication
- Guards
- HTTP / response shaping
- Observability
- Security headers
- Asset delivery
- Cookie utilities

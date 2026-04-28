# Middleware and Type Accumulation

In `nano`, `app.use()` is not only a runtime chain. It also accumulates route-visible types.

```ts
import { createNano, defineMiddleware } from 'nano';
import { validator } from 'nano/validator';

const session = defineMiddleware<{ session: { id: string; role: string } }>(async (c, next) => {
  c.set('session', { id: 'u_1', role: 'admin' });
  await next();
});

const app = createNano()
  .use(session)
  .use(validator('header', (headers: Record<string, string>) => ({
    authorization: headers.authorization ?? '',
  })));
```

## Import strategy

```ts
import { cors, secureHeaders, requestId } from 'nano/middlewares';
```

```ts
import { cors } from 'nano/middlewares/cors';
import { secureHeaders } from 'nano/middlewares/secure-headers';
import { requestId } from 'nano/middlewares/request-id';
```

<NanoImportPlayground />

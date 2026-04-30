# Validator

The validator layer in `orvajs` does two things:

1. read and normalize request input at runtime
2. expose parsed output to downstream handlers through typed validated data

## Built-in targets

- `json`
- `form`
- `query`
- `param`
- `header`
- `cookie`
- `text`

## Basic example

```ts
import { createOrva } from 'orvajs';
import { validator } from 'orvajs/validator';

const app = createOrva().post(
  '/users',
  validator('json', (value: { name?: string }) => {
    if (!value.name) throw new Error('name is required');
    return { name: value.name.trim() };
  }),
  (c) => {
    const body = c.valid('json');
    return c.json(body, 201);
  },
);
```

`c.valid('json')` is typed as `{ name: string }`.

## Multi-target composition

```ts
const app = createOrva().get(
  '/users/:id',
  validator('param', (value: Record<string, string>) => ({ id: value.id })),
  validator('query', (value: Record<string, string>) => ({
    expand: value.expand === '1',
  })),
  (c) => {
    const params = c.valid('param');
    const query = c.valid('query');

    return c.json({ params, query });
  },
);
```

## `getValidatedData()` and `setValidatedData()`

If you prefer helpers or want to append validated data later in the same request, use:

```ts
import {
  getValidatedData,
  setValidatedData,
  validator,
} from 'orvajs/validator';

const app = createOrva().post(
  '/users/:id',
  validator('json', (value: { name?: string }) => ({ name: value.name ?? '' })),
  validator('param', (value: Record<string, string>) => ({ id: value.id })),
  (c) => {
    const body = c.valid('json');
    const params = getValidatedData(c, 'param');

    setValidatedData(c, 'trace', 'ok');
    const trace = c.valid('trace');

    return c.json({ id: params.id, name: body.name, trace });
  },
);
```

Type behavior:

- `c.valid('json')` returns the parsed output for the target
- `getValidatedData(c, 'param')` returns the same typed value as `c.valid('param')`
- `setValidatedData(c, key, value)` narrows the current request context, so later `c.valid(key)` is typed

## Custom input sources

```ts
validator('header', (value: { authorization: string }) => value, {
  value: (c) => ({
    authorization: c.req.headers.get('authorization') ?? '',
  }),
});
```

## Error handling

```ts
validator('json', parseBody, {
  onError(error, c) {
    return c.json({ error: String(error) }, 400);
  },
});
```

If you do not handle the error here, it continues into `app.onError()`.

## Zod integration

```ts
import { z } from 'zod';
import { createOrva } from 'orvajs';
import { zodValidator } from 'orvajs/validator/zod';

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const app = createOrva().post(
  '/users',
  zodValidator('json', createUserSchema),
  (c) => c.json(c.valid('json'), 201),
);
```

`zodValidator()` automatically:

- infers input and output types
- stores OpenAPI-compatible schema metadata
- returns `422` by default for `json` / `form` / `text`
- returns `400` by default for `query` / `param` / `header` / `cookie`

## Relationship with RPC and OpenAPI

Validator metadata continues into:

- `createOpenAPIDocument()`
- `createRPCMetadata()`
- route-level input inference

That means validator output can become RPC request input:

```ts
const app = createOrva().post(
  '/users',
  validator('json', (value: any) => ({
    name: String(value.name ?? ''),
    age: Number(value.age ?? 0),
  })),
  (c) => c.json({ ok: true, user: c.valid('json') }),
);
```

For `createRPC<typeof app>()`, the client-side `body` shape becomes `{ name: string; age: number }`.

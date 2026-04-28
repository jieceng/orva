# RPC

`nano/rpc` builds a typed client from your server-side routes instead of forcing you to redefine the contract elsewhere.

## Create a client

```ts
import { createRPC } from 'nano/rpc';
import type { app } from '../src/app';

const client = createRPC<typeof app>({
  baseURL: 'https://api.example.com',
});
```

## Call shape

```ts
const user = await client.api.users[':id'].$get({
  param: { id: '42' },
  query: { expand: 'posts' },
});
```

Methods are exposed as `$get`, `$post`, `$put`, `$delete` and `$patch`.

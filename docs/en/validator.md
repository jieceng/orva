# Validator

The validator layer in `orva` does two things:

1. read and normalize request input at runtime
2. expose parsed output to downstream handlers through `c.valid()`

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
  (c) => c.json(c.valid('json'), 201),
);
```

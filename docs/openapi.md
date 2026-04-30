# OpenAPI

`orvajs/openapi` gives you route-first OpenAPI generation instead of maintaining a separate YAML file by hand.

## Minimal example

```ts
import { z } from 'zod';
import { createOrva } from 'orvajs';
import { zodValidator } from 'orvajs/validator/zod';
import { createOpenAPIDocument, describeRoute } from 'orvajs/openapi';

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const app = createOrva().post(
  '/users/:id',
  zodValidator('param', z.object({ id: z.string() })),
  zodValidator('json', z.object({ name: z.string() })),
  describeRoute({
    operationId: 'createUser',
    summary: 'Create a user',
    tags: ['Users'],
    responses: {
      201: {
        description: 'Created',
        schema: {
          provider: 'zod',
          componentName: 'User',
          schema: userSchema,
        },
      },
    },
  }),
  (c) => c.json({ id: c.valid('param').id, name: c.valid('json').name }, 201),
);

const document = createOpenAPIDocument(app, {
  info: {
    title: 'Orva API',
    version: '1.0.0',
  },
});
```

## Route metadata

`describeRoute()` can declare:

- `operationId`
- `summary`
- `description`
- `tags`
- `parameters`
- `requestBody`
- `responses`
- `security`
- `callbacks`
- `servers`
- `externalDocs`
- path-item-level metadata

## Component helper API

To cover the common `components.*` areas used by docs tooling and API gateways, `orvajs/openapi` ships with a unified helper set:

- `defineParameter()`
- `defineRequestBody()`
- `defineResponse()`
- `defineSecurityScheme()`
- `defineHeader()`
- `defineExample()`
- `defineLink()`
- `defineCallback()`
- `definePathItem()`

### Reuse security schemes

```ts
import { defineSecurityScheme, requireSecurity } from 'orvajs/openapi';

const bearer = defineSecurityScheme('BearerAuth', {
  type: 'http',
  scheme: 'bearer',
});

describeRoute({
  security: [requireSecurity(bearer)],
});
```

## Automatic inference

The document builder combines validator and middleware metadata to infer:

- `parameter` / `requestBody` constraints
- common `400` / `401` / `403` / `404` / `422` responses
- `components.schemas` reuse
- `response headers`
- `securitySchemes`

## Advanced coverage

The current OpenAPI builder supports:

- `components.schemas`
- `components.parameters`
- `components.responses`
- `components.requestBodies`
- `components.pathItems`
- `components.headers`
- `components.examples`
- `components.links`
- `components.callbacks`
- `components.securitySchemes`
- `webhooks`
- callback / link / example references
- component conflict detection and rename strategies

## Component naming strategy

If multiple components collide by name, control the behavior with `componentConflicts` and `resolveComponentName`:

```ts
const document = createOpenAPIDocument(app, {
  info: { title: 'Orva API', version: '1.0.0' },
  componentConflicts: {
    schemas: 'rename',
    responses: 'reuse',
  },
});
```

## Good fit

- teams that need automatic OpenAPI output for frontend apps, SDKs, or gateways
- teams that want one source of truth for validation and documentation contracts
- teams that need deep reuse across `components.*`

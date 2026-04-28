# OpenAPI

`orvajs/openapi` gives you route-first OpenAPI generation instead of a separate hand-maintained YAML file.

## Minimal example

```ts
import { z } from 'zod';
import { createOrva } from 'orvajs';
import { zodValidator } from 'orvajs/validator/zod';
import { createOpenAPIDocument, describeRoute } from 'orvajs/openapi';
```

## Helpers

- `describeRoute()`
- `defineParameter()`
- `defineRequestBody()`
- `defineResponse()`
- `defineSecurityScheme()`
- `defineHeader()`
- `defineExample()`
- `defineLink()`
- `defineCallback()`
- `definePathItem()`

## Generated component coverage

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

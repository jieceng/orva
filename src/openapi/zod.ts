import { z, type ZodType, type input as ZodInput, type output as ZodOutput } from 'zod';

import type { SchemaContract } from '../metadata.js';

export interface ZodOpenAPISchemaOptions {
  componentName?: string;
}

export function zodOpenAPISchema<Schema extends ZodType>(
  schema: Schema,
  options: ZodOpenAPISchemaOptions = {}
): SchemaContract<ZodInput<Schema>, ZodOutput<Schema>> {
  return {
    provider: 'zod',
    schema,
    componentName: options.componentName,
    toOpenAPISchema(current, mode) {
      return z.toJSONSchema(current as ZodType, {
        target: 'openapi-3.0',
        unrepresentable: 'any',
        io: mode,
      }) as Record<string, unknown>;
    },
  };
}

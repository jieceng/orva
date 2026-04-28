import type { RouteRuntimeDefinition } from '../metadata.js';

export interface RPCReadable {
  getRouteDefinitions(): readonly RouteRuntimeDefinition[];
}

export interface RPCRouteMetadata {
  method: string;
  path: string;
  validators: Array<{
    target: string;
    provider: string;
    schema?: unknown;
  }>;
  responseSchemas: Array<{
    status: number;
    provider?: string;
    schema?: unknown;
  }>;
}

export function createRPCMetadata(app: RPCReadable): RPCRouteMetadata[] {
  return app.getRouteDefinitions().map((definition) => ({
    method: definition.method,
    path: definition.path,
    validators: definition.validators.map((validator) => ({
      target: validator.target,
      provider: validator.provider,
      schema: validator.schema,
    })),
    responseSchemas: Object.entries(definition.openapi?.responses ?? {}).map(([status, response]) => ({
      status: Number(status),
      provider: response.schema?.provider,
      schema: response.schema?.schema,
    })),
  }));
}

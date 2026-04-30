import type { RouteRuntimeDefinition } from '../metadata.js';
import {
  summarizeRouteResponseSchemas,
  summarizeRouteValidators,
} from '../route-runtime-contract.js';

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
    validators: summarizeRouteValidators(definition),
    responseSchemas: summarizeRouteResponseSchemas(definition),
  }));
}

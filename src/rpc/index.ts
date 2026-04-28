export {
  createRPC,
  type RPCClientOptions,
} from './client.js';
export { createRPCMetadata, type RPCReadable, type RPCRouteMetadata } from './metadata.js';

export type {
  OrvaRPC,
  RPCClient,
  RPCMethod,
  RPCResponse,
  RPCRouteDefinition,
  RPCPathProxy,
  RPCRequestOptions,
  InferRPCResponse,
  InferResponseType,
  RouteParams,
  ParamsFromPath,
} from './types.js';

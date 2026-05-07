import { Orva } from '../core/index.js';

export interface CloudflareWorkerEnv {
  [key: string]: unknown;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

export interface CloudflareWorkerModule {
  fetch: (request: Request, env: CloudflareWorkerEnv, ctx: ExecutionContext) => Response | Promise<Response>;
}

export interface CloudflarePagesContext {
  request: Request;
  env: CloudflareWorkerEnv;
  params: Record<string, string>;
  next: () => Promise<Response>;
}

export interface CloudflarePagesFunction {
  (context: CloudflarePagesContext): Response | Promise<Response>;
}

export function createCloudflareWorker<T extends object>(
  app: Orva<T>
): CloudflareWorkerModule {
  return {
    fetch: async (request: Request, _env: CloudflareWorkerEnv, _ctx: ExecutionContext) => {
      return app.fetch(request);
    },
  };
}

export function createCloudflareWorkerWithEnv<T extends object>(
  app: Orva<T>,
  _envInjector?: (env: CloudflareWorkerEnv, ctx: ExecutionContext) => Partial<T>
): CloudflareWorkerModule {
  return {
    fetch: async (request: Request, _env: CloudflareWorkerEnv, _ctx: ExecutionContext) => {
      return app.fetch(request);
    },
  };
}

export function createPagesFunction<T extends object>(
  app: Orva<T>
): CloudflarePagesFunction {
  return async (context: CloudflarePagesContext) => {
    return app.fetch(context.request);
  };
}

export function createDefaultWorker<T extends object>(
  app: Orva<T>
): CloudflareWorkerModule {
  return createCloudflareWorker(app);
}

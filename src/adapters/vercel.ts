import { Orva } from '../core/index.js';

export interface VercelEdgeContext {
  params?: Record<string, string>;
}

export interface VercelRouteHandlers {
  GET: (request: Request, context?: VercelEdgeContext) => Promise<Response>;
  POST: (request: Request, context?: VercelEdgeContext) => Promise<Response>;
  PUT: (request: Request, context?: VercelEdgeContext) => Promise<Response>;
  DELETE: (request: Request, context?: VercelEdgeContext) => Promise<Response>;
  PATCH: (request: Request, context?: VercelEdgeContext) => Promise<Response>;
}

export function createVercelEdgeHandler<T extends object>(
  app: Orva<T>
): (request: Request) => Response | Promise<Response> {
  return (request: Request) => app.fetch(request);
}

export function createAppRouteHandler<T extends object>(
  app: Orva<T>
): VercelRouteHandlers {
  const handler = (request: Request) => Promise.resolve(app.fetch(request));
  
  return {
    GET: handler,
    POST: handler,
    PUT: handler,
    DELETE: handler,
    PATCH: handler,
  };
}

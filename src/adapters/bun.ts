import { Orva } from '../orva.js';

export interface BunServeOptions {
  port?: number;
  hostname?: string;
  development?: boolean;
  maxRequestBodySize?: number;
  error?: (error: Error) => Response | Promise<Response>;
}

export interface BunServer {
  port: number;
  hostname: string;
  development: boolean;
  stop: () => void;
  ref: () => void;
  unref: () => void;
}

declare global {
  interface BunServeOptionsGlobal {
    port?: number;
    hostname?: string;
    development?: boolean;
    maxRequestBodySize?: number;
    fetch: (request: Request, server: BunServer) => Response | Promise<Response>;
    error?: (error: Error) => Response | Promise<Response>;
  }
  
  interface BunServerGlobal {
    port: number;
    hostname: string;
    development: boolean;
    stop: () => void;
    ref: () => void;
    unref: () => void;
  }
  
  const Bun: {
    serve: (options: BunServeOptionsGlobal) => BunServerGlobal;
  };
}

export function serveBun<T extends object>(
  app: Orva<T>,
  options: BunServeOptions = {}
): BunServer {
  const { port = 3000, hostname = '0.0.0.0', development = false, maxRequestBodySize, error } = options;
  const server = Bun.serve({
    port,
    hostname,
    development,
    maxRequestBodySize,
    fetch: (request: Request) => app.fetch(request),
    error: error || ((err: Error) => {
      console.error('[Orva] Bun server error:', err);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  });

  console.log(`🚀 Orva server running on http://${server.hostname}:${server.port}`);
  
  return server as unknown as BunServer;
}

export function createBunHandler<T extends object>(
  app: Orva<T>
): (request: Request) => Response | Promise<Response> {
  return (request: Request) => app.fetch(request);
}

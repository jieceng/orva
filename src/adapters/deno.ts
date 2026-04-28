import { Nano } from '../nano.js';

export interface DenoServeOptions {
  port?: number;
  hostname?: string;
  onListen?: (params: { hostname: string; port: number }) => void;
}

export interface DenoHttpServer {
  shutdown: () => Promise<void>;
}

declare global {
  interface DenoServeOptionsGlobal {
    port?: number;
    hostname?: string;
    onListen?: (params: { hostname: string; port: number }) => void;
  }
  
  interface DenoHttpServerGlobal {
    shutdown: () => Promise<void>;
  }
  
  const Deno: {
    serve: {
      (options: DenoServeOptionsGlobal, handler: (request: Request) => Response | Promise<Response>): DenoHttpServerGlobal;
      (handler: (request: Request) => Response | Promise<Response>): DenoHttpServerGlobal;
    };
    env: {
      get(key: string): string | undefined;
    };
  };
}

export function serveDeno<T extends object>(
  app: Nano<T>,
  options: DenoServeOptions = {}
): DenoHttpServer {
  const { port = 3000, hostname = '0.0.0.0', onListen } = options;

  const handler = async (request: Request): Promise<Response> => {
    return app.fetch(request);
  };
  const server = Deno.serve({ port, hostname, onListen }, handler);
  
  console.log(`🚀 Nano server running on http://${hostname}:${port}`);
  
  return server;
}

export function createDenoHandler<T extends object>(
  app: Nano<T>
): (request: Request) => Promise<Response> {
  return (request: Request) => Promise.resolve(app.fetch(request));
}

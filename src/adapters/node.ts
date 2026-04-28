import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { Nano, EnhancedRequest } from '../nano.js';

export interface NodeServerOptions {
  hostname?: string;
  port: number;
}

// 移除默认泛型参数，直接使用传入的 T
export function serveNode<T extends object>(
  app: Nano<T>,
  options: NodeServerOptions | number,
  callback?: () => void
): ReturnType<typeof createServer> {
  const opts: NodeServerOptions = typeof options === 'number'
    ? { port: options }
    : options;

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const host = req.headers.host || opts.hostname || 'localhost';
      const protocol = (req.socket as Socket & { encrypted?: boolean })?.encrypted ? 'https' : 'http';
      const url = `${protocol}://${host}${req.url || '/'}`;

      const headers = new Headers();
      Object.entries(req.headers).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            headers.set(key, value.join(', '));
          } else {
            headers.set(key, value);
          }
        }
      });

      let body: BodyInit | null = null;
      if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
        const buffer = await new Promise<Buffer>((resolve, reject) => {
          const chunks: Buffer[] = [];
          req.on('data', (chunk: Buffer) => chunks.push(chunk));
          req.on('end', () => resolve(Buffer.concat(chunks)));
          req.on('error', reject);
        });
        body = new Uint8Array(buffer);
      }

      const request = new Request(url, {
        method: req.method,
        headers,
        body,
      }) as EnhancedRequest;

      const response = await app.fetch(request);

      res.statusCode = response.status;
      res.statusMessage = response.statusText;

      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      if (response.body) {
        const reader = response.body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
        } finally {
          reader.releaseLock();
        }
      }

      res.end();

    } catch (err) {
      console.error('[Nano Adapter] Error:', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      } else {
        res.end();
      }
    }
  });

  server.listen(opts.port, opts.hostname, callback);
  return server;
}
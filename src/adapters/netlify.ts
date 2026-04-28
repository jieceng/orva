import { Nano } from '../nano.js';
import {
  AdapterBinaryOptions,
  appendHeaderValues,
  decodeRequestBody,
  encodeResponseBody,
  headersToObject,
} from './shared.js';

export interface NetlifyFunctionEvent {
  httpMethod: string;
  path: string;
  rawUrl?: string;
  rawQuery?: string;
  headers?: Record<string, string | undefined>;
  multiValueHeaders?: Record<string, string[] | undefined>;
  body?: string | null;
  isBase64Encoded?: boolean;
}

export interface NetlifyFunctionContext {
  requestId?: string;
}

export interface NetlifyFunctionResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
  isBase64Encoded?: boolean;
}

export interface NetlifyFunctionOptions extends AdapterBinaryOptions {
  baseUrl?: string;
}

function createRequest(event: NetlifyFunctionEvent, options: NetlifyFunctionOptions): Request {
  const headers = new Headers();
  appendHeaderValues(headers, event.headers ?? null);
  appendHeaderValues(headers, event.multiValueHeaders ?? null);

  const url = event.rawUrl
    ?? `${options.baseUrl ?? 'https://netlify.local'}${event.path}${event.rawQuery ? `?${event.rawQuery}` : ''}`;

  return new Request(url, {
    method: event.httpMethod,
    headers,
    body: decodeRequestBody(event.body, event.isBase64Encoded),
  });
}

export function createNetlifyFunctionHandler<T extends object>(
  app: Nano<T>,
  options: NetlifyFunctionOptions = {}
): (event: NetlifyFunctionEvent, context?: NetlifyFunctionContext) => Promise<NetlifyFunctionResponse> {
  return async (event: NetlifyFunctionEvent, _context?: NetlifyFunctionContext) => {
    const response = await app.fetch(createRequest(event, options));
    const payload = await encodeResponseBody(response, options);

    return {
      statusCode: response.status,
      headers: headersToObject(response.headers),
      body: payload.body,
      isBase64Encoded: payload.isBase64Encoded,
    };
  };
}

export function createNetlifyEdgeHandler<T extends object>(
  app: Nano<T>
): (request: Request) => Promise<Response> {
  return (request: Request) => Promise.resolve(app.fetch(request));
}

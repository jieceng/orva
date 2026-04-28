import { Orva } from '../orva.js';
import {
  AdapterBinaryOptions,
  appendHeaderValues,
  buildQueryString,
  decodeRequestBody,
  encodeResponseBody,
  getSetCookieHeaders,
  headersToObject,
} from './shared.js';

export interface AWSLambdaContext {
  awsRequestId?: string;
}

export interface APIGatewayProxyEventV2 {
  version: '2.0';
  rawPath: string;
  rawQueryString?: string;
  headers?: Record<string, string | undefined>;
  cookies?: string[];
  requestContext?: {
    domainName?: string;
    http?: {
      method: string;
      path?: string;
    };
  };
  body?: string | null;
  isBase64Encoded?: boolean;
}

export interface APIGatewayProxyEvent {
  version?: string;
  path: string;
  httpMethod: string;
  headers?: Record<string, string | undefined>;
  multiValueHeaders?: Record<string, string[] | undefined>;
  queryStringParameters?: Record<string, string | undefined> | null;
  multiValueQueryStringParameters?: Record<string, string[] | undefined> | null;
  body?: string | null;
  isBase64Encoded?: boolean;
  requestContext?: {
    domainName?: string;
  };
}

export interface APIGatewayProxyStructuredResultV2 {
  statusCode: number;
  headers?: Record<string, string>;
  body?: string;
  isBase64Encoded?: boolean;
  cookies?: string[];
}

export interface AWSLambdaHandlerOptions extends AdapterBinaryOptions {
  baseUrl?: string;
}

export type AWSLambdaEvent = APIGatewayProxyEventV2 | APIGatewayProxyEvent;

function isEventV2(event: AWSLambdaEvent): event is APIGatewayProxyEventV2 {
  return event.version === '2.0';
}

function getRequestUrl(event: AWSLambdaEvent, options: AWSLambdaHandlerOptions): string {
  if (options.baseUrl) {
    const base = new URL(options.baseUrl);
    if (isEventV2(event)) {
      base.pathname = event.rawPath || '/';
      base.search = event.rawQueryString ? `?${event.rawQueryString}` : '';
      return base.toString();
    }

    base.pathname = event.path || '/';
    base.search = buildQueryString(event.multiValueQueryStringParameters ?? event.queryStringParameters);
    return base.toString();
  }

  const headers = event.headers ?? {};
  const host = headers.host
    ?? headers.Host
    ?? event.requestContext?.domainName
    ?? 'lambda.local';
  const protocol = headers['x-forwarded-proto']
    ?? headers['X-Forwarded-Proto']
    ?? 'https';

  if (isEventV2(event)) {
    return `${protocol}://${host}${event.rawPath || '/'}${event.rawQueryString ? `?${event.rawQueryString}` : ''}`;
  }

  return `${protocol}://${host}${event.path || '/'}${buildQueryString(event.multiValueQueryStringParameters ?? event.queryStringParameters)}`;
}

function createRequest(event: AWSLambdaEvent, options: AWSLambdaHandlerOptions): Request {
  const headers = new Headers();
  appendHeaderValues(headers, event.headers ?? null);

  if (isEventV2(event) && event.cookies?.length) {
    headers.set('cookie', event.cookies.join('; '));
  } else if ('multiValueHeaders' in event) {
    appendHeaderValues(headers, event.multiValueHeaders ?? null);
  }

  const method = isEventV2(event)
    ? event.requestContext?.http?.method ?? 'GET'
    : event.httpMethod;

  return new Request(getRequestUrl(event, options), {
    method,
    headers,
    body: decodeRequestBody(event.body, event.isBase64Encoded),
  });
}

export function createAWSLambdaHandler<T extends object>(
  app: Orva<T>,
  options: AWSLambdaHandlerOptions = {}
): (event: AWSLambdaEvent, context?: AWSLambdaContext) => Promise<APIGatewayProxyStructuredResultV2> {
  return async (event: AWSLambdaEvent, _context?: AWSLambdaContext) => {
    const response = await app.fetch(createRequest(event, options));
    const payload = await encodeResponseBody(response, options);
    const cookies = getSetCookieHeaders(response.headers);

    return {
      statusCode: response.status,
      headers: headersToObject(response.headers),
      body: payload.body,
      isBase64Encoded: payload.isBase64Encoded,
      ...(cookies.length ? { cookies } : {}),
    };
  };
}

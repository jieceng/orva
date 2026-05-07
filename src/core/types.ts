import type {
  CookieOptions,
  DeleteCookieOptions,
} from '../cookies.js';

export type HTTPMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS'
  | 'CONNECT'
  | 'TRACE'
  | (string & {});

export type StatusCode = number;
export type ResponseFormat = 'json' | 'text' | 'html' | 'stream' | 'empty';

export type TypedResponse<
  Status extends StatusCode = StatusCode,
  Body = unknown,
  Format extends ResponseFormat = ResponseFormat,
> = Response & {
  readonly __orvaTypedResponse__?: {
    readonly status: Status;
    readonly body: Body;
    readonly format: Format;
  };
};

export interface EnhancedRequest extends Request {
  _jsonCache?: unknown;
  _textCache?: string;
  _formDataCache?: FormData;
  __orvaEnhancedRequest__?: true;
  __orvaMethod__?: string;
  __orvaPathname__?: string;
  __orvaSearch__?: string;
}

export type RequestLike = Pick<Request, 'method' | 'url' | 'headers'> & Partial<EnhancedRequest>;
export type ValidatedData = Record<string, unknown>;
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

export type UnionToIntersection<U> = (
  U extends unknown ? (arg: U) => void : never
) extends ((arg: infer I) => void) ? I : never;

export type PrettifyIntersection<T> = Simplify<UnionToIntersection<T>>;

export interface RouteDefinition<
  Path extends string = string,
  Method extends string = string,
  Input extends object = {},
  Output = unknown,
  Operation = unknown,
  Responses extends Record<number, unknown> = {}
> {
  path: Path;
  method: Method;
  input: Input;
  output: Output;
  operation?: Operation;
  responses?: Responses;
}

export type RouteRegistry = Record<string, RouteDefinition>;

export interface MiddlewareTypeCarrier<
  AddedVars extends object = {},
  AddedValidated extends ValidatedData = {},
  AddedRPCInput extends object = {},
  AddedOperation = never,
> {
  readonly __nanoAddedVars__?: AddedVars;
  readonly __nanoAddedValidated__?: AddedValidated;
  readonly __orvaRpcInput__?: AddedRPCInput;
  readonly __orvaOperation__?: AddedOperation;
}

export interface Context<
  T extends object = Record<string, unknown>,
  V extends ValidatedData = {}
> {
  req: EnhancedRequest;
  url: URL;
  params: Record<string, string>;
  query: Record<string, string>;
  var: T;
  set<K extends keyof T>(key: K, value: T[K]): void;
  get<K extends keyof T>(key: K): T[K] | undefined;
  setValid<K extends string>(target: K, value: unknown): void;
  valid<K extends keyof V>(target: K): V[K];
  hasValid: (target: string) => boolean;
  after: (finalizer: ResponseFinalizer<T, V>) => void;
  cookie: (name: string) => string | undefined;
  cookies: () => Record<string, string>;
  setCookie: (name: string, value: string, options?: CookieOptions) => void;
  deleteCookie: (name: string, options?: DeleteCookieOptions) => void;

  text: <const Status extends StatusCode = 200>(data: string, status?: Status, headers?: HeadersInit) => TypedResponse<Status, string, 'text'>;
  json: <Body, const Status extends StatusCode = 200>(data: Body, status?: Status, headers?: HeadersInit) => TypedResponse<Status, Body, 'json'>;
  html: <const Status extends StatusCode = 200>(data: string, status?: Status, headers?: HeadersInit) => TypedResponse<Status, string, 'html'>;
  redirect: <const Status extends 301 | 302 | 303 | 307 | 308 = 302>(url: string | URL, status?: Status) => TypedResponse<Status, null, 'empty'>;
  stream: <Body extends BodyStream, const Status extends StatusCode = 200>(stream: Body, status?: Status, headers?: HeadersInit) => TypedResponse<Status, Body, 'stream'>;
  sse: <Body extends BodyStream, const Status extends StatusCode = 200>(stream: Body, status?: Status) => TypedResponse<Status, Body, 'stream'>;
  download: <Body extends BodyStream, const Status extends StatusCode = 200>(stream: Body, filename?: string, status?: Status) => TypedResponse<Status, Body, 'stream'>;
  notFound: () => TypedResponse<404, string, 'text'>;
}

export type BodyStream = ReadableStream | AsyncIterable<unknown> | Iterable<unknown>;
export type Next = () => Promise<void>;

export type MiddlewareHandler<
  T extends object = Record<string, unknown>,
  V extends ValidatedData = {}
> = (
  c: Context<T, V>,
  next: Next
) => Promise<void | Response> | void | Response;

export type TypedMiddlewareHandler<
  T extends object = Record<string, unknown>,
  V extends ValidatedData = {},
  AddedVars extends object = {},
  AddedValidated extends ValidatedData = {},
  AddedRPCInput extends object = {},
  AddedOperation = never,
> = MiddlewareHandler<Simplify<T & AddedVars>, Simplify<V & AddedValidated>> & MiddlewareTypeCarrier<AddedVars, AddedValidated, AddedRPCInput, AddedOperation>;

export type Handler<
  T extends object = Record<string, unknown>,
  V extends ValidatedData = {}
> = (
  c: Context<T, V>
) => Response | TypedResponse<any, any, any> | Promise<Response | TypedResponse<any, any, any>>;

export type ResponseFinalizer<
  T extends object = Record<string, unknown>,
  V extends ValidatedData = {}
> = (
  response: Response,
  c: Context<T, V>
) => Response | Promise<Response>;

export type ErrorHandler<
  T extends object = Record<string, unknown>,
  V extends ValidatedData = {}
> = (
  err: Error,
  c: Context<T, V>
) => Response | Promise<Response>;

export type NotFoundHandler<
  T extends object = Record<string, unknown>,
  V extends ValidatedData = {}
> = (
  c: Context<T, V>
) => Response | Promise<Response>;

export type AnyMiddlewareHandler<T extends object = Record<string, unknown>> =
  MiddlewareHandler<T, any> & MiddlewareTypeCarrier<any, any, any, any>;

export type RouteHandlerResult = Response | TypedResponse<any, any, any> | Promise<Response | TypedResponse<any, any, any>>;

export function defineMiddleware<
  AddedVars extends object = {},
  AddedValidated extends ValidatedData = {},
  AddedRPCInput extends object = {},
  AddedOperation = never,
>(
  handler: MiddlewareHandler<any, any>
): TypedMiddlewareHandler<any, any, AddedVars, AddedValidated, AddedRPCInput, AddedOperation> {
  return handler as TypedMiddlewareHandler<any, any, AddedVars, AddedValidated, AddedRPCInput, AddedOperation>;
}

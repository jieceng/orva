// ============ Type define ============
import {
  OPENAPI_METADATA,
  OPENAPI_MIDDLEWARE_METADATA,
  VALIDATOR_METADATA,
  type OpenAPIMiddlewareMetadata,
  type OpenAPIOperationMetadata,
  type OperationOutput,
  type RouteRuntimeDefinition,
  type ValidatorContractMetadata,
} from './metadata.js';
import {
  getCookieFromHeader,
  parseCookieHeader,
  serializeCookie,
  serializeDeleteCookie,
  type CookieOptions,
  type DeleteCookieOptions,
} from './cookies.js';

// 扩展 HTTPMethod 以支持现代 Web 标准和自定义方法
export type HTTPMethod =
  | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' 
  | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE'
  | (string & {}); // 允许扩展自定义方法

export type StatusCode = number;

export interface EnhancedRequest extends Request {
  _jsonCache?: unknown;
  _textCache?: string;
  _formDataCache?: FormData;
  __orvaEnhancedRequest__?: true;
  __orvaMethod__?: string;
  __orvaPathname__?: string;
  __orvaSearch__?: string;
}

type RequestLike = Pick<Request, 'method' | 'url' | 'headers'> & Partial<EnhancedRequest>;
const MISSING_VALUE = Symbol('orva.missing');
const QUERY_PROXY_STATE = Symbol('orva.queryProxyState');
const PARAMS_PROXY_STATE = Symbol('orva.paramsProxyState');

export class FastResponse {
  readonly __orvaFastResponse__ = true;
  private headersValue: Headers | null = null;

  constructor(
    public readonly kind: 'text' | 'json' | 'empty',
    public readonly status: StatusCode,
    public readonly body: string | unknown | null,
    private headersInit?: HeadersInit,
  ) {}

  get headers(): Headers {
    return this.headersValue ??= new Headers(this.headersInit);
  }

  set headers(value: Headers) {
    this.headersValue = value;
    this.headersInit = value;
  }

  getHeadersInit(): HeadersInit | undefined {
    return this.headersValue ?? this.headersInit;
  }
}

type InternalResponse = Response | FastResponse;

export type ValidatedData = Record<string, unknown>;

type Simplify<T> = { [K in keyof T]: T[K] } & {};
type UnionToIntersection<U> = (
  U extends unknown ? (arg: U) => void : never
) extends ((arg: infer I) => void) ? I : never;
type PrettifyIntersection<T> = Simplify<UnionToIntersection<T>>;

export interface RouteDefinition<
  Path extends string = string,
  Method extends string = string,
  Input extends object = {},
  Output = unknown,
  Operation = unknown
> {
  path: Path;
  method: Method;
  input: Input;
  output: Output;
  operation?: Operation;
}

export type RouteRegistry = Record<string, RouteDefinition>;

export interface MiddlewareTypeCarrier<
  AddedVars extends object = {},
  AddedValidated extends ValidatedData = {}
> {
  readonly __nanoAddedVars__?: AddedVars;
  readonly __nanoAddedValidated__?: AddedValidated;
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

  text: (data: string, status?: StatusCode, headers?: HeadersInit) => Response;
  json: (data: unknown, status?: StatusCode, headers?: HeadersInit) => Response;
  html: (data: string, status?: StatusCode, headers?: HeadersInit) => Response;
  redirect: (url: string | URL, status?: 301 | 302 | 303 | 307 | 308) => Response;
  stream: (stream: ReadableStream | AsyncIterable<unknown>, status?: StatusCode, headers?: HeadersInit) => Response;
  sse: (stream: ReadableStream | AsyncIterable<unknown>, status?: StatusCode) => Response;
  download: (stream: ReadableStream | AsyncIterable<unknown>, filename?: string, status?: StatusCode) => Response;
  notFound: () => Response;
}

export type Next = () => Promise<void>;

// 支持洋葱模型的中间件定义
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
  AddedValidated extends ValidatedData = {}
> = MiddlewareHandler<Simplify<T & AddedVars>, Simplify<V & AddedValidated>> & MiddlewareTypeCarrier<AddedVars, AddedValidated>;

export type Handler<
  T extends object = Record<string, unknown>,
  V extends ValidatedData = {}
> = (
  c: Context<T, V>
) => Response | Promise<Response>;

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
  MiddlewareHandler<T, any> & MiddlewareTypeCarrier<any, any>;

type ExtractMiddlewareAddedVars<M> = M extends MiddlewareTypeCarrier<infer AddedVars, any>
  ? AddedVars extends object ? AddedVars : {}
  : {};
type ExtractMiddlewareAddedValidated<M> = M extends MiddlewareTypeCarrier<any, infer AddedValidated>
  ? AddedValidated extends ValidatedData ? AddedValidated : {}
  : M extends MiddlewareHandler<any, infer V> ? V : {};
type MergeMiddlewareAddedVars<M extends readonly unknown[]> = Simplify<
  PrettifyIntersection<ExtractMiddlewareAddedVars<M[number]>>
>;
type MergeMiddlewareValidatedData<M extends readonly unknown[]> = Simplify<
  PrettifyIntersection<ExtractMiddlewareAddedValidated<M[number]>>
>;

export function defineMiddleware<
  AddedVars extends object = {},
  AddedValidated extends ValidatedData = {},
>(
  handler: MiddlewareHandler<any, any>
): TypedMiddlewareHandler<any, any, AddedVars, AddedValidated> {
  return handler as TypedMiddlewareHandler<any, any, AddedVars, AddedValidated>;
}

type ValidatorInputMapping<Target extends string, Input> =
  Target extends 'json' ? { body: Input } :
  Target extends 'form' ? { body: Input } :
  Target extends 'text' ? { body: Input } :
  Target extends 'query' ? { query?: Input } :
  Target extends 'param' ? { param?: Input } :
  Target extends 'header' ? { headers?: Input } :
  Target extends 'cookie' ? { cookie?: Input } :
  {};

type MiddlewareRPCInput<M> = M extends { readonly [VALIDATOR_METADATA]?: ValidatorContractMetadata<infer Target, infer Input, any> }
  ? ValidatorInputMapping<Target, Input>
  : {};

type MergeRPCInput<M extends readonly unknown[]> = Simplify<
  PrettifyIntersection<MiddlewareRPCInput<M[number]>>
>;

type ExtractOperationMetadata<M> = M extends { readonly [OPENAPI_METADATA]?: infer Operation }
  ? Operation
  : never;

type MergeOperationMetadata<M extends readonly unknown[]> =
  [ExtractOperationMetadata<M[number]>] extends [never]
    ? undefined
    : ExtractOperationMetadata<M[number]>;

type InferRouteOutputFromOperation<Operation> =
  [Operation] extends [undefined]
    ? unknown
    : OperationOutput<Operation>;

type ExtractPathParamNames<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractPathParamNames<`/${Rest}`>
    : Path extends `${string}:${infer Param}`
      ? Param
      : never;

type ParamsFromRoutePath<Path extends string> = {
  [K in ExtractPathParamNames<Path>]: string;
};

type PathParamInput<Path extends string> =
  [ExtractPathParamNames<Path>] extends [never]
    ? {}
    : { param: ParamsFromRoutePath<Path> };

type RouteKey<Method extends string, Path extends string> = `${Uppercase<Method>} ${Path}`;
type NormalizePrefix<Prefix extends string> = Prefix extends '' | '/' ? '' : Prefix extends `/${string}` ? Prefix : `/${Prefix}`;
type JoinPaths<Prefix extends string, Path extends string> =
  NormalizePrefix<Prefix> extends infer P extends string
    ? Path extends '' | '/'
      ? (P extends '' ? '/' : P)
      : P extends ''
        ? Path
        : `${P}${Path extends `/${string}` ? Path : `/${Path}`}`
    : Path;
type PrefixRouteDefinition<
  Prefix extends string,
  Definition
> = Definition extends RouteDefinition<infer Path extends string, infer Method extends string, infer Input extends object, infer Output, infer Operation>
  ? RouteDefinition<JoinPaths<Prefix, Path>, Method, Input, Output, Operation>
  : never;
type PrefixRouteRegistry<Prefix extends string, Routes extends object> = Simplify<{
  [K in keyof Routes as Routes[K] extends RouteDefinition<infer Path extends string, infer Method extends string, any, any, any>
    ? RouteKey<Method, JoinPaths<Prefix, Path>>
    : never]: PrefixRouteDefinition<Prefix, Routes[K]>;
}>;
type RoutesOfOrvaInstance<App> = App extends Orva<any, any, infer Routes, any> ? Routes : {};
type RouteInputWithPath<Path extends string, Input extends object> = Simplify<Input & PathParamInput<Path>>;

// ============ Radix Tree ============

export interface RouteMatch<T extends object> {
  handler: Handler<T, any>;
  params: Record<string, string>;
}

export interface InternalContext<T extends object = Record<string, unknown>> extends Context<T, any> {
  _finalizers: ResponseFinalizer<T, any>[] | null;
  _validated: Record<string, unknown> | null;
}

interface RequestBodyCache {
  json?: unknown;
  text?: string;
  formData?: FormData;
}

interface RequestWrapperInternal {
  _request: Request;
  _cache: RequestBodyCache;
}

type RequestWrapper = EnhancedRequest & RequestWrapperInternal;

interface ExactRouteHandlers<T extends object = Record<string, unknown>> {
  GET?: Handler<T, any>;
  POST?: Handler<T, any>;
  PUT?: Handler<T, any>;
  DELETE?: Handler<T, any>;
  PATCH?: Handler<T, any>;
  HEAD?: Handler<T, any>;
  OPTIONS?: Handler<T, any>;
  [method: string]: Handler<T, any> | undefined;
}

interface InternalRouteMatch<T extends object = Record<string, unknown>> {
  handler: Handler<T, any>;
  params: Record<string, string> | null;
}

interface PipelineState<T extends object = Record<string, unknown>> {
  middlewares: AnyMiddlewareHandler<T>[];
  finalHandler: Handler<T, any>;
  response: InternalResponse | null;
  stack: number[];
  nextCalled: boolean[];
  depth: number;
  next: Next;
}

interface LazyQueryProxyState {
  source: string;
  resolved: Record<string, string>;
  misses: Record<string, true>;
  fullyParsed: boolean;
}

interface LazyParamsProxyState {
  raw: Record<string, string>;
  resolved: Record<string, string>;
}

type LazyQueryProxyTarget = Record<string, string> & {
  [QUERY_PROXY_STATE]: LazyQueryProxyState;
};

type LazyParamsProxyTarget = Record<string, string> & {
  [PARAMS_PROXY_STATE]: LazyParamsProxyState;
};

interface ContextState<T extends object = Record<string, unknown>> {
  requestFacade?: EnhancedRequest;
  url?: URL;
  rawParams?: Record<string, string> | null;
  params?: Record<string, string> | null;
  query?: Record<string, string>;
  cookies?: Record<string, string>;
  vars?: T;
  finalizers?: ResponseFinalizer<T, any>[] | null;
  validated?: Record<string, unknown> | null;
  responseCookies?: string[] | null;
  pipeline?: PipelineState<T>;
}

const REQUEST_BODY_CACHE = new WeakMap<Request, RequestBodyCache>();
const REQUEST_WRAPPER_CACHE = new WeakMap<Request, EnhancedRequest>();
const EMPTY_PARAMS = Object.create(null) as Record<string, string>;

function getRequestBodyCache(request: Request): RequestBodyCache {
  let cache = REQUEST_BODY_CACHE.get(request);
  if (!cache) {
    cache = {};
    REQUEST_BODY_CACHE.set(request, cache);
  }
  return cache;
}

async function cachedRequestJson(this: RequestWrapper): Promise<unknown> {
  if ('json' in this._cache) return this._cache.json;
  const text = typeof this._cache.text === 'string'
    ? this._cache.text
    : await this._request.text();
  this._cache.text = text;
  const value = JSON.parse(text);
  this._cache.json = value;
  return value;
}

async function cachedRequestText(this: RequestWrapper): Promise<string> {
  if (typeof this._cache.text === 'string') return this._cache.text;
  if ('json' in this._cache) {
    const value = JSON.stringify(this._cache.json);
    this._cache.text = value;
    return value;
  }
  const value = await this._request.text();
  this._cache.text = value;
  return value;
}

async function cachedRequestFormData(this: RequestWrapper): Promise<FormData> {
  if (this._cache.formData) return this._cache.formData;
  const value = await this._request.formData();
  this._cache.formData = value;
  return value;
}

class OrvaRequestFacade implements RequestWrapper {
  readonly _request: Request;
  readonly _cache: RequestBodyCache;

  constructor(request: Request, cache: RequestBodyCache) {
    this._request = request;
    this._cache = cache;
  }

  get method(): Request['method'] { return this._request.method; }
  get url(): Request['url'] { return this._request.url; }
  get headers(): Request['headers'] { return this._request.headers; }
  get body(): Request['body'] { return this._request.body; }
  get bodyUsed(): Request['bodyUsed'] { return this._request.bodyUsed; }
  get cache(): Request['cache'] { return this._request.cache; }
  get credentials(): Request['credentials'] { return this._request.credentials; }
  get destination(): Request['destination'] { return this._request.destination; }
  get integrity(): Request['integrity'] { return this._request.integrity; }
  get keepalive(): Request['keepalive'] { return this._request.keepalive; }
  get mode(): Request['mode'] { return this._request.mode; }
  get redirect(): Request['redirect'] { return this._request.redirect; }
  get referrer(): Request['referrer'] { return this._request.referrer; }
  get referrerPolicy(): Request['referrerPolicy'] { return this._request.referrerPolicy; }
  get signal(): Request['signal'] { return this._request.signal; }
  get duplex(): unknown { return (this._request as Request & { duplex?: unknown }).duplex; }
  get [Symbol.toStringTag](): string { return 'Request'; }

  clone(): ReturnType<Request['clone']> {
    return this._request.clone();
  }

  arrayBuffer(): ReturnType<Request['arrayBuffer']> {
    return this._request.arrayBuffer();
  }

  blob(): ReturnType<Request['blob']> {
    return this._request.blob();
  }

  bytes(): ReturnType<NonNullable<Request['bytes']>> {
    return (
      (this._request as Request & { bytes?: () => Promise<Uint8Array<ArrayBuffer>> }).bytes?.()
      ?? this._request.arrayBuffer().then((buffer) => new Uint8Array(buffer))
    ) as ReturnType<NonNullable<Request['bytes']>>;
  }

  json(): Promise<unknown> {
    return cachedRequestJson.call(this as unknown as RequestWrapper);
  }

  text(): Promise<string> {
    return cachedRequestText.call(this as unknown as RequestWrapper);
  }

  formData(): Promise<FormData> {
    return cachedRequestFormData.call(this as unknown as RequestWrapper);
  }
}

function createRequestFacade(request: RequestLike): EnhancedRequest {
  if ((request as EnhancedRequest).__orvaEnhancedRequest__) {
    return request as EnhancedRequest;
  }
  if (!(request instanceof Request)) {
    return request as EnhancedRequest;
  }

  const cached = REQUEST_WRAPPER_CACHE.get(request);
  if (cached) return cached;

  const wrapper = new OrvaRequestFacade(request, getRequestBodyCache(request)) as unknown as EnhancedRequest;
  wrapper.__orvaEnhancedRequest__ = true;

  REQUEST_WRAPPER_CACHE.set(request, wrapper);
  return wrapper;
}

function normalizeExtractedPathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) || '/' : pathname;
}

function extractPathAndSearch(url: string): { pathname: string; search: string } {
  const schemeIndex = url.indexOf('://');
  const authorityStart = schemeIndex >= 0 ? schemeIndex + 3 : 0;
  const pathStart = url.indexOf('/', authorityStart);
  if (pathStart < 0) {
    return { pathname: '/', search: '' };
  }

  const queryStart = url.indexOf('?', pathStart);
  const hashStart = url.indexOf('#', pathStart);
  const pathnameEnd = queryStart >= 0
    ? queryStart
    : hashStart >= 0
      ? hashStart
      : url.length;

  return {
    pathname: url.slice(pathStart, pathnameEnd) || '/',
    search: queryStart >= 0
      ? url.slice(queryStart, hashStart >= 0 ? hashStart : url.length)
      : '',
  };
}

function decodeComponentSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseAllLazyQuery(target: LazyQueryProxyTarget): void {
  const state = target[QUERY_PROXY_STATE];
  if (state.fullyParsed) return;

  state.fullyParsed = true;
  const { source, resolved } = state;
  let start = 0;
  while (start <= source.length) {
    let end = source.indexOf('&', start);
    if (end < 0) end = source.length;
    if (end !== start) {
      const separatorIndex = source.indexOf('=', start);
      const keyEnd = separatorIndex >= 0 && separatorIndex < end ? separatorIndex : end;
      const valueStart = keyEnd < end ? keyEnd + 1 : end;
      const key = decodeComponentSafe(source.slice(start, keyEnd).replaceAll('+', ' '));
      const value = decodeComponentSafe(source.slice(valueStart, end).replaceAll('+', ' '));
      resolved[key] = value;
    }
    start = end + 1;
  }
}

function resolveLazyQueryValue(target: LazyQueryProxyTarget, name: string): string | undefined {
  const state = target[QUERY_PROXY_STATE];
  const { resolved, misses, source } = state;
  if (name in resolved) return resolved[name];
  if (name in misses) return undefined;

  let found = MISSING_VALUE as string | typeof MISSING_VALUE;
  let start = 0;
  while (start <= source.length) {
    let end = source.indexOf('&', start);
    if (end < 0) end = source.length;
    if (end !== start) {
      const separatorIndex = source.indexOf('=', start);
      const keyEnd = separatorIndex >= 0 && separatorIndex < end ? separatorIndex : end;
      const valueStart = keyEnd < end ? keyEnd + 1 : end;
      const key = decodeComponentSafe(source.slice(start, keyEnd).replaceAll('+', ' '));
      if (key === name) {
        found = decodeComponentSafe(source.slice(valueStart, end).replaceAll('+', ' '));
      }
    }
    start = end + 1;
  }

  if (found === MISSING_VALUE) {
    misses[name] = true;
    return undefined;
  }

  resolved[name] = found;
  return found;
}

const LAZY_QUERY_PROXY_HANDLER: ProxyHandler<LazyQueryProxyTarget> = {
  get(target, prop) {
    if (typeof prop !== 'string') return undefined;
    return resolveLazyQueryValue(target, prop);
  },
  has(target, prop) {
    if (typeof prop !== 'string') return false;
    return resolveLazyQueryValue(target, prop) !== undefined;
  },
  ownKeys(target) {
    parseAllLazyQuery(target);
    return Reflect.ownKeys(target[QUERY_PROXY_STATE].resolved);
  },
  getOwnPropertyDescriptor(target, prop) {
    if (typeof prop !== 'string') return undefined;
    const value = resolveLazyQueryValue(target, prop);
    if (value === undefined) return undefined;
    return {
      enumerable: true,
      configurable: true,
      value,
      writable: true,
    };
  },
  set(target, prop, value) {
    if (typeof prop === 'string') {
      const state = target[QUERY_PROXY_STATE];
      state.resolved[prop] = String(value);
      delete state.misses[prop];
    }
    return true;
  },
};

function createLazyQueryRecord(search: string): Record<string, string> {
  const source = search.charCodeAt(0) === 63 ? search.slice(1) : search;
  if (!source) return EMPTY_PARAMS;

  const target = Object.create(null) as LazyQueryProxyTarget;
  target[QUERY_PROXY_STATE] = {
    source,
    resolved: Object.create(null),
    misses: Object.create(null),
    fullyParsed: false,
  };
  return new Proxy(target, LAZY_QUERY_PROXY_HANDLER) as Record<string, string>;
}

function resolveLazyParamValue(target: LazyParamsProxyTarget, name: string): string | undefined {
  const state = target[PARAMS_PROXY_STATE];
  const { raw, resolved } = state;
  if (name in resolved) return resolved[name];
  const value = raw[name];
  if (value === undefined) return undefined;
  const decoded = decodeComponentSafe(value);
  resolved[name] = decoded;
  return decoded;
}

const LAZY_PARAMS_PROXY_HANDLER: ProxyHandler<LazyParamsProxyTarget> = {
  get(target, prop) {
    if (typeof prop !== 'string') return undefined;
    return resolveLazyParamValue(target, prop);
  },
  has(target, prop) {
    return typeof prop === 'string' && prop in target[PARAMS_PROXY_STATE].raw;
  },
  ownKeys(target) {
    const state = target[PARAMS_PROXY_STATE];
    for (const key of Object.keys(state.raw)) {
      if (!(key in state.resolved)) {
        state.resolved[key] = decodeComponentSafe(state.raw[key]);
      }
    }
    return Reflect.ownKeys(state.resolved);
  },
  getOwnPropertyDescriptor(target, prop) {
    if (typeof prop !== 'string') return undefined;
    const value = resolveLazyParamValue(target, prop);
    if (value === undefined) return undefined;
    return {
      enumerable: true,
      configurable: true,
      value,
      writable: true,
    };
  },
  set(target, prop, value) {
    if (typeof prop === 'string') {
      const state = target[PARAMS_PROXY_STATE];
      const stringValue = String(value);
      state.raw[prop] = stringValue;
      state.resolved[prop] = stringValue;
    }
    return true;
  },
};

function createLazyParamsRecord(raw: Record<string, string>): Record<string, string> {
  const target = Object.create(null) as LazyParamsProxyTarget;
  target[PARAMS_PROXY_STATE] = {
    raw,
    resolved: Object.create(null),
  };
  return new Proxy(target, LAZY_PARAMS_PROXY_HANDLER) as Record<string, string>;
}

function createHeaders(
  defaultHeaders: HeadersInit,
  customHeaders?: HeadersInit
): HeadersInit {
  if (!customHeaders) return defaultHeaders;

  const headers = new Headers(defaultHeaders);
  if (customHeaders instanceof Headers) {
    customHeaders.forEach((value, key) => headers.set(key, value));
    return headers;
  }

  if (Array.isArray(customHeaders)) {
    for (const [key, value] of customHeaders) {
      headers.set(key, value);
    }
    return headers;
  }

  for (const [key, value] of Object.entries(customHeaders)) {
    if (Array.isArray(value)) {
      headers.set(key, value.join(', '));
    } else if (value !== undefined) {
      headers.set(key, String(value));
    }
  }

  return headers;
}

function createFastHeaders(
  defaultHeaders: HeadersInit,
  customHeaders?: HeadersInit
) : HeadersInit {
  if (!customHeaders) return defaultHeaders;

  const headers = new Headers(defaultHeaders);

  if (customHeaders instanceof Headers) {
    customHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
    return headers;
  }

  if (Array.isArray(customHeaders)) {
    for (const [key, value] of customHeaders) {
      headers.set(key, value);
    }
    return headers;
  }

  for (const [key, value] of Object.entries(customHeaders)) {
    if (Array.isArray(value)) {
      headers.set(key, value.join(', '));
    } else if (value !== undefined) {
      headers.set(key, String(value));
    }
  }

  return headers;
}

function appendFastHeader(response: FastResponse, key: string, value: string): void {
  const headers = response.headers;
  if (key.toLowerCase() === 'set-cookie') {
    headers.append(key, value);
    return;
  }
  headers.set(key, value);
}

function isFastResponse(value: unknown): value is FastResponse {
  return value instanceof FastResponse
    || (!!value && typeof value === 'object' && '__orvaFastResponse__' in value);
}

function toStandardResponse(response: InternalResponse): Response {
  if (!isFastResponse(response)) return response;

  const headers = response.getHeadersInit();
  switch (response.kind) {
    case 'json':
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers,
      });
    case 'text':
      return new Response(response.body as string, {
        status: response.status,
        headers,
      });
    case 'empty':
    default:
      return new Response(null, {
        status: response.status,
        headers,
      });
  }
}

class OrvaContext<T extends object = Record<string, unknown>, V extends ValidatedData = {}> implements InternalContext<T> {
  private readonly request: RequestLike;
  private readonly requestMethod: string;
  private readonly pathnameValue: string;
  private readonly searchValue: string;
  private state: ContextState<T> | null = null;

  constructor(
    request: RequestLike,
    requestMethod?: string,
    pathname?: string,
    search?: string,
  ) {
    this.request = request;
    this.requestMethod = requestMethod ?? request.method.toUpperCase();

    if (pathname !== undefined && search !== undefined) {
      this.pathnameValue = pathname;
      this.searchValue = search;
    } else {
      const extracted = extractPathAndSearch(request.url);
      this.pathnameValue = normalizeExtractedPathname(extracted.pathname);
      this.searchValue = extracted.search;
    }

  }

  private getState(): ContextState<T> {
    return this.state ??= {};
  }

  get _finalizers(): ResponseFinalizer<T, any>[] | null {
    return this.state?.finalizers ?? null;
  }

  set _finalizers(value: ResponseFinalizer<T, any>[] | null) {
    if (value === null) {
      if (this.state) this.state.finalizers = null;
      return;
    }
    this.getState().finalizers = value;
  }

  get _validated(): Record<string, unknown> | null {
    return this.state?.validated ?? null;
  }

  set _validated(value: Record<string, unknown> | null) {
    if (value === null) {
      if (this.state) this.state.validated = null;
      return;
    }
    this.getState().validated = value;
  }

  get req(): EnhancedRequest {
    const state = this.state;
    if (state?.requestFacade) return state.requestFacade;
    return (state ?? this.getState()).requestFacade = createRequestFacade(this.request);
  }

  get url(): URL {
    const state = this.state;
    if (state?.url) return state.url;
    return (state ?? this.getState()).url = new URL(this.request.url);
  }

  get query(): Record<string, string> {
    const state = this.state;
    if (state?.query) return state.query;
    return (state ?? this.getState()).query = createLazyQueryRecord(this.searchValue);
  }

  get params(): Record<string, string> {
    const state = this.state;
    const rawParams = state?.rawParams;
    if (!rawParams) return EMPTY_PARAMS;
    if (state?.params) return state.params;
    return (state ?? this.getState()).params = createLazyParamsRecord(rawParams);
  }

  set params(value: Record<string, string>) {
    const state = this.state;
    if (value === EMPTY_PARAMS) {
      if (state) {
        state.rawParams = null;
        state.params = null;
      }
      return;
    }
    const nextState = state ?? this.getState();
    nextState.rawParams = value;
    nextState.params = null;
  }

  get pathname(): string {
    return this.pathnameValue;
  }

  get method(): string {
    return this.requestMethod;
  }

  get var(): T {
    const state = this.state;
    if (state?.vars) return state.vars;
    return (state ?? this.getState()).vars = {} as T;
  }

  set var(value: T) {
    this.getState().vars = value;
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    const state = this.state ?? this.getState();
    const vars = state.vars ??= {} as T;
    vars[key] = value;
  }

  get<K extends keyof T>(key: K): T[K] | undefined {
    return this.state?.vars?.[key];
  }

  setValid<K extends string>(target: K, value: unknown): void {
    (this._validated ??= Object.create(null))[target] = value;
  }

  valid(target: keyof any): any {
    if (!this._validated || !(target in this._validated)) {
      throw new Error(`No validated data found for target '${String(target)}'`);
    }
    return this._validated[target as string];
  }

  hasValid(target: string): boolean {
    return !!this._validated && target in this._validated;
  }

  after(finalizer: ResponseFinalizer<T, V>): void {
    const state = this.state ?? this.getState();
    (state.finalizers ??= []).push(finalizer as ResponseFinalizer<T, any>);
  }

  cookie(name: string): string | undefined {
    const cookieHeader = this.request.headers.get('cookie');
    return this.state?.cookies
      ? this.state.cookies[name]
      : getCookieFromHeader(cookieHeader, name);
  }

  cookies(): Record<string, string> {
    const state = this.state ?? this.getState();
    return { ...(state.cookies ??= parseCookieHeader(this.request.headers.get('cookie'))) };
  }

  setCookie(name: string, value: string, options: CookieOptions = {}): void {
    const state = this.state ?? this.getState();
    (state.responseCookies ??= []).push(serializeCookie(name, value, options));
  }

  deleteCookie(name: string, options: DeleteCookieOptions = {}): void {
    const state = this.state ?? this.getState();
    (state.responseCookies ??= []).push(serializeDeleteCookie(name, options));
  }

  getResponseCookies(): readonly string[] | null {
    return this.state?.responseCookies ?? null;
  }

  text(data: string, status = 200, headers?: HeadersInit): Response {
    return new FastResponse('text', status, data, headers ? createFastHeaders(DEFAULT_TEXT_HEADERS, headers) : DEFAULT_TEXT_HEADERS) as unknown as Response;
  }

  json(data: unknown, status = 200, headers?: HeadersInit): Response {
    return new FastResponse('json', status, data, headers ? createFastHeaders(DEFAULT_JSON_HEADERS, headers) : DEFAULT_JSON_HEADERS) as unknown as Response;
  }

  html(data: string, status = 200, headers?: HeadersInit): Response {
    return new FastResponse('text', status, data, headers ? createFastHeaders(DEFAULT_HTML_HEADERS, headers) : DEFAULT_HTML_HEADERS) as unknown as Response;
  }

  redirect(url: string | URL, status: 301 | 302 | 303 | 307 | 308 = 302): Response {
    return new FastResponse('empty', status, null, { Location: url.toString() }) as unknown as Response;
  }

  stream(stream: ReadableStream | AsyncIterable<unknown>, status = 200, headers?: HeadersInit): Response {
    const readable = stream instanceof ReadableStream ? stream : new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            controller.enqueue(typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk as Uint8Array);
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      }
    });
    return new Response(readable, {
      status,
      headers: createHeaders(DEFAULT_DOWNLOAD_HEADERS, headers),
    });
  }

  sse(stream: ReadableStream | AsyncIterable<unknown>, status = 200): Response {
    return this.stream(stream, status, DEFAULT_SSE_HEADERS);
  }

  download(stream: ReadableStream | AsyncIterable<unknown>, filename?: string, status = 200): Response {
    return this.stream(stream, status, {
      ...DEFAULT_DOWNLOAD_HEADERS,
      ...(filename ? { 'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"` } : {}),
    });
  }

  notFound(): Response {
    return new FastResponse('text', 404, 'Not Found', DEFAULT_TEXT_HEADERS) as unknown as Response;
  }

  async runPipeline(
    middlewares: AnyMiddlewareHandler<T>[],
    finalHandler: Handler<T, any>,
  ): Promise<InternalResponse> {
    const contextState = this.state ?? this.getState();
    const state = contextState.pipeline ??= {
      middlewares,
      finalHandler,
      response: null,
      stack: new Array<number>(middlewares.length),
      nextCalled: new Array<boolean>(middlewares.length),
      depth: -1,
      next: this.invokePipelineNext.bind(this),
    };
    state.middlewares = middlewares;
    state.finalHandler = finalHandler;
    state.response = null;
    state.depth = -1;
    if (state.stack.length < middlewares.length) {
      state.stack = new Array<number>(middlewares.length);
      state.nextCalled = new Array<boolean>(middlewares.length);
    }
    await this.runPipelineAt(0);
    return state.response ?? await finalHandler(this);
  }

  private async runPipelineAt(index: number): Promise<void> {
    const state = this.state?.pipeline;
    if (!state) {
      throw new Error('Middleware pipeline is not configured');
    }
    if (state.response && index >= state.middlewares.length) {
      return;
    }

    if (index === state.middlewares.length) {
      state.response = await state.finalHandler(this);
      return;
    }

    const depth = ++state.depth;
    state.stack[depth] = index;
    state.nextCalled[index] = false;

    try {
      const result = await state.middlewares[index](this, state.next);
      if (result instanceof Response || isFastResponse(result)) {
        state.response = result as InternalResponse;
      }
    } finally {
      state.depth = depth - 1;
    }
  }

  private async invokePipelineNext(): Promise<void> {
    const state = this.state?.pipeline;
    if (!state || state.depth < 0) {
      throw new Error('next() called outside middleware pipeline');
    }

    const currentIndex = state.stack[state.depth];
    if (state.nextCalled[currentIndex]) {
      throw new Error('next() called multiple times');
    }
    state.nextCalled[currentIndex] = true;
    await this.runPipelineAt(currentIndex + 1);
  }
}

export class RadixNode<T extends object = Record<string, unknown>> {
  children: Record<string, RadixNode<T>> = Object.create(null);
  paramChild: RadixNode<T> | null = null;
  paramName: string | null = null;
  wildcardChild: RadixNode<T> | null = null;
  isWildcard: boolean = false;
  handlers: ExactRouteHandlers<T> = Object.create(null);
}
export const DEFAULT_JSON_HEADERS: HeadersInit = { 'Content-Type': 'application/json; charset=utf-8' };
export const DEFAULT_HTML_HEADERS: HeadersInit = { 'Content-Type': 'text/html; charset=utf-8' };
export const DEFAULT_TEXT_HEADERS: HeadersInit = { 'Content-Type': 'text/plain; charset=utf-8' };
export const DEFAULT_SSE_HEADERS: HeadersInit = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive'
};
export const DEFAULT_DOWNLOAD_HEADERS: HeadersInit = { 'Content-Type': 'application/octet-stream' };
export type { CookieOptions, DeleteCookieOptions } from './cookies.js';

export class Orva<
  T extends object = Record<string, unknown>,
  V extends ValidatedData = {},
  R extends object = {},
  GM extends readonly unknown[] = []
> {
  private root: RadixNode<T> = new RadixNode();
  private exactRoutes = new Map<string, ExactRouteHandlers<T>>();
  private globalMiddlewares: AnyMiddlewareHandler<T>[] = [];
  private currentGroupMiddlewares: AnyMiddlewareHandler<T>[] = [];
  private inheritedGroupMiddlewares: AnyMiddlewareHandler<T>[] = [];
  private errorHandler: ErrorHandler<T, any> | null = null;
  private notFoundHandler: NotFoundHandler<T, any> | null = null;
  private basePath: string = '';
  private isInGroup: boolean = false;
  private pathSegmentsCache = new Map<string, string[]>();
  private readonly MAX_CACHE_SIZE = 1000;
  private compiledHandler: Handler<T, any> | null = null;
  private compiledExactRoutes: Map<string, ExactRouteHandlers<T>> | null = null;
  private routeDefinitions: Array<RouteRuntimeDefinition & { handler: Handler<T, any> }> = [];

  onError(handler: ErrorHandler<T, any>): this {
    this.errorHandler = handler;
    return this;
  }

  notFound(handler: NotFoundHandler<T, any>): this {
    this.notFoundHandler = handler;
    return this;
  }

  use<M extends AnyMiddlewareHandler<T>[]>(
    ...handlers: M
  ): Orva<Simplify<T & MergeMiddlewareAddedVars<M>>, Simplify<V & MergeMiddlewareValidatedData<M>>, R, [...GM, ...M]> {
    if (this.isInGroup) {
      this.currentGroupMiddlewares.push(...handlers);
    } else {
      this.globalMiddlewares.push(...handlers);
    }
    this.compiledHandler = null;
    this.compiledExactRoutes = null;
    return this as unknown as Orva<
      Simplify<T & MergeMiddlewareAddedVars<M>>,
      Simplify<V & MergeMiddlewareValidatedData<M>>,
      R,
      [...GM, ...M]
    >;
  }

  getRouteDefinitions(): readonly RouteRuntimeDefinition[] {
    return this.routeDefinitions.map(({ handler: _handler, ...definition }) => definition);
  }

  private normalizePath(path: string): string {
    if (!path || path === '/') return '';
    let p = path.startsWith('/') ? path : '/' + path;
    if (p.endsWith('/') && p.length > 1) p = p.slice(0, -1);
    return p;
  }

  private buildRoutePath(path: string): string {
    const normalizedPath = this.normalizePath(path);
    if (this.basePath === '') return normalizedPath;
    return normalizedPath === '' ? this.basePath : this.basePath + normalizedPath;
  }

  private getPathSegments(path: string): string[] {
    if (!path || path === '/') return [];
    let cached = this.pathSegmentsCache.get(path);
    if (cached) return cached;
    
    if (this.pathSegmentsCache.size >= this.MAX_CACHE_SIZE) {
      this.pathSegmentsCache.delete(this.pathSegmentsCache.keys().next().value!);
    }
    cached = path.split('/').filter(Boolean);
    this.pathSegmentsCache.set(path, cached);
    return cached;
  }

  group<Prefix extends string, Child extends Orva<any, any, any, any> | void>(
    prefix: Prefix,
    callback: (app: Orva<T, V, {}, GM>) => Child
  ): Orva<T, V, Simplify<R & PrefixRouteRegistry<Prefix, RoutesOfOrvaInstance<Exclude<Child, void>>>>, GM> {
    const groupApp = new Orva<T, V, {}, GM>();
    groupApp.basePath = this.basePath + this.normalizePath(prefix);
    groupApp.isInGroup = true;
    groupApp.inheritedGroupMiddlewares = [
      ...this.inheritedGroupMiddlewares,
      ...this.currentGroupMiddlewares
    ];
    callback(groupApp);

    this.mergeRoutesFromApp(groupApp);
    this.compiledHandler = null;
    this.compiledExactRoutes = null;
    return this as unknown as Orva<T, V, Simplify<R & PrefixRouteRegistry<Prefix, RoutesOfOrvaInstance<Exclude<Child, void>>>>, GM>;
  }

  route<Prefix extends string, Child extends Orva<any, any, any, any>>(
    prefix: Prefix,
    app: Child
  ): Orva<T, V, Simplify<R & PrefixRouteRegistry<Prefix, RoutesOfOrvaInstance<Child>>>, GM> {
    this.mergeRoutesFromApp(app, prefix);
    this.compiledHandler = null;
    this.compiledExactRoutes = null;
    return this as unknown as Orva<T, V, Simplify<R & PrefixRouteRegistry<Prefix, RoutesOfOrvaInstance<Child>>>, GM>;
  }

  private mergeRoutesFromApp(other: Orva<T, any, any, any>, prefix = ''): void {
    for (const definition of other.routeDefinitions) {
      const nextPath = prefix
        ? `${this.normalizePath(prefix)}${definition.path === '/' ? '' : definition.path}`
        : definition.path;
      this.insert(definition.method as HTTPMethod, nextPath || '/', definition.handler, true);
      this.routeDefinitions.push({
        ...definition,
        path: nextPath || '/',
      } as RouteRuntimeDefinition & { handler: Handler<T, any> });
    }
  }

  private insert(method: HTTPMethod, path: string, handler: Handler<T, any>, absolute = false): void {
    const fullPath = absolute ? this.normalizePath(path) : this.buildRoutePath(path);
    const segments = this.getPathSegments(fullPath);
    const methodName = method.toUpperCase();

    if (segments.every((segment) => segment !== '*' && !segment.startsWith(':'))) {
      const key = fullPath || '/';
      let exact = this.exactRoutes.get(key);
      if (!exact) {
        exact = Object.create(null) as ExactRouteHandlers<T>;
        this.exactRoutes.set(key, exact);
      }
      exact[methodName] = handler;
      return;
    }

    let node = this.root;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      
      if (node.isWildcard) {
        throw new Error(`Cannot add route '${fullPath}' after wildcard route`);
      }
      
      if (seg === '*') {
        if (i !== segments.length - 1) {
          throw new Error('Wildcard (*) must be the last segment in path');
        }
        if (!node.wildcardChild) {
          node.wildcardChild = new RadixNode();
          node.wildcardChild.isWildcard = true;
        }
        node = node.wildcardChild;
      } else if (seg.startsWith(':')) {
        const paramName = seg.slice(1);
        if (!node.paramChild) {
          node.paramChild = new RadixNode();
          node.paramName = paramName;
        }
        node = node.paramChild;
      } else {
        if (!node.children[seg]) node.children[seg] = new RadixNode();
        node = node.children[seg];
      }
    }
    node.handlers[methodName] = handler;
  }

  private collectValidatorMetadata(handlers: readonly unknown[]): ValidatorContractMetadata[] {
    const definitions: ValidatorContractMetadata[] = [];
    for (const handler of handlers) {
      const metadata = (handler as { [VALIDATOR_METADATA]?: ValidatorContractMetadata })[VALIDATOR_METADATA];
      if (metadata) {
        definitions.push(metadata);
      }
    }
    return definitions;
  }

  private collectOpenAPIMetadata(handlers: readonly unknown[]): OpenAPIOperationMetadata | undefined {
    for (const handler of handlers) {
      const metadata = (handler as { [OPENAPI_METADATA]?: OpenAPIOperationMetadata })[OPENAPI_METADATA];
      if (metadata) {
        return metadata;
      }
    }
    return undefined;
  }

  private collectOpenAPIMiddlewareMetadata(handlers: readonly unknown[]): OpenAPIMiddlewareMetadata[] {
    const definitions: OpenAPIMiddlewareMetadata[] = [];
    for (const handler of handlers) {
      const metadata = (handler as { [OPENAPI_MIDDLEWARE_METADATA]?: OpenAPIMiddlewareMetadata })[OPENAPI_MIDDLEWARE_METADATA];
      if (metadata) {
        definitions.push(metadata);
      }
    }
    return definitions;
  }

  private registerRouteDefinition(
    method: HTTPMethod,
    path: string,
    handler: Handler<T, any>,
    handlers: readonly unknown[]
  ): void {
    const fullPath = this.buildRoutePath(path) || '/';
    const methodName = method.toUpperCase();
    const nextDefinition: RouteRuntimeDefinition & { handler: Handler<T, any> } = {
      method: methodName,
      path: fullPath,
      handler,
      validators: this.collectValidatorMetadata([
        ...this.globalMiddlewares,
        ...this.inheritedGroupMiddlewares,
        ...this.currentGroupMiddlewares,
        ...handlers,
      ]),
      middlewareOpenAPI: this.collectOpenAPIMiddlewareMetadata([
        ...this.globalMiddlewares,
        ...this.inheritedGroupMiddlewares,
        ...this.currentGroupMiddlewares,
        ...handlers,
      ]),
      openapi: this.collectOpenAPIMetadata(handlers),
    };

    const existingIndex = this.routeDefinitions.findIndex((definition) => (
      definition.method === methodName && definition.path === fullPath
    ));

    if (existingIndex >= 0) {
      this.routeDefinitions[existingIndex] = nextDefinition;
    } else {
      this.routeDefinitions.push(nextDefinition);
    }
  }

  private addRoute(method: HTTPMethod, path: string, handlers: readonly unknown[]): this {
    const handler = this.createRouteHandler(handlers as [...AnyMiddlewareHandler<T>[], Handler<T, any>]);
    this.insert(method, path, handler);
    this.registerRouteDefinition(method, path, handler, handlers);
    this.compiledHandler = null;
    this.compiledExactRoutes = null;
    return this;
  }

  private compileExactRoutesWithGlobals(): Map<string, ExactRouteHandlers<T>> {
    const compiled = new Map<string, ExactRouteHandlers<T>>();
    for (const [path, handlers] of this.exactRoutes) {
      const nextHandlers = Object.create(null) as ExactRouteHandlers<T>;
      for (const [method, handler] of Object.entries(handlers)) {
        if (!handler) continue;
        nextHandlers[method] = this.composeHandlers([
          ...this.globalMiddlewares,
          handler,
        ] as [...AnyMiddlewareHandler<T>[], Handler<T, any>]);
      }
      compiled.set(path, nextHandlers);
    }
    return compiled;
  }

  private composeHandlers(handlers: [...AnyMiddlewareHandler<T>[], Handler<T, any>]): Handler<T, any> {
    if (handlers.length === 1) return handlers[0] as Handler<T, any>;

    const middlewares = handlers.slice(0, -1) as AnyMiddlewareHandler<T>[];
    const finalHandler = handlers[handlers.length - 1] as Handler<T, any>;

    return async (c: Context<T, any>): Promise<Response> => {
      return await (c as OrvaContext<T>).runPipeline(middlewares, finalHandler) as Response;
    };
  }

  private createRouteHandler<M extends AnyMiddlewareHandler<T>[]>(
    handlers: [...M, Handler<T, Simplify<V & MergeMiddlewareValidatedData<[...GM, ...M]>>>]
  ): Handler<T, any> {
    const routeMiddlewares = handlers.slice(0, -1) as AnyMiddlewareHandler<T>[];
    const finalHandler = handlers[handlers.length - 1] as Handler<T, any>;

    if (
      this.inheritedGroupMiddlewares.length === 0 &&
      this.currentGroupMiddlewares.length === 0 &&
      routeMiddlewares.length === 0
    ) {
      return finalHandler;
    }

    const allMiddlewares: AnyMiddlewareHandler<T>[] = [
      ...this.inheritedGroupMiddlewares,
      ...this.currentGroupMiddlewares,
      ...routeMiddlewares
    ];

    return this.composeHandlers([...allMiddlewares, finalHandler] as [...AnyMiddlewareHandler<T>[], Handler<T, any>]);
  }

  // HTTP 方法注册 - 保持简洁风格
  get<
    Path extends string,
    M extends AnyMiddlewareHandler<T>[],
    Operation = MergeOperationMetadata<M>
  >(
    path: Path,
    ...handlers: [...M, Handler<T, Simplify<V & MergeMiddlewareValidatedData<[...GM, ...M]>>>]
  ): Orva<T, V, Simplify<R & {
    [K in RouteKey<'GET', Path>]: RouteDefinition<Path, 'GET', RouteInputWithPath<Path, MergeRPCInput<[...GM, ...M]>>, InferRouteOutputFromOperation<Operation>, Operation>;
  }>, GM> {
    return this.addRoute('GET', path, handlers) as unknown as Orva<T, V, Simplify<R & {
      [K in RouteKey<'GET', Path>]: RouteDefinition<Path, 'GET', RouteInputWithPath<Path, MergeRPCInput<[...GM, ...M]>>, InferRouteOutputFromOperation<Operation>, Operation>;
    }>, GM>;
  }

  post<
    Path extends string,
    M extends AnyMiddlewareHandler<T>[],
    Operation = MergeOperationMetadata<M>
  >(
    path: Path,
    ...handlers: [...M, Handler<T, Simplify<V & MergeMiddlewareValidatedData<[...GM, ...M]>>>]
  ): Orva<T, V, Simplify<R & {
    [K in RouteKey<'POST', Path>]: RouteDefinition<Path, 'POST', RouteInputWithPath<Path, MergeRPCInput<[...GM, ...M]>>, InferRouteOutputFromOperation<Operation>, Operation>;
  }>, GM> {
    return this.addRoute('POST', path, handlers) as unknown as Orva<T, V, Simplify<R & {
      [K in RouteKey<'POST', Path>]: RouteDefinition<Path, 'POST', RouteInputWithPath<Path, MergeRPCInput<[...GM, ...M]>>, InferRouteOutputFromOperation<Operation>, Operation>;
    }>, GM>;
  }

  put<
    Path extends string,
    M extends AnyMiddlewareHandler<T>[],
    Operation = MergeOperationMetadata<M>
  >(
    path: Path,
    ...handlers: [...M, Handler<T, Simplify<V & MergeMiddlewareValidatedData<[...GM, ...M]>>>]
  ): Orva<T, V, Simplify<R & {
    [K in RouteKey<'PUT', Path>]: RouteDefinition<Path, 'PUT', RouteInputWithPath<Path, MergeRPCInput<[...GM, ...M]>>, InferRouteOutputFromOperation<Operation>, Operation>;
  }>, GM> {
    return this.addRoute('PUT', path, handlers) as unknown as Orva<T, V, Simplify<R & {
      [K in RouteKey<'PUT', Path>]: RouteDefinition<Path, 'PUT', RouteInputWithPath<Path, MergeRPCInput<[...GM, ...M]>>, InferRouteOutputFromOperation<Operation>, Operation>;
    }>, GM>;
  }

  delete<
    Path extends string,
    M extends AnyMiddlewareHandler<T>[],
    Operation = MergeOperationMetadata<M>
  >(
    path: Path,
    ...handlers: [...M, Handler<T, Simplify<V & MergeMiddlewareValidatedData<[...GM, ...M]>>>]
  ): Orva<T, V, Simplify<R & {
    [K in RouteKey<'DELETE', Path>]: RouteDefinition<Path, 'DELETE', RouteInputWithPath<Path, MergeRPCInput<[...GM, ...M]>>, InferRouteOutputFromOperation<Operation>, Operation>;
  }>, GM> {
    return this.addRoute('DELETE', path, handlers) as unknown as Orva<T, V, Simplify<R & {
      [K in RouteKey<'DELETE', Path>]: RouteDefinition<Path, 'DELETE', RouteInputWithPath<Path, MergeRPCInput<[...GM, ...M]>>, InferRouteOutputFromOperation<Operation>, Operation>;
    }>, GM>;
  }

  patch<
    Path extends string,
    M extends AnyMiddlewareHandler<T>[],
    Operation = MergeOperationMetadata<M>
  >(
    path: Path,
    ...handlers: [...M, Handler<T, Simplify<V & MergeMiddlewareValidatedData<[...GM, ...M]>>>]
  ): Orva<T, V, Simplify<R & {
    [K in RouteKey<'PATCH', Path>]: RouteDefinition<Path, 'PATCH', RouteInputWithPath<Path, MergeRPCInput<[...GM, ...M]>>, InferRouteOutputFromOperation<Operation>, Operation>;
  }>, GM> {
    return this.addRoute('PATCH', path, handlers) as unknown as Orva<T, V, Simplify<R & {
      [K in RouteKey<'PATCH', Path>]: RouteDefinition<Path, 'PATCH', RouteInputWithPath<Path, MergeRPCInput<[...GM, ...M]>>, InferRouteOutputFromOperation<Operation>, Operation>;
    }>, GM>;
  }

  options<
    Path extends string,
    M extends AnyMiddlewareHandler<T>[],
    Operation = MergeOperationMetadata<M>
  >(
    path: Path,
    ...handlers: [...M, Handler<T, Simplify<V & MergeMiddlewareValidatedData<[...GM, ...M]>>>]
  ): Orva<T, V, Simplify<R & {
    [K in RouteKey<'OPTIONS', Path>]: RouteDefinition<Path, 'OPTIONS', RouteInputWithPath<Path, MergeRPCInput<[...GM, ...M]>>, InferRouteOutputFromOperation<Operation>, Operation>;
  }>, GM> {
    return this.addRoute('OPTIONS', path, handlers) as unknown as Orva<T, V, Simplify<R & {
      [K in RouteKey<'OPTIONS', Path>]: RouteDefinition<Path, 'OPTIONS', RouteInputWithPath<Path, MergeRPCInput<[...GM, ...M]>>, InferRouteOutputFromOperation<Operation>, Operation>;
    }>, GM>;
  }

  all<
    Path extends string,
    M extends AnyMiddlewareHandler<T>[],
    Operation = MergeOperationMetadata<M>
  >(
    path: Path,
    ...handlers: [...M, Handler<T, Simplify<V & MergeMiddlewareValidatedData<[...GM, ...M]>>>]
  ): Orva<T, V, R, GM> {
    ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].forEach((method) => {
      this.addRoute(method as HTTPMethod, path, handlers);
    });
    return this as unknown as Orva<T, V, R, GM>;
  }

  private match(method: string, path: string): InternalRouteMatch<T> | null {
    const exact = this.exactRoutes.get(path);
    if (exact) {
      const exactHandler = exact[method] ?? (method === 'HEAD' ? exact.GET : undefined);
      if (exactHandler) {
        return { handler: exactHandler, params: null };
      }
    }

    const segments = this.getPathSegments(path);
    let node = this.root;
    let params: Record<string, string> | null = null;
    let i = 0;

    for (i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const child = node.children[seg];
      if (child) {
        node = child;
        continue;
      }

      if (node.paramChild) {
        const nextParams = params ??= Object.create(null);
        nextParams[node.paramName!] = seg;
        node = node.paramChild;
        continue;
      }

      if (node.wildcardChild) {
        const nextParams = params ??= Object.create(null);
        nextParams['*'] = segments.slice(i).join('/');
        node = node.wildcardChild;
        break;
      }

      return null;
    }

    let handler = node.handlers[method];
    if (!handler && i === segments.length && node.wildcardChild) {
      handler = node.wildcardChild.handlers[method];
      if (!handler && method === 'HEAD') {
        handler = node.wildcardChild.handlers.GET;
      }
      if (handler) {
        const nextParams = params ??= Object.create(null);
        nextParams['*'] = '';
        return { handler, params };
      }
    }

    if (!handler && method === 'HEAD') {
      handler = node.handlers.GET;
    }

    return handler ? { handler, params } : null;
  }

  private async applyResponseFinalizers(ctx: InternalContext<T>, response: InternalResponse): Promise<InternalResponse> {
    const responseCookies = (ctx as OrvaContext<T>).getResponseCookies();
    if (!ctx._finalizers?.length && !responseCookies?.length) {
      return response;
    }

    if (!ctx._finalizers?.length && responseCookies?.length && isFastResponse(response)) {
      for (const cookie of responseCookies) {
        appendFastHeader(response, 'Set-Cookie', cookie);
      }
      return response;
    }

    let finalResponse = isFastResponse(response)
      ? toStandardResponse(response)
      : response;
    const finalizers = ctx._finalizers;
    if (finalizers) {
      for (let i = finalizers.length - 1; i >= 0; i--) {
        finalResponse = await finalizers[i](finalResponse, ctx);
      }
    }
    if (responseCookies) {
      for (const cookie of responseCookies) {
        finalResponse.headers.append('Set-Cookie', cookie);
      }
    }
    return finalResponse;
  }

  private dispatchRoute(c: Context<T, any>): InternalResponse | Promise<InternalResponse> {
    const ctxValue = c as OrvaContext<T>;
    const match = this.match(ctxValue.method, ctxValue.pathname);
    if (match) {
      c.params = match.params ?? EMPTY_PARAMS;
      return match.handler(c);
    }
    return this.notFoundHandler ? this.notFoundHandler(c) : c.notFound();
  }

  private finalizeResponse(ctx: OrvaContext<T>, response: InternalResponse): InternalResponse | Promise<InternalResponse> {
    const responseCookies = ctx.getResponseCookies();
    if (!ctx._finalizers?.length && !responseCookies?.length) {
      return response;
    }
    return this.applyResponseFinalizers(ctx, response);
  }

  private handleErrorWithContext(ctx: OrvaContext<T>, err: unknown): InternalResponse | Promise<InternalResponse> {
    if (this.errorHandler) {
      try {
        const handled = this.errorHandler(err as Error, ctx);
        return handled instanceof Promise
          ? handled.then((response) => this.finalizeResponse(ctx, response))
          : this.finalizeResponse(ctx, handled);
      } catch (handlerErr) {
        console.error('Orva error:', handlerErr);
      }
    }
    console.error('Orva error:', err);
    return this.finalizeResponse(
      ctx,
      ctx.json({ error: (err as Error).message || 'Internal Server Error' }, 500),
    );
  }

  private executeWithContext(ctx: OrvaContext<T>, handler: Handler<T, any>): InternalResponse | Promise<InternalResponse> {
    try {
      const response = handler(ctx);
      return response instanceof Promise
        ? response
          .then((resolved) => this.finalizeResponse(ctx, resolved))
          .catch((err) => this.handleErrorWithContext(ctx, err))
        : this.finalizeResponse(ctx, response);
    } catch (err) {
      return this.handleErrorWithContext(ctx, err);
    }
  }

  fetchRaw(request: RequestLike): InternalResponse | Promise<InternalResponse> {
    const method = request.__orvaMethod__ ?? request.method.toUpperCase();
    let normalizedPath = request.__orvaPathname__;
    let search = request.__orvaSearch__;
    if (normalizedPath === undefined || search === undefined) {
      const extracted = extractPathAndSearch(request.url);
      normalizedPath ??= normalizeExtractedPathname(extracted.pathname);
      search ??= extracted.search;
    }

    const exactRoutes = this.globalMiddlewares.length === 0
      ? this.exactRoutes
      : (this.compiledExactRoutes ??= this.compileExactRoutesWithGlobals());
    const exact = exactRoutes.get(normalizedPath);
    const exactHandler = exact?.[method] ?? (method === 'HEAD' ? exact?.GET : undefined);
    if (exactHandler) {
      const ctx = new OrvaContext<T>(request, method, normalizedPath, search);
      return this.executeWithContext(ctx, exactHandler);
    }

    if (!this.compiledHandler) {
      const routeDispatcher = this.dispatchRoute.bind(this) as Handler<T, any>;
      this.compiledHandler = this.globalMiddlewares.length === 0
        ? routeDispatcher
        : this.composeHandlers([
          ...this.globalMiddlewares,
          routeDispatcher,
        ] as [...AnyMiddlewareHandler<T>[], Handler<T, any>]);
    }

    const ctx = new OrvaContext<T>(request, method, normalizedPath, search);
    return this.executeWithContext(ctx, this.compiledHandler);
  }

  fetch(request: Request): Response | Promise<Response> {
    const response = this.fetchRaw(request);
    return response instanceof Promise
      ? response.then((value) => toStandardResponse(value))
      : toStandardResponse(response);
  }
}

export function createOrva<T extends object = Record<string, unknown>>(): Orva<T, {}, {}, []> {
  return new Orva<T, {}, {}, []>();
}

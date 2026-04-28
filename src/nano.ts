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
}

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
type RoutesOfNanoInstance<App> = App extends Nano<any, any, infer Routes, any> ? Routes : {};
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

class NanoRequestFacade implements RequestWrapper {
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

function createRequestFacade(request: Request): EnhancedRequest {
  const cached = REQUEST_WRAPPER_CACHE.get(request);
  if (cached) return cached;

  const wrapper = new NanoRequestFacade(request, getRequestBodyCache(request)) as unknown as EnhancedRequest;

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

function parseQueryString(search: string): Record<string, string> {
  if (!search || search === '?') return EMPTY_PARAMS;

  const query: Record<string, string> = Object.create(null);
  const source = search.charCodeAt(0) === 63 ? search.slice(1) : search;
  if (!source) return query;

  for (const pair of source.split('&')) {
    if (!pair) continue;
    const separatorIndex = pair.indexOf('=');
    const rawKey = separatorIndex >= 0 ? pair.slice(0, separatorIndex) : pair;
    const rawValue = separatorIndex >= 0 ? pair.slice(separatorIndex + 1) : '';
    const key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
    const value = decodeURIComponent(rawValue.replace(/\+/g, ' '));
    query[key] = value;
  }

  return query;
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

function createResponse(
  data: BodyInit | null,
  status: StatusCode,
  defaultHeaders: HeadersInit,
  customHeaders?: HeadersInit
): Response {
  return new Response(data, {
    status,
    headers: createHeaders(defaultHeaders, customHeaders),
  });
}

class NanoContext<T extends object = Record<string, unknown>, V extends ValidatedData = {}> implements InternalContext<T> {
  params: Record<string, string> = EMPTY_PARAMS;
  var: T;
  private readonly request: Request;
  private readonly requestUrl: string;
  private readonly requestMethod: string;
  private readonly pathnameValue: string;
  private readonly searchValue: string;
  private requestFacade: EnhancedRequest | null = null;
  private urlCache: URL | null = null;
  private queryCache: Record<string, string> | null = null;
  private cookieCache: Record<string, string> | null = null;
  _finalizers: ResponseFinalizer<T, any>[] | null = null;
  _validated: Record<string, unknown> | null = null;
  private responseCookies: string[] | null = null;

  constructor(
    request: Request,
    requestMethod?: string,
    pathname?: string,
    search?: string,
  ) {
    this.request = request;
    this.requestUrl = request.url;
    this.requestMethod = requestMethod ?? request.method.toUpperCase();

    if (pathname !== undefined && search !== undefined) {
      this.pathnameValue = pathname;
      this.searchValue = search;
    } else {
      const extracted = extractPathAndSearch(request.url);
      this.pathnameValue = normalizeExtractedPathname(extracted.pathname);
      this.searchValue = extracted.search;
    }

    this.var = {} as T;
  }

  get req(): EnhancedRequest {
    return this.requestFacade ??= createRequestFacade(this.request);
  }

  get url(): URL {
    return this.urlCache ??= new URL(this.requestUrl);
  }

  get query(): Record<string, string> {
    return this.queryCache ??= parseQueryString(this.searchValue);
  }

  get pathname(): string {
    return this.pathnameValue;
  }

  get method(): string {
    return this.requestMethod;
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    this.var[key] = value;
  }

  get<K extends keyof T>(key: K): T[K] | undefined {
    return this.var[key];
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
    (this._finalizers ??= []).push(finalizer as ResponseFinalizer<T, any>);
  }

  cookie(name: string): string | undefined {
    return (this.cookieCache ??= parseCookieHeader(this.request.headers.get('cookie')))[name];
  }

  cookies(): Record<string, string> {
    return { ...(this.cookieCache ??= parseCookieHeader(this.request.headers.get('cookie'))) };
  }

  setCookie(name: string, value: string, options: CookieOptions = {}): void {
    (this.responseCookies ??= []).push(serializeCookie(name, value, options));
  }

  deleteCookie(name: string, options: DeleteCookieOptions = {}): void {
    (this.responseCookies ??= []).push(serializeDeleteCookie(name, options));
  }

  getResponseCookies(): readonly string[] | null {
    return this.responseCookies;
  }

  text(data: string, status = 200, headers?: HeadersInit): Response {
    return createResponse(data, status, DEFAULT_TEXT_HEADERS, headers);
  }

  json(data: unknown, status = 200, headers?: HeadersInit): Response {
    return createResponse(JSON.stringify(data), status, DEFAULT_JSON_HEADERS, headers);
  }

  html(data: string, status = 200, headers?: HeadersInit): Response {
    return createResponse(data, status, DEFAULT_HTML_HEADERS, headers);
  }

  redirect(url: string | URL, status: 301 | 302 | 303 | 307 | 308 = 302): Response {
    return new Response(null, { status, headers: { Location: url.toString() } });
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
    return new Response('Not Found', { status: 404 });
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
export const DEFAULT_JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };
export const DEFAULT_HTML_HEADERS = { 'Content-Type': 'text/html; charset=utf-8' };
export const DEFAULT_TEXT_HEADERS = { 'Content-Type': 'text/plain; charset=utf-8' };
export const DEFAULT_SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive'
};
export const DEFAULT_DOWNLOAD_HEADERS = { 'Content-Type': 'application/octet-stream' };
export type { CookieOptions, DeleteCookieOptions } from './cookies.js';

export class Nano<
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
  ): Nano<Simplify<T & MergeMiddlewareAddedVars<M>>, Simplify<V & MergeMiddlewareValidatedData<M>>, R, [...GM, ...M]> {
    if (this.isInGroup) {
      this.currentGroupMiddlewares.push(...handlers);
    } else {
      this.globalMiddlewares.push(...handlers);
    }
    this.compiledHandler = null;
    return this as unknown as Nano<
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

  group<Prefix extends string, Child extends Nano<any, any, any, any> | void>(
    prefix: Prefix,
    callback: (app: Nano<T, V, {}, GM>) => Child
  ): Nano<T, V, Simplify<R & PrefixRouteRegistry<Prefix, RoutesOfNanoInstance<Exclude<Child, void>>>>, GM> {
    const groupApp = new Nano<T, V, {}, GM>();
    groupApp.basePath = this.basePath + this.normalizePath(prefix);
    groupApp.isInGroup = true;
    groupApp.inheritedGroupMiddlewares = [
      ...this.inheritedGroupMiddlewares,
      ...this.currentGroupMiddlewares
    ];
    callback(groupApp);

    this.mergeRoutesFromApp(groupApp);
    this.compiledHandler = null;
    return this as unknown as Nano<T, V, Simplify<R & PrefixRouteRegistry<Prefix, RoutesOfNanoInstance<Exclude<Child, void>>>>, GM>;
  }

  route<Prefix extends string, Child extends Nano<any, any, any, any>>(
    prefix: Prefix,
    app: Child
  ): Nano<T, V, Simplify<R & PrefixRouteRegistry<Prefix, RoutesOfNanoInstance<Child>>>, GM> {
    this.mergeRoutesFromApp(app, prefix);
    this.compiledHandler = null;
    return this as unknown as Nano<T, V, Simplify<R & PrefixRouteRegistry<Prefix, RoutesOfNanoInstance<Child>>>, GM>;
  }

  private mergeRoutesFromApp(other: Nano<T, any, any, any>, prefix = ''): void {
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
    return this;
  }

  private composeHandlers(handlers: [...AnyMiddlewareHandler<T>[], Handler<T, any>]): Handler<T, any> {
    if (handlers.length === 1) return handlers[0] as Handler<T, any>;

    const middlewares = handlers.slice(0, -1) as AnyMiddlewareHandler<T>[];
    const finalHandler = handlers[handlers.length - 1] as Handler<T, any>;

    return async (c: Context<T, any>): Promise<Response> => {
      let index = -1;
      let resolvedResponse: Response | null = null;

      const dispatch = async (i: number): Promise<void> => {
        if (i <= index) throw new Error('next() called multiple times');
        index = i;

        if (i === middlewares.length) {
          resolvedResponse = await finalHandler(c);
          return;
        }

        const result = await middlewares[i](c, () => dispatch(i + 1));
        if (result instanceof Response) {
          resolvedResponse = result;
          return;
        }
      };

      await dispatch(0);
      return resolvedResponse ?? await finalHandler(c);
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
  ): Nano<T, V, Simplify<R & {
    [K in RouteKey<'GET', Path>]: RouteDefinition<Path, 'GET', RouteInputWithPath<Path, MergeRPCInput<[...GM, ...M]>>, InferRouteOutputFromOperation<Operation>, Operation>;
  }>, GM> {
    return this.addRoute('GET', path, handlers) as unknown as Nano<T, V, Simplify<R & {
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
  ): Nano<T, V, Simplify<R & {
    [K in RouteKey<'POST', Path>]: RouteDefinition<Path, 'POST', RouteInputWithPath<Path, MergeRPCInput<[...GM, ...M]>>, InferRouteOutputFromOperation<Operation>, Operation>;
  }>, GM> {
    return this.addRoute('POST', path, handlers) as unknown as Nano<T, V, Simplify<R & {
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
  ): Nano<T, V, Simplify<R & {
    [K in RouteKey<'PUT', Path>]: RouteDefinition<Path, 'PUT', RouteInputWithPath<Path, MergeRPCInput<[...GM, ...M]>>, InferRouteOutputFromOperation<Operation>, Operation>;
  }>, GM> {
    return this.addRoute('PUT', path, handlers) as unknown as Nano<T, V, Simplify<R & {
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
  ): Nano<T, V, Simplify<R & {
    [K in RouteKey<'DELETE', Path>]: RouteDefinition<Path, 'DELETE', RouteInputWithPath<Path, MergeRPCInput<[...GM, ...M]>>, InferRouteOutputFromOperation<Operation>, Operation>;
  }>, GM> {
    return this.addRoute('DELETE', path, handlers) as unknown as Nano<T, V, Simplify<R & {
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
  ): Nano<T, V, Simplify<R & {
    [K in RouteKey<'PATCH', Path>]: RouteDefinition<Path, 'PATCH', RouteInputWithPath<Path, MergeRPCInput<[...GM, ...M]>>, InferRouteOutputFromOperation<Operation>, Operation>;
  }>, GM> {
    return this.addRoute('PATCH', path, handlers) as unknown as Nano<T, V, Simplify<R & {
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
  ): Nano<T, V, Simplify<R & {
    [K in RouteKey<'OPTIONS', Path>]: RouteDefinition<Path, 'OPTIONS', RouteInputWithPath<Path, MergeRPCInput<[...GM, ...M]>>, InferRouteOutputFromOperation<Operation>, Operation>;
  }>, GM> {
    return this.addRoute('OPTIONS', path, handlers) as unknown as Nano<T, V, Simplify<R & {
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
  ): Nano<T, V, R, GM> {
    ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].forEach((method) => {
      this.addRoute(method as HTTPMethod, path, handlers);
    });
    return this as unknown as Nano<T, V, R, GM>;
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
        nextParams[node.paramName!] = decodeURIComponent(seg);
        node = node.paramChild;
        continue;
      }

      if (node.wildcardChild) {
        const nextParams = params ??= Object.create(null);
        nextParams['*'] = decodeURIComponent(segments.slice(i).join('/'));
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

  private async applyResponseFinalizers(ctx: InternalContext<T>, response: Response): Promise<Response> {
    const responseCookies = (ctx as NanoContext<T>).getResponseCookies();
    if (!ctx._finalizers?.length && !responseCookies?.length) {
      return response;
    }

    let finalResponse = response;
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

  private dispatchRoute(c: Context<T, any>): Response | Promise<Response> {
    const ctxValue = c as NanoContext<T>;
    const match = this.match(ctxValue.method, ctxValue.pathname);
    if (match) {
      c.params = match.params ?? EMPTY_PARAMS;
      return match.handler(c);
    }
    return this.notFoundHandler ? this.notFoundHandler(c) : c.notFound();
  }

  private finalizeResponse(ctx: NanoContext<T>, response: Response): Response | Promise<Response> {
    const responseCookies = ctx.getResponseCookies();
    if (!ctx._finalizers?.length && !responseCookies?.length) {
      return response;
    }
    return this.applyResponseFinalizers(ctx, response);
  }

  private handleErrorWithContext(ctx: NanoContext<T>, err: unknown): Response | Promise<Response> {
    if (this.errorHandler) {
      try {
        const handled = this.errorHandler(err as Error, ctx);
        return handled instanceof Promise
          ? handled.then((response) => this.finalizeResponse(ctx, response))
          : this.finalizeResponse(ctx, handled);
      } catch (handlerErr) {
        console.error('Nano error:', handlerErr);
      }
    }
    console.error('Nano error:', err);
    return this.finalizeResponse(
      ctx,
      ctx.json({ error: (err as Error).message || 'Internal Server Error' }, 500),
    );
  }

  private executeWithContext(ctx: NanoContext<T>, handler: Handler<T, any>): Response | Promise<Response> {
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

  fetch(request: Request): Response | Promise<Response> {
    const method = request.method.toUpperCase();
    const { pathname, search } = extractPathAndSearch(request.url);
    const normalizedPath = normalizeExtractedPathname(pathname);

    if (this.globalMiddlewares.length === 0) {
      const exact = this.exactRoutes.get(normalizedPath);
      const exactHandler = exact?.[method] ?? (method === 'HEAD' ? exact?.GET : undefined);
      if (exactHandler) {
        const ctx = new NanoContext<T>(request, method, normalizedPath, search);
        return this.executeWithContext(ctx, exactHandler);
      }
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

    const ctx = new NanoContext<T>(request, method, normalizedPath, search);
    return this.executeWithContext(ctx, this.compiledHandler);
  }
}

export function createNano<T extends object = Record<string, unknown>>(): Nano<T, {}, {}, []> {
  return new Nano<T, {}, {}, []>();
}

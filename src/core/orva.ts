// ============ Type define ============
import {
  OPENAPI_METADATA,
  OPENAPI_MIDDLEWARE_METADATA,
  VALIDATOR_METADATA,
  type OpenAPIMiddlewareMetadata,
  type OpenAPIOperationMetadata,
  type RouteRuntimeDefinition,
  type ValidatorContractMetadata,
} from '../metadata.js';
import { buildRouteRuntimeContract } from '../route-runtime-contract.js';
import {
  getCookieFromHeader,
  parseCookieHeader,
  serializeCookie,
  serializeDeleteCookie,
  type CookieOptions,
  type DeleteCookieOptions,
} from '../cookies.js';
import type {
  AnyMiddlewareHandler,
  Context,
  EnhancedRequest,
  ErrorHandler,
  Handler,
  HTTPMethod,
  MiddlewareHandler,
  Next,
  NotFoundHandler,
  RequestLike,
  ResponseFinalizer,
  RouteHandlerResult,
  Simplify,
  StatusCode,
  TypedResponse,
  ValidatedData,
} from './types.js';
import type {
  MergeMiddlewareAddedVars,
  MergeMiddlewareValidatedData,
  MergeOperationMetadata,
  MethodRegistrationResult,
  PrefixRouteRegistry,
  RouteRegistrationHandler,
  RoutesOfOrvaInstance,
} from './route-types.js';
import {
  appendFastHeader,
  createFastHeaders,
  createHeaders,
  DEFAULT_DOWNLOAD_HEADERS,
  DEFAULT_HTML_HEADERS,
  DEFAULT_JSON_HEADERS,
  DEFAULT_SSE_HEADERS,
  DEFAULT_TEXT_HEADERS,
  FastResponse,
  isFastResponse,
  type InternalResponse,
  toStandardResponse,
} from './response.js';
import {
  createRequestFacade,
  extractPathAndSearch,
  normalizeExtractedPathname,
} from './request.js';
import {
  createLazyParamsRecord,
  createLazyQueryRecord,
  EMPTY_PARAMS,
} from './lazy-records.js';

// ============ Radix Tree ============

export interface RouteMatch<T extends object> {
  handler: Handler<T, any>;
  params: Record<string, string>;
}

export interface InternalContext<T extends object = Record<string, unknown>> extends Context<T, any> {
  _finalizers: ResponseFinalizer<T, any>[] | null;
  _validated: Record<string, unknown> | null;
}

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

  text<const Status extends StatusCode = 200>(data: string, status = 200 as Status, headers?: HeadersInit): TypedResponse<Status, string, 'text'> {
    return new FastResponse('text', status, data, headers ? createFastHeaders(DEFAULT_TEXT_HEADERS, headers) : DEFAULT_TEXT_HEADERS) as unknown as TypedResponse<Status, string, 'text'>;
  }

  json<Body, const Status extends StatusCode = 200>(data: Body, status = 200 as Status, headers?: HeadersInit): TypedResponse<Status, Body, 'json'> {
    return new FastResponse('json', status, data, headers ? createFastHeaders(DEFAULT_JSON_HEADERS, headers) : DEFAULT_JSON_HEADERS) as unknown as TypedResponse<Status, Body, 'json'>;
  }

  html<const Status extends StatusCode = 200>(data: string, status = 200 as Status, headers?: HeadersInit): TypedResponse<Status, string, 'html'> {
    return new FastResponse('text', status, data, headers ? createFastHeaders(DEFAULT_HTML_HEADERS, headers) : DEFAULT_HTML_HEADERS) as unknown as TypedResponse<Status, string, 'html'>;
  }

  redirect<const Status extends 301 | 302 | 303 | 307 | 308 = 302>(url: string | URL, status: Status = 302 as Status): TypedResponse<Status, null, 'empty'> {
    return new FastResponse('empty', status, null, { Location: url.toString() }) as unknown as TypedResponse<Status, null, 'empty'>;
  }

  stream<Body extends ReadableStream | AsyncIterable<unknown> | Iterable<unknown>, const Status extends StatusCode = 200>(stream: Body, status = 200 as Status, headers?: HeadersInit): TypedResponse<Status, Body, 'stream'> {
    const readable = stream instanceof ReadableStream ? stream : new ReadableStream({
      async start(controller) {
        try {
          if (Symbol.asyncIterator in Object(stream)) {
            for await (const chunk of stream as AsyncIterable<unknown>) {
              controller.enqueue(typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk as Uint8Array);
            }
          } else {
            for (const chunk of stream as Iterable<unknown>) {
              controller.enqueue(typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk as Uint8Array);
            }
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
    }) as TypedResponse<Status, Body, 'stream'>;
  }

  sse<Body extends ReadableStream | AsyncIterable<unknown> | Iterable<unknown>, const Status extends StatusCode = 200>(stream: Body, status = 200 as Status): TypedResponse<Status, Body, 'stream'> {
    return this.stream(stream, status, DEFAULT_SSE_HEADERS);
  }

  download<Body extends ReadableStream | AsyncIterable<unknown> | Iterable<unknown>, const Status extends StatusCode = 200>(stream: Body, filename?: string, status = 200 as Status): TypedResponse<Status, Body, 'stream'> {
    return this.stream(stream, status, {
      ...DEFAULT_DOWNLOAD_HEADERS,
      ...(filename ? { 'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"` } : {}),
    });
  }

  notFound(): TypedResponse<404, string, 'text'> {
    return new FastResponse('text', 404, 'Not Found', DEFAULT_TEXT_HEADERS) as unknown as TypedResponse<404, string, 'text'>;
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
export type { CookieOptions, DeleteCookieOptions } from '../cookies.js';

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

  use<const M extends readonly MiddlewareHandler<T, any>[]>(
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
      contract: { input: { parameters: {} }, responses: {} },
    };
    nextDefinition.contract = buildRouteRuntimeContract(nextDefinition.validators, nextDefinition.openapi);

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
    if (handlers.length === 1) {
      return handlers[0] as Handler<T, any>;
    }

    const finalHandler = handlers[handlers.length - 1] as Handler<T, any>;
    const middlewares = handlers.slice(0, -1) as AnyMiddlewareHandler<T>[];

    if (middlewares.length === 1) {
      const [middleware0] = middlewares;
      return async (c: Context<T, any>): Promise<Response> => {
        let called0 = false;
        let downstream0: InternalResponse | undefined;
        const result0 = await middleware0(c, async () => {
          if (called0) {
            throw new Error('next() called multiple times');
          }
          called0 = true;
          downstream0 = await finalHandler(c) as InternalResponse;
        });

        if (result0 instanceof Response || isFastResponse(result0)) {
          return result0 as Response;
        }

        return ((downstream0 ?? await finalHandler(c)) as Response);
      };
    }

    if (middlewares.length === 2) {
      const [middleware0, middleware1] = middlewares;
      return async (c: Context<T, any>): Promise<Response> => {
        const invoke1 = async (): Promise<InternalResponse> => {
          let called1 = false;
          let downstream1: InternalResponse | undefined;
          const result1 = await middleware1(c, async () => {
            if (called1) {
              throw new Error('next() called multiple times');
            }
            called1 = true;
            downstream1 = await finalHandler(c) as InternalResponse;
          });

          if (result1 instanceof Response || isFastResponse(result1)) {
            return result1 as InternalResponse;
          }

          return downstream1 ?? await finalHandler(c) as InternalResponse;
        };

        let called0 = false;
        let downstream0: InternalResponse | undefined;
        const result0 = await middleware0(c, async () => {
          if (called0) {
            throw new Error('next() called multiple times');
          }
          called0 = true;
          downstream0 = await invoke1();
        });

        if (result0 instanceof Response || isFastResponse(result0)) {
          return result0 as Response;
        }

        return ((downstream0 ?? await invoke1()) as Response);
      };
    }

    if (middlewares.length === 3) {
      const [middleware0, middleware1, middleware2] = middlewares;
      return async (c: Context<T, any>): Promise<Response> => {
        const invoke2 = async (): Promise<InternalResponse> => {
          let called2 = false;
          let downstream2: InternalResponse | undefined;
          const result2 = await middleware2(c, async () => {
            if (called2) {
              throw new Error('next() called multiple times');
            }
            called2 = true;
            downstream2 = await finalHandler(c) as InternalResponse;
          });

          if (result2 instanceof Response || isFastResponse(result2)) {
            return result2 as InternalResponse;
          }

          return downstream2 ?? await finalHandler(c) as InternalResponse;
        };

        const invoke1 = async (): Promise<InternalResponse> => {
          let called1 = false;
          let downstream1: InternalResponse | undefined;
          const result1 = await middleware1(c, async () => {
            if (called1) {
              throw new Error('next() called multiple times');
            }
            called1 = true;
            downstream1 = await invoke2();
          });

          if (result1 instanceof Response || isFastResponse(result1)) {
            return result1 as InternalResponse;
          }

          return downstream1 ?? await invoke2() as InternalResponse;
        };

        let called0 = false;
        let downstream0: InternalResponse | undefined;
        const result0 = await middleware0(c, async () => {
          if (called0) {
            throw new Error('next() called multiple times');
          }
          called0 = true;
          downstream0 = await invoke1();
        });

        if (result0 instanceof Response || isFastResponse(result0)) {
          return result0 as Response;
        }

        return ((downstream0 ?? await invoke1()) as Response);
      };
    }

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

  // HTTP method registration with a compact API
  get<Path extends string, Result extends RouteHandlerResult>(
    path: Path,
    handler: RouteRegistrationHandler<T, V, GM, [], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'GET', Path, [], undefined, Result>;
  get<Path extends string, M1, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'GET', Path, [M1], Operation, Result>;
  get<Path extends string, M1, M2, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'GET', Path, [M1, M2], Operation, Result>;
  get<Path extends string, M1, M2, M3, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'GET', Path, [M1, M2, M3], Operation, Result>;
  get<Path extends string, M1, M2, M3, M4, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3, M4]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    middleware4: M4 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3, M4], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'GET', Path, [M1, M2, M3, M4], Operation, Result>;
  get<Path extends string, M1, M2, M3, M4, M5, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3, M4, M5]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    middleware4: M4 & MiddlewareHandler<T, any>,
    middleware5: M5 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3, M4, M5], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'GET', Path, [M1, M2, M3, M4, M5], Operation, Result>;
  get<Path extends string, M1, M2, M3, M4, M5, M6, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3, M4, M5, M6]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    middleware4: M4 & MiddlewareHandler<T, any>,
    middleware5: M5 & MiddlewareHandler<T, any>,
    middleware6: M6 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3, M4, M5, M6], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'GET', Path, [M1, M2, M3, M4, M5, M6], Operation, Result>;
  get(path: string, ...handlers: readonly unknown[]): this {
    return this.addRoute('GET', path, handlers);
  }

  post<Path extends string, Result extends RouteHandlerResult>(
    path: Path,
    handler: RouteRegistrationHandler<T, V, GM, [], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'POST', Path, [], undefined, Result>;
  post<Path extends string, M1, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'POST', Path, [M1], Operation, Result>;
  post<Path extends string, M1, M2, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'POST', Path, [M1, M2], Operation, Result>;
  post<Path extends string, M1, M2, M3, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'POST', Path, [M1, M2, M3], Operation, Result>;
  post<Path extends string, M1, M2, M3, M4, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3, M4]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    middleware4: M4 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3, M4], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'POST', Path, [M1, M2, M3, M4], Operation, Result>;
  post<Path extends string, M1, M2, M3, M4, M5, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3, M4, M5]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    middleware4: M4 & MiddlewareHandler<T, any>,
    middleware5: M5 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3, M4, M5], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'POST', Path, [M1, M2, M3, M4, M5], Operation, Result>;
  post<Path extends string, M1, M2, M3, M4, M5, M6, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3, M4, M5, M6]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    middleware4: M4 & MiddlewareHandler<T, any>,
    middleware5: M5 & MiddlewareHandler<T, any>,
    middleware6: M6 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3, M4, M5, M6], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'POST', Path, [M1, M2, M3, M4, M5, M6], Operation, Result>;
  post(path: string, ...handlers: readonly unknown[]): this {
    return this.addRoute('POST', path, handlers);
  }

  put<Path extends string, Result extends RouteHandlerResult>(
    path: Path,
    handler: RouteRegistrationHandler<T, V, GM, [], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'PUT', Path, [], undefined, Result>;
  put<Path extends string, M1, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'PUT', Path, [M1], Operation, Result>;
  put<Path extends string, M1, M2, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'PUT', Path, [M1, M2], Operation, Result>;
  put<Path extends string, M1, M2, M3, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'PUT', Path, [M1, M2, M3], Operation, Result>;
  put<Path extends string, M1, M2, M3, M4, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3, M4]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    middleware4: M4 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3, M4], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'PUT', Path, [M1, M2, M3, M4], Operation, Result>;
  put<Path extends string, M1, M2, M3, M4, M5, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3, M4, M5]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    middleware4: M4 & MiddlewareHandler<T, any>,
    middleware5: M5 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3, M4, M5], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'PUT', Path, [M1, M2, M3, M4, M5], Operation, Result>;
  put<Path extends string, M1, M2, M3, M4, M5, M6, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3, M4, M5, M6]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    middleware4: M4 & MiddlewareHandler<T, any>,
    middleware5: M5 & MiddlewareHandler<T, any>,
    middleware6: M6 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3, M4, M5, M6], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'PUT', Path, [M1, M2, M3, M4, M5, M6], Operation, Result>;
  put(path: string, ...handlers: readonly unknown[]): this {
    return this.addRoute('PUT', path, handlers);
  }

  delete<Path extends string, Result extends RouteHandlerResult>(
    path: Path,
    handler: RouteRegistrationHandler<T, V, GM, [], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'DELETE', Path, [], undefined, Result>;
  delete<Path extends string, M1, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'DELETE', Path, [M1], Operation, Result>;
  delete<Path extends string, M1, M2, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'DELETE', Path, [M1, M2], Operation, Result>;
  delete<Path extends string, M1, M2, M3, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'DELETE', Path, [M1, M2, M3], Operation, Result>;
  delete<Path extends string, M1, M2, M3, M4, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3, M4]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    middleware4: M4 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3, M4], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'DELETE', Path, [M1, M2, M3, M4], Operation, Result>;
  delete<Path extends string, M1, M2, M3, M4, M5, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3, M4, M5]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    middleware4: M4 & MiddlewareHandler<T, any>,
    middleware5: M5 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3, M4, M5], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'DELETE', Path, [M1, M2, M3, M4, M5], Operation, Result>;
  delete<Path extends string, M1, M2, M3, M4, M5, M6, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3, M4, M5, M6]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    middleware4: M4 & MiddlewareHandler<T, any>,
    middleware5: M5 & MiddlewareHandler<T, any>,
    middleware6: M6 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3, M4, M5, M6], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'DELETE', Path, [M1, M2, M3, M4, M5, M6], Operation, Result>;
  delete(path: string, ...handlers: readonly unknown[]): this {
    return this.addRoute('DELETE', path, handlers);
  }

  patch<Path extends string, Result extends RouteHandlerResult>(
    path: Path,
    handler: RouteRegistrationHandler<T, V, GM, [], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'PATCH', Path, [], undefined, Result>;
  patch<Path extends string, M1, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'PATCH', Path, [M1], Operation, Result>;
  patch<Path extends string, M1, M2, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'PATCH', Path, [M1, M2], Operation, Result>;
  patch<Path extends string, M1, M2, M3, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'PATCH', Path, [M1, M2, M3], Operation, Result>;
  patch<Path extends string, M1, M2, M3, M4, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3, M4]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    middleware4: M4 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3, M4], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'PATCH', Path, [M1, M2, M3, M4], Operation, Result>;
  patch<Path extends string, M1, M2, M3, M4, M5, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3, M4, M5]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    middleware4: M4 & MiddlewareHandler<T, any>,
    middleware5: M5 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3, M4, M5], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'PATCH', Path, [M1, M2, M3, M4, M5], Operation, Result>;
  patch<Path extends string, M1, M2, M3, M4, M5, M6, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3, M4, M5, M6]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    middleware4: M4 & MiddlewareHandler<T, any>,
    middleware5: M5 & MiddlewareHandler<T, any>,
    middleware6: M6 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3, M4, M5, M6], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'PATCH', Path, [M1, M2, M3, M4, M5, M6], Operation, Result>;
  patch(path: string, ...handlers: readonly unknown[]): this {
    return this.addRoute('PATCH', path, handlers);
  }

  options<Path extends string, Result extends RouteHandlerResult>(
    path: Path,
    handler: RouteRegistrationHandler<T, V, GM, [], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'OPTIONS', Path, [], undefined, Result>;
  options<Path extends string, M1, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'OPTIONS', Path, [M1], Operation, Result>;
  options<Path extends string, M1, M2, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'OPTIONS', Path, [M1, M2], Operation, Result>;
  options<Path extends string, M1, M2, M3, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'OPTIONS', Path, [M1, M2, M3], Operation, Result>;
  options<Path extends string, M1, M2, M3, M4, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3, M4]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    middleware4: M4 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3, M4], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'OPTIONS', Path, [M1, M2, M3, M4], Operation, Result>;
  options<Path extends string, M1, M2, M3, M4, M5, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3, M4, M5]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    middleware4: M4 & MiddlewareHandler<T, any>,
    middleware5: M5 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3, M4, M5], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'OPTIONS', Path, [M1, M2, M3, M4, M5], Operation, Result>;
  options<Path extends string, M1, M2, M3, M4, M5, M6, Result extends RouteHandlerResult, Operation = MergeOperationMetadata<[M1, M2, M3, M4, M5, M6]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    middleware4: M4 & MiddlewareHandler<T, any>,
    middleware5: M5 & MiddlewareHandler<T, any>,
    middleware6: M6 & MiddlewareHandler<T, any>,
    handler: RouteRegistrationHandler<T, V, GM, [M1, M2, M3, M4, M5, M6], Result>,
  ): MethodRegistrationResult<T, V, R, GM, 'OPTIONS', Path, [M1, M2, M3, M4, M5, M6], Operation, Result>;
  options(path: string, ...handlers: readonly unknown[]): this {
    return this.addRoute('OPTIONS', path, handlers);
  }

  all<Path extends string, H extends RouteRegistrationHandler<T, V, GM, []>>(
    path: Path,
    handler: H,
  ): Orva<T, V, R, GM>;
  all<Path extends string, M1, H extends RouteRegistrationHandler<T, V, GM, [M1]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    handler: H,
  ): Orva<T, V, R, GM>;
  all<Path extends string, M1, M2, H extends RouteRegistrationHandler<T, V, GM, [M1, M2]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    handler: H,
  ): Orva<T, V, R, GM>;
  all<Path extends string, M1, M2, M3, H extends RouteRegistrationHandler<T, V, GM, [M1, M2, M3]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    handler: H,
  ): Orva<T, V, R, GM>;
  all<Path extends string, M1, M2, M3, M4, H extends RouteRegistrationHandler<T, V, GM, [M1, M2, M3, M4]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    middleware4: M4 & MiddlewareHandler<T, any>,
    handler: H,
  ): Orva<T, V, R, GM>;
  all<Path extends string, M1, M2, M3, M4, M5, H extends RouteRegistrationHandler<T, V, GM, [M1, M2, M3, M4, M5]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    middleware4: M4 & MiddlewareHandler<T, any>,
    middleware5: M5 & MiddlewareHandler<T, any>,
    handler: H,
  ): Orva<T, V, R, GM>;
  all<Path extends string, M1, M2, M3, M4, M5, M6, H extends RouteRegistrationHandler<T, V, GM, [M1, M2, M3, M4, M5, M6]>>(
    path: Path,
    middleware1: M1 & MiddlewareHandler<T, any>,
    middleware2: M2 & MiddlewareHandler<T, any>,
    middleware3: M3 & MiddlewareHandler<T, any>,
    middleware4: M4 & MiddlewareHandler<T, any>,
    middleware5: M5 & MiddlewareHandler<T, any>,
    middleware6: M6 & MiddlewareHandler<T, any>,
    handler: H,
  ): Orva<T, V, R, GM>;
  all(path: string, ...handlers: readonly unknown[]): Orva<T, V, R, GM> {
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

    let node = this.root;
    let params: Record<string, string> | null = null;
    let cursor = path === '/' ? path.length : 1;
    let exhausted = path === '/';

    while (!exhausted) {
      const nextSlash = path.indexOf('/', cursor);
      const segmentEnd = nextSlash < 0 ? path.length : nextSlash;
      const seg = path.slice(cursor, segmentEnd);
      const child = node.children[seg];
      if (child) {
        node = child;
      } else if (node.paramChild) {
        const nextParams = params ??= Object.create(null);
        nextParams[node.paramName!] = seg;
        node = node.paramChild;
      } else if (node.wildcardChild) {
        const nextParams = params ??= Object.create(null);
        nextParams['*'] = path.slice(cursor);
        node = node.wildcardChild;
        exhausted = true;
        break;
      } else {
        return null;
      }

      if (nextSlash < 0) {
        exhausted = true;
      } else {
        cursor = nextSlash + 1;
      }
    }

    let handler = node.handlers[method];
    if (!handler && exhausted && node.wildcardChild) {
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

import type { Context, MiddlewareHandler } from '../nano.js';
import type { CookieOptions, DeleteCookieOptions } from '../cookies.js';

export type MiddlewareVars = object;
export type MiddlewareContext<T extends object = MiddlewareVars> = Context<T>;
export type MiddlewareFactory<T extends object = MiddlewareVars> = MiddlewareHandler<T>;

export interface StatusErrorOptions {
  status?: number;
  message?: string;
  headers?: HeadersInit;
}

export interface LoggerOptions<T extends object = MiddlewareVars> {
  log?: (message: string, context: MiddlewareContext<T>) => void;
  includeQuery?: boolean;
}

export interface RequestIdOptions {
  headerName?: string;
  contextKey?: string;
  generator?: () => string;
  exposeHeader?: boolean;
  overwrite?: boolean;
}

export interface ResponseTimeOptions {
  headerName?: string;
  precision?: number;
  suffix?: string;
}

export interface HeaderValueOptions<T extends object = MiddlewareVars> {
  headers: HeadersInit | ((context: MiddlewareContext<T>) => HeadersInit);
}

export type { CookieOptions, DeleteCookieOptions };

export interface CORSOptions<T extends object = MiddlewareVars> {
  origin?: string | string[] | ((origin: string | null, context: MiddlewareContext<T>) => string | null | boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export interface AuthOptions extends StatusErrorOptions {
  realm?: string;
}

export interface BasicAuthOptions<T extends object = MiddlewareVars> extends AuthOptions {
  users:
    | Record<string, string>
    | Map<string, string>
    | ((username: string, password: string, context: MiddlewareContext<T>) => boolean | Promise<boolean>);
}

export interface BearerAuthOptions<T extends object = MiddlewareVars> extends AuthOptions {
  token:
    | string
    | string[]
    | Set<string>
    | ((token: string, context: MiddlewareContext<T>) => boolean | Promise<boolean>);
}

export interface ApiKeyAuthOptions<T extends object = MiddlewareVars> extends StatusErrorOptions {
  key:
    | string
    | string[]
    | Set<string>
    | ((key: string, context: MiddlewareContext<T>) => boolean | Promise<boolean>);
  headerName?: string;
  queryName?: string;
}

export interface BodyLimitOptions extends StatusErrorOptions {
  maxBytes: number;
}

export interface TimeoutOptions extends StatusErrorOptions {
  ms: number;
}

export interface RateLimitOptions<T extends object = MiddlewareVars> extends StatusErrorOptions {
  limit: number;
  windowMs: number;
  keyGenerator?: (context: MiddlewareContext<T>) => string;
  standardHeaders?: boolean;
}

export interface MethodGuardOptions extends StatusErrorOptions {
  methods: string[];
}

export interface HeaderRequirementOptions extends StatusErrorOptions {
  names: string[];
}

export interface QueryRequirementOptions extends StatusErrorOptions {
  names: string[];
}

export interface JsonRequirementOptions extends StatusErrorOptions {
  methods?: string[];
}

export interface ServeStaticAsset {
  body: string | Uint8Array | ArrayBuffer;
  contentType?: string;
  etag?: string;
  lastModified?: string | Date;
}

export interface ServeStaticOptions<T extends object = MiddlewareVars> extends StatusErrorOptions {
  root?: string;
  prefix?: string;
  index?: string | false;
  spaFallback?: string | false;
  manifest?: Record<string, string | Uint8Array | ArrayBuffer | ServeStaticAsset>;
  rewriteRequestPath?: (path: string, context: MiddlewareContext<T>) => string;
  etag?: boolean;
  cacheControl?: string | ((path: string, context: MiddlewareContext<T>, asset: ServeStaticAsset) => string | undefined);
}

export interface CompressOptions<T extends object = MiddlewareVars> {
  threshold?: number;
  encodings?: Array<'br' | 'gzip' | 'deflate'>;
  filter?: (response: Response, context: MiddlewareContext<T>) => boolean;
}

export interface AcceptRequirementOptions extends StatusErrorOptions {
  types: string[];
}

export interface HTTPSRedirectOptions {
  status?: 301 | 302 | 307 | 308;
  trustProxy?: boolean;
}

export interface TrailingSlashOptions {
  mode?: 'add' | 'remove';
  status?: 301 | 302 | 307 | 308;
}

export interface CSPOptions {
  directives: Record<string, string | string[]>;
  reportOnly?: boolean;
}

export interface StrictTransportSecurityOptions {
  maxAge?: number;
  includeSubDomains?: boolean;
  preload?: boolean;
}

export interface PermissionsPolicyOptions {
  directives: Record<string, string | string[]>;
}

export interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export const rateLimitStore = new Map<string, RateLimitRecord>();

export function getErrorResponse(
  context: MiddlewareContext,
  options: StatusErrorOptions,
  fallbackStatus: number,
  fallbackMessage: string
): Response {
  const status = options.status ?? fallbackStatus;
  const message = options.message ?? fallbackMessage;
  return context.text(message, status, options.headers);
}

export function setVar<T extends object>(context: MiddlewareContext<T>, key: string, value: unknown): void {
  (context.var as Record<string, unknown>)[key] = value;
}

export function getRequestHeaderNames(request: Request): string[] {
  const raw = request.headers.get('access-control-request-headers');
  if (!raw) return [];
  return raw.split(',').map((value) => value.trim()).filter(Boolean);
}

export function appendVary(response: Response, value: string): Response {
  const existing = response.headers.get('Vary');
  if (!existing) {
    response.headers.set('Vary', value);
    return response;
  }

  const values = new Set(existing.split(',').map((item) => item.trim()).filter(Boolean));
  values.add(value);
  response.headers.set('Vary', Array.from(values).join(', '));
  return response;
}

export function resolveHeaders<T extends object>(
  input: HeadersInit | ((context: MiddlewareContext<T>) => HeadersInit),
  context: MiddlewareContext<T>
): Headers {
  return new Headers(typeof input === 'function' ? input(context) : input);
}

export function matchValue<T extends object>(
  candidate: string,
  source: string | string[] | Set<string> | ((value: string, context: MiddlewareContext<T>) => boolean | Promise<boolean>),
  context: MiddlewareContext<T>
): boolean | Promise<boolean> {
  if (typeof source === 'function') return source(candidate, context);
  if (typeof source === 'string') return candidate === source;
  if (Array.isArray(source)) return source.includes(candidate);
  return source.has(candidate);
}

export function toMethodSet(methods: string[]): Set<string> {
  return new Set(methods.map((method) => method.toUpperCase()));
}

export function getClientIpFromHeaders(headers: Headers): string {
  const forwardedFor = headers.get('cf-connecting-ip')
    ?? headers.get('x-real-ip')
    ?? headers.get('x-forwarded-for');
  return forwardedFor?.split(',')[0]?.trim() || 'unknown';
}

export function createStaticHeaderMiddleware<T extends object>(
  name: string,
  value: string
): MiddlewareFactory<T> {
  return async (context, next) => {
    context.after((response) => {
      response.headers.set(name, value);
      return response;
    });
    await next();
  };
}

export async function sha1(input: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', input);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function shouldCheckBody(method: string): boolean {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

export function serializePolicyDirectives(directives: Record<string, string | string[]>): string {
  return Object.entries(directives)
    .map(([key, value]) => `${key} ${Array.isArray(value) ? value.join(' ') : value}`.trim())
    .join('; ');
}

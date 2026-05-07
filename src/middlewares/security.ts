import type { MiddlewareHandler } from '../core/index.js';
import type {
  CSPOptions,
  MiddlewareVars,
  PermissionsPolicyOptions,
  StrictTransportSecurityOptions,
} from './shared.js';
import { createStaticHeaderMiddleware, serializePolicyDirectives } from './shared.js';

export function contentSecurityPolicy<T extends object = MiddlewareVars>(options: CSPOptions): MiddlewareHandler<T> {
  const header = options.reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
  return createStaticHeaderMiddleware<T>(header, serializePolicyDirectives(options.directives));
}

export function referrerPolicy<T extends object = MiddlewareVars>(value = 'no-referrer'): MiddlewareHandler<T> {
  return createStaticHeaderMiddleware<T>('Referrer-Policy', value);
}

export function frameOptions<T extends object = MiddlewareVars>(value = 'SAMEORIGIN'): MiddlewareHandler<T> {
  return createStaticHeaderMiddleware<T>('X-Frame-Options', value);
}

export function xContentTypeOptions<T extends object = MiddlewareVars>(value = 'nosniff'): MiddlewareHandler<T> {
  return createStaticHeaderMiddleware<T>('X-Content-Type-Options', value);
}

export function xDnsPrefetchControl<T extends object = MiddlewareVars>(allow = false): MiddlewareHandler<T> {
  return createStaticHeaderMiddleware<T>('X-DNS-Prefetch-Control', allow ? 'on' : 'off');
}

export function xDownloadOptions<T extends object = MiddlewareVars>(value = 'noopen'): MiddlewareHandler<T> {
  return createStaticHeaderMiddleware<T>('X-Download-Options', value);
}

export function xPermittedCrossDomainPolicies<T extends object = MiddlewareVars>(value = 'none'): MiddlewareHandler<T> {
  return createStaticHeaderMiddleware<T>('X-Permitted-Cross-Domain-Policies', value);
}

export function xXssProtection<T extends object = MiddlewareVars>(value = '0'): MiddlewareHandler<T> {
  return createStaticHeaderMiddleware<T>('X-XSS-Protection', value);
}

export function strictTransportSecurity<T extends object = MiddlewareVars>(
  options: StrictTransportSecurityOptions = {}
): MiddlewareHandler<T> {
  const maxAge = options.maxAge ?? 15552000;
  const directives = [`max-age=${maxAge}`];
  if (options.includeSubDomains ?? true) directives.push('includeSubDomains');
  if (options.preload) directives.push('preload');
  return createStaticHeaderMiddleware<T>('Strict-Transport-Security', directives.join('; '));
}

export function permissionsPolicy<T extends object = MiddlewareVars>(options: PermissionsPolicyOptions): MiddlewareHandler<T> {
  return createStaticHeaderMiddleware<T>('Permissions-Policy', serializePolicyDirectives(options.directives));
}

export function crossOriginEmbedderPolicy<T extends object = MiddlewareVars>(value = 'require-corp'): MiddlewareHandler<T> {
  return createStaticHeaderMiddleware<T>('Cross-Origin-Embedder-Policy', value);
}

export function crossOriginOpenerPolicy<T extends object = MiddlewareVars>(value = 'same-origin'): MiddlewareHandler<T> {
  return createStaticHeaderMiddleware<T>('Cross-Origin-Opener-Policy', value);
}

export function crossOriginResourcePolicy<T extends object = MiddlewareVars>(value = 'same-origin'): MiddlewareHandler<T> {
  return createStaticHeaderMiddleware<T>('Cross-Origin-Resource-Policy', value);
}

export function originAgentCluster<T extends object = MiddlewareVars>(value = '?1'): MiddlewareHandler<T> {
  return createStaticHeaderMiddleware<T>('Origin-Agent-Cluster', value);
}

export function secureHeaders<T extends object = MiddlewareVars>(): MiddlewareHandler<T> {
  const handlers = [
    frameOptions<T>(),
    xContentTypeOptions<T>(),
    referrerPolicy<T>(),
    xDnsPrefetchControl<T>(),
    xDownloadOptions<T>(),
    xPermittedCrossDomainPolicies<T>(),
    xXssProtection<T>(),
    crossOriginOpenerPolicy<T>(),
    crossOriginResourcePolicy<T>(),
    originAgentCluster<T>(),
  ];

  return async (context, next) => {
    for (const handler of handlers) {
      await handler(context, async () => undefined);
    }
    await next();
  };
}

import type { MiddlewareHandler } from '../orva.js';
import type { MiddlewareVars, ServeStaticAsset, ServeStaticOptions } from './shared.js';
import { sha1 } from './shared.js';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.pdf': 'application/pdf',
};

interface ResolvedStaticAsset {
  body: Uint8Array;
  contentType?: string;
  etag?: string;
  lastModified?: string;
}

function toServeStaticAsset(asset: ResolvedStaticAsset): ServeStaticAsset {
  return {
    body: asset.body,
    contentType: asset.contentType,
    etag: asset.etag,
    lastModified: asset.lastModified,
  };
}

function normalizePrefix(prefix: string | undefined): string {
  if (!prefix || prefix === '/') return '';
  const normalized = prefix.startsWith('/') ? prefix : `/${prefix}`;
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
}

function stripPrefix(pathname: string, prefix: string): string | null {
  if (!prefix) return pathname;
  if (pathname === prefix) return '/';
  if (pathname.startsWith(`${prefix}/`)) {
    return pathname.slice(prefix.length) || '/';
  }
  return null;
}

function normalizeRelativePath(pathname: string, index: string | false): string | null {
  let relative = pathname.replace(/^\/+/, '');
  if (!relative && index) {
    relative = index;
  } else if (pathname.endsWith('/') && index) {
    relative = `${relative}${index}`;
  }

  const segments = relative.split('/').filter(Boolean);
  if (segments.some((segment) => segment === '.' || segment === '..')) {
    return null;
  }

  return segments.join('/');
}

function getExtension(pathname: string): string {
  const index = pathname.lastIndexOf('.');
  return index >= 0 ? pathname.slice(index).toLowerCase() : '';
}

function guessContentType(pathname: string): string | undefined {
  return MIME_TYPES[getExtension(pathname)];
}

function toUint8Array(value: string | Uint8Array | ArrayBuffer): Uint8Array {
  if (typeof value === 'string') {
    return new TextEncoder().encode(value);
  }
  if (value instanceof Uint8Array) {
    return value;
  }
  return new Uint8Array(value);
}

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

function normalizeLastModified(value: string | Date | undefined): string | undefined {
  if (!value) return undefined;
  return typeof value === 'string' ? value : value.toUTCString();
}

function normalizeManifestAsset(
  pathname: string,
  asset: string | Uint8Array | ArrayBuffer | ServeStaticAsset
): ResolvedStaticAsset {
  if (
    typeof asset === 'string'
    || asset instanceof Uint8Array
    || asset instanceof ArrayBuffer
  ) {
    return {
      body: toUint8Array(asset),
      contentType: guessContentType(pathname),
    };
  }

  return {
    body: toUint8Array(asset.body),
    contentType: asset.contentType ?? guessContentType(pathname),
    etag: asset.etag,
    lastModified: normalizeLastModified(asset.lastModified),
  };
}

async function resolveManifestAsset(
  manifest: Record<string, string | Uint8Array | ArrayBuffer | ServeStaticAsset>,
  relativePath: string
): Promise<ResolvedStaticAsset | null> {
  const asset = manifest[relativePath] ?? manifest[`/${relativePath}`];
  if (!asset) return null;
  return normalizeManifestAsset(relativePath, asset);
}

async function resolveFileSystemAsset(
  root: string,
  relativePath: string
): Promise<ResolvedStaticAsset | null> {
  const [{ readFile, stat }, path] = await Promise.all([
    import('node:fs/promises'),
    import('node:path'),
  ]);

  const resolvedRoot = path.resolve(root);
  const absolutePath = path.resolve(resolvedRoot, relativePath);
  const relativeToRoot = path.relative(resolvedRoot, absolutePath);
  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    return null;
  }

  try {
    const [body, metadata] = await Promise.all([
      readFile(absolutePath),
      stat(absolutePath),
    ]);
    if (!metadata.isFile()) return null;

    return {
      body: body instanceof Uint8Array ? body : new Uint8Array(body),
      contentType: guessContentType(relativePath),
      lastModified: metadata.mtime.toUTCString(),
    };
  } catch {
    return null;
  }
}

export function serveStatic<T extends object = MiddlewareVars>(
  options: ServeStaticOptions<T>
): MiddlewareHandler<T> {
  const prefix = normalizePrefix(options.prefix);
  const index = options.index ?? 'index.html';
  const spaFallback = options.spaFallback ?? false;

  return async (context, next) => {
    const method = context.req.method.toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      await next();
      return;
    }

    const strippedPath = stripPrefix(context.url.pathname, prefix);
    if (strippedPath === null) {
      await next();
      return;
    }

    const relativePath = normalizeRelativePath(
      options.rewriteRequestPath ? options.rewriteRequestPath(strippedPath, context) : strippedPath,
      index
    );
    if (!relativePath) {
      await next();
      return;
    }

    let resolvedPath = relativePath;
    let asset = options.manifest
      ? await resolveManifestAsset(options.manifest, relativePath)
      : options.root
        ? await resolveFileSystemAsset(options.root, relativePath)
        : null;

    if (!asset && spaFallback && !getExtension(relativePath)) {
      resolvedPath = spaFallback.replace(/^\/+/, '');
      asset = options.manifest
        ? await resolveManifestAsset(options.manifest, resolvedPath)
        : options.root
          ? await resolveFileSystemAsset(options.root, resolvedPath)
          : null;
    }

    if (!asset) {
      await next();
      return;
    }

    const headers = new Headers();
    if (asset.contentType) {
      headers.set('Content-Type', asset.contentType);
    }

    const etag = asset.etag ?? `"${await sha1(toArrayBuffer(asset.body))}"`;
    if (options.etag ?? true) {
      headers.set('ETag', etag);
      if (context.req.headers.get('If-None-Match') === etag) {
        return new Response(null, { status: 304, headers });
      }
    }

    if (asset.lastModified) {
      headers.set('Last-Modified', asset.lastModified);
    }

    const cacheControl = typeof options.cacheControl === 'function'
      ? options.cacheControl(resolvedPath, context, toServeStaticAsset(asset))
      : options.cacheControl;
    if (cacheControl) {
      headers.set('Cache-Control', cacheControl);
    }

    headers.set('Content-Length', String(asset.body.byteLength));

    return new Response(method === 'HEAD' ? null : toArrayBuffer(asset.body), {
      status: 200,
      headers,
    });
  };
}

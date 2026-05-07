import type {
  EnhancedRequest,
  RequestLike,
} from './types.js';

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

const REQUEST_BODY_CACHE = new WeakMap<Request, RequestBodyCache>();
const REQUEST_WRAPPER_CACHE = new WeakMap<Request, EnhancedRequest>();

export function normalizeExtractedPathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) || '/' : pathname;
}

export function extractPathAndSearch(url: string): { pathname: string; search: string } {
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

export function createRequestFacade(request: RequestLike): EnhancedRequest {
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

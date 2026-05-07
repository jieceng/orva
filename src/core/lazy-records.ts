const MISSING_VALUE = Symbol('orva.missing');
const QUERY_PROXY_STATE = Symbol('orva.queryProxyState');
const PARAMS_PROXY_STATE = Symbol('orva.paramsProxyState');

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

export const EMPTY_PARAMS = Object.create(null) as Record<string, string>;

export function createLazyQueryRecord(search: string): Record<string, string> {
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

export function createLazyParamsRecord(raw: Record<string, string>): Record<string, string> {
  const target = Object.create(null) as LazyParamsProxyTarget;
  target[PARAMS_PROXY_STATE] = {
    raw,
    resolved: Object.create(null),
  };
  return new Proxy(target, LAZY_PARAMS_PROXY_HANDLER) as Record<string, string>;
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

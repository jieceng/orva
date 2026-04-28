export interface CookieOptions {
  domain?: string;
  path?: string;
  expires?: Date;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  partitioned?: boolean;
}

export interface DeleteCookieOptions {
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  partitioned?: boolean;
}

function decodeCookieComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseCookieHeader(header: string | null): Record<string, string> {
  if (!header) return {};

  const parsed: Record<string, string> = {};
  let start = 0;

  while (start < header.length) {
    let end = header.indexOf(';', start);
    if (end < 0) end = header.length;

    let separator = header.indexOf('=', start);
    if (separator >= 0 && separator < end) {
      while (start < separator && header.charCodeAt(start) === 32) start += 1;
      let nameEnd = separator;
      while (nameEnd > start && header.charCodeAt(nameEnd - 1) === 32) nameEnd -= 1;

      if (nameEnd > start) {
        let valueStart = separator + 1;
        while (valueStart < end && header.charCodeAt(valueStart) === 32) valueStart += 1;
        let valueEnd = end;
        while (valueEnd > valueStart && header.charCodeAt(valueEnd - 1) === 32) valueEnd -= 1;

        const rawName = header.slice(start, nameEnd);
        const rawValue = header.slice(valueStart, valueEnd);
        parsed[decodeCookieComponent(rawName)] = decodeCookieComponent(rawValue);
      }
    }

    start = end + 1;
  }

  return parsed;
}

export function getCookieFromHeader(header: string | null, name: string): string | undefined {
  if (!header) return undefined;

  let start = 0;
  while (start < header.length) {
    let end = header.indexOf(';', start);
    if (end < 0) end = header.length;

    let separator = header.indexOf('=', start);
    if (separator >= 0 && separator < end) {
      while (start < separator && header.charCodeAt(start) === 32) start += 1;
      let nameEnd = separator;
      while (nameEnd > start && header.charCodeAt(nameEnd - 1) === 32) nameEnd -= 1;

      if (nameEnd > start) {
        const candidate = decodeCookieComponent(header.slice(start, nameEnd));
        if (candidate === name) {
          let valueStart = separator + 1;
          while (valueStart < end && header.charCodeAt(valueStart) === 32) valueStart += 1;
          let valueEnd = end;
          while (valueEnd > valueStart && header.charCodeAt(valueEnd - 1) === 32) valueEnd -= 1;
          return decodeCookieComponent(header.slice(valueStart, valueEnd));
        }
      }
    }

    start = end + 1;
  }

  return undefined;
}

export function getCookie(
  input: Headers | Request | string | null,
  name: string
): string | undefined {
  const header = typeof input === 'string' || input === null
    ? input
    : input instanceof Request
      ? input.headers.get('cookie')
      : input.get('cookie');
  return getCookieFromHeader(header, name);
}

export function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): string {
  const segments = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];

  if (options.domain) segments.push(`Domain=${options.domain}`);
  segments.push(`Path=${options.path ?? '/'}`);
  if (options.expires) segments.push(`Expires=${options.expires.toUTCString()}`);
  if (typeof options.maxAge === 'number') segments.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  if (options.secure) segments.push('Secure');
  if (options.httpOnly) segments.push('HttpOnly');
  if (options.sameSite) segments.push(`SameSite=${options.sameSite}`);
  if (options.partitioned) segments.push('Partitioned');

  return segments.join('; ');
}

export function serializeDeleteCookie(
  name: string,
  options: DeleteCookieOptions = {}
): string {
  return serializeCookie(name, '', {
    ...options,
    expires: new Date(0),
    maxAge: 0,
  });
}

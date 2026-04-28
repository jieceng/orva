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

export function parseCookieHeader(header: string | null): Record<string, string> {
  if (!header) return {};

  const parsed: Record<string, string> = {};
  for (const entry of header.split(';')) {
    const index = entry.indexOf('=');
    if (index < 0) continue;

    const rawName = entry.slice(0, index).trim();
    const rawValue = entry.slice(index + 1).trim();
    if (!rawName) continue;

    try {
      parsed[decodeURIComponent(rawName)] = decodeURIComponent(rawValue);
    } catch {
      parsed[rawName] = rawValue;
    }
  }

  return parsed;
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
  return parseCookieHeader(header)[name];
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

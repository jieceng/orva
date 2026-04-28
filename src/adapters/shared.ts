export interface AdapterBinaryOptions {
  binaryContentTypes?: string[] | ((contentType: string | null) => boolean);
}

export function appendHeaderValues(
  headers: Headers,
  values?: Record<string, string | string[] | undefined> | null
): void {
  if (!values) return;

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
    } else {
      headers.append(key, value);
    }
  }
}

export function buildQueryString(values?: Record<string, string | string[] | undefined> | null): string {
  if (!values) return '';

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
    } else {
      params.append(key, value);
    }
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export function decodeRequestBody(body?: string | null, isBase64Encoded?: boolean): BodyInit | undefined {
  if (!body) return undefined;
  if (isBase64Encoded) {
    return new Uint8Array(Buffer.from(body, 'base64'));
  }
  return body;
}

export function isBinaryContentType(
  contentType: string | null,
  options: AdapterBinaryOptions = {}
): boolean {
  if (typeof options.binaryContentTypes === 'function') {
    return options.binaryContentTypes(contentType);
  }

  if (Array.isArray(options.binaryContentTypes)) {
    return options.binaryContentTypes.some((value) => contentType?.includes(value));
  }

  if (!contentType) return false;

  const normalized = contentType.toLowerCase();
  return !(
    normalized.startsWith('text/')
    || normalized.includes('json')
    || normalized.includes('xml')
    || normalized.includes('javascript')
    || normalized.includes('svg')
    || normalized.includes('form-urlencoded')
  );
}

export async function encodeResponseBody(
  response: Response,
  options: AdapterBinaryOptions = {}
): Promise<{ body: string; isBase64Encoded: boolean }> {
  const clone = response.clone();
  const contentType = clone.headers.get('content-type');

  if (!clone.body) {
    return { body: '', isBase64Encoded: false };
  }

  if (isBinaryContentType(contentType, options)) {
    const buffer = Buffer.from(await clone.arrayBuffer());
    return { body: buffer.toString('base64'), isBase64Encoded: true };
  }

  return { body: await clone.text(), isBase64Encoded: false };
}

export function headersToObject(headers: Headers): Record<string, string> {
  return Object.fromEntries(headers.entries());
}

export function getSetCookieHeaders(headers: Headers): string[] {
  const withGetSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof withGetSetCookie.getSetCookie === 'function') {
    return withGetSetCookie.getSetCookie();
  }

  const single = headers.get('set-cookie');
  return single ? [single] : [];
}

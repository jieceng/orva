import test from 'node:test';
import assert from 'node:assert/strict';

import { compress } from '../../src/middlewares/compress.ts';
import { cors } from '../../src/middlewares/cors.ts';
import { getCookie } from '../../src/middlewares/cookie.ts';
import { requestId } from '../../src/middlewares/request-id.ts';
import { secureHeaders } from '../../src/middlewares/secure-headers.ts';
import { serveStatic } from '../../src/middlewares/serve-static.ts';
import type { CompressOptions, CORSOptions, CookieOptions, RequestIdOptions, ServeStaticOptions } from '../../src/middlewares/types.ts';

test('fine-grained middleware entrypoints export callable factories and types', () => {
  const corsOptions: CORSOptions = { origin: '*' };
  const requestIdOptions: RequestIdOptions = { headerName: 'X-Req-Id' };
  const cookieOptions: CookieOptions = { httpOnly: true };
  const staticOptions: ServeStaticOptions = { root: 'public' };
  const compressOptions: CompressOptions = { threshold: 32 };

  assert.equal(typeof cors, 'function');
  assert.equal(typeof getCookie, 'function');
  assert.equal(typeof requestId, 'function');
  assert.equal(typeof serveStatic, 'function');
  assert.equal(typeof compress, 'function');
  assert.equal(typeof secureHeaders, 'function');
  assert.equal(corsOptions.origin, '*');
  assert.equal(requestIdOptions.headerName, 'X-Req-Id');
  assert.equal(cookieOptions.httpOnly, true);
  assert.equal(staticOptions.root, 'public');
  assert.equal(compressOptions.threshold, 32);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { createNano } from '../../src/index.ts';
import { serveStatic } from '../../src/middlewares/serve-static.ts';

const FIXTURE_ROOT = path.join(process.cwd(), 'test', 'fixtures', 'public');

test('serveStatic serves files from disk with content-type and etag', async () => {
  const app = createNano().use(serveStatic({ root: FIXTURE_ROOT }));

  const response = await app.fetch(new Request('https://example.com/hello.txt'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(await response.text(), 'hello static\n');

  const etag = response.headers.get('etag');
  assert.equal(typeof etag, 'string');

  const cached = await app.fetch(new Request('https://example.com/hello.txt', {
    headers: {
      'if-none-match': String(etag),
    },
  }));
  assert.equal(cached.status, 304);
});

test('serveStatic supports prefix, directory index, and manifest assets', async () => {
  const app = createNano()
    .use(serveStatic({ root: FIXTURE_ROOT, prefix: '/assets' }))
    .use(serveStatic({
      manifest: {
        'virtual/data.json': {
          body: JSON.stringify({ ok: true }),
          contentType: 'application/json; charset=utf-8',
        },
      },
    }));

  const indexResponse = await app.fetch(new Request('https://example.com/assets/'));
  assert.equal(indexResponse.status, 200);
  assert.equal(indexResponse.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.equal(await indexResponse.text(), '<h1>nano static</h1>\n');

  const manifestResponse = await app.fetch(new Request('https://example.com/virtual/data.json'));
  assert.equal(manifestResponse.status, 200);
  assert.deepEqual(await manifestResponse.json(), { ok: true });
});

test('serveStatic supports spaFallback and function cacheControl', async () => {
  const app = createNano().use(serveStatic({
    root: FIXTURE_ROOT,
    prefix: '/app',
    spaFallback: 'index.html',
    cacheControl: (pathname) => pathname.endsWith('.html')
      ? 'no-cache'
      : 'public, max-age=31536000, immutable',
  }));

  const spaResponse = await app.fetch(new Request('https://example.com/app/dashboard/settings'));
  assert.equal(spaResponse.status, 200);
  assert.equal(spaResponse.headers.get('cache-control'), 'no-cache');
  assert.equal(await spaResponse.text(), '<h1>nano static</h1>\n');

  const assetResponse = await app.fetch(new Request('https://example.com/app/hello.txt'));
  assert.equal(assetResponse.status, 200);
  assert.equal(assetResponse.headers.get('cache-control'), 'public, max-age=31536000, immutable');
});

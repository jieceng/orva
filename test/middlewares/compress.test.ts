import test from 'node:test';
import assert from 'node:assert/strict';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';

import { createOrva } from '../../src/index.ts';
import { compress } from '../../src/middlewares/compress.ts';

test('compress applies gzip to compressible responses when accepted', async () => {
  const app = createOrva()
    .use(compress({ threshold: 1 }))
    .get('/text', (c) => c.text('orva '.repeat(100)));

  const response = await app.fetch(new Request('https://example.com/text', {
    headers: {
      'accept-encoding': 'gzip',
    },
  }));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-encoding'), 'gzip');
  assert.match(response.headers.get('vary') ?? '', /Accept-Encoding/);

  const body = new Uint8Array(await response.arrayBuffer());
  const decompressed = gunzipSync(body).toString('utf-8');
  assert.equal(decompressed, 'orva '.repeat(100));
});

test('compress skips small or unsupported responses', async () => {
  const app = createOrva()
    .use(compress({ threshold: 1000 }))
    .get('/small', (c) => c.text('tiny'))
    .get('/binary', () => new Response(new Uint8Array([1, 2, 3]), {
      headers: {
        'content-type': 'application/octet-stream',
      },
    }));

  const small = await app.fetch(new Request('https://example.com/small', {
    headers: { 'accept-encoding': 'gzip' },
  }));
  assert.equal(small.headers.get('content-encoding'), null);

  const binary = await app.fetch(new Request('https://example.com/binary', {
    headers: { 'accept-encoding': 'gzip' },
  }));
  assert.equal(binary.headers.get('content-encoding'), null);
});

test('compress prefers brotli when supported by the client', async () => {
  const app = createOrva()
    .use(compress({ threshold: 1, encodings: ['br', 'gzip'] }))
    .get('/text', (c) => c.text('brotli '.repeat(100)));

  const response = await app.fetch(new Request('https://example.com/text', {
    headers: {
      'accept-encoding': 'br, gzip',
    },
  }));

  assert.equal(response.headers.get('content-encoding'), 'br');
  const body = new Uint8Array(await response.arrayBuffer());
  const decompressed = brotliDecompressSync(body).toString('utf-8');
  assert.equal(decompressed, 'brotli '.repeat(100));
});

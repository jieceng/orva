import test from 'node:test';
import assert from 'node:assert/strict';

import { createOrva } from '../../src/index.ts';
import {
  createCloudflareWorker,
  createCloudflareWorkerWithEnv,
  createPagesFunction,
} from '../../src/adapters/index.ts';

test('cloudflare adapters proxy requests to app.fetch', async () => {
  const app = createOrva();
  app.get('/edge', (c) => c.text(`edge:${c.query.from ?? 'none'}`));

  const worker = createCloudflareWorker(app);
  const workerWithEnv = createCloudflareWorkerWithEnv(app);
  const pages = createPagesFunction(app);

  const request = new Request('https://example.com/edge?from=worker');
  const ctx = {
    waitUntil() {},
    passThroughOnException() {},
  };

  const workerResponse = await worker.fetch(request, {}, ctx);
  assert.equal(await workerResponse.text(), 'edge:worker');

  const envResponse = await workerWithEnv.fetch(request, { mode: 'test' }, ctx);
  assert.equal(await envResponse.text(), 'edge:worker');

  const pagesResponse = await pages({
    request,
    env: {},
    params: {},
    next: async () => new Response('next'),
  });
  assert.equal(await pagesResponse.text(), 'edge:worker');
});

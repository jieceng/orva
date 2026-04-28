import test from 'node:test';
import assert from 'node:assert/strict';

import { createOrva } from '../../src/index.ts';
import { createAWSLambdaHandler } from '../../src/adapters/index.ts';

test('aws lambda adapter maps api gateway v2 event to orva fetch', async () => {
  const app = createOrva();

  app.post('/users/:id', async (c) => {
    const body = await c.req.json();
    return c.json({
      id: c.params.id,
      q: c.query.q ?? null,
      body,
      cookie: c.req.headers.get('cookie'),
    }, 201);
  });

  const handler = createAWSLambdaHandler(app);
  const response = await handler({
    version: '2.0',
    rawPath: '/users/42',
    rawQueryString: 'q=test',
    headers: {
      host: 'api.example.com',
      'content-type': 'application/json',
    },
    cookies: ['session=abc'],
    requestContext: {
      domainName: 'api.example.com',
      http: { method: 'POST' },
    },
    body: JSON.stringify({ name: 'orva' }),
    isBase64Encoded: false,
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.isBase64Encoded, false);
  assert.deepEqual(JSON.parse(response.body || '{}'), {
    id: '42',
    q: 'test',
    body: { name: 'orva' },
    cookie: 'session=abc',
  });
});

test('aws lambda adapter base64 encodes binary responses', async () => {
  const app = createOrva();
  app.get('/bin', () => new Response(new Uint8Array([1, 2, 3]), {
    headers: { 'content-type': 'application/octet-stream' },
  }));

  const handler = createAWSLambdaHandler(app);
  const response = await handler({
    version: '2.0',
    rawPath: '/bin',
    requestContext: {
      domainName: 'api.example.com',
      http: { method: 'GET' },
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.isBase64Encoded, true);
  assert.equal(response.body, Buffer.from([1, 2, 3]).toString('base64'));
});

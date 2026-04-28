import test from 'node:test';
import assert from 'node:assert/strict';

import { createNano } from '../src/index.ts';

test('matches static, param, wildcard routes and supports HEAD fallback', async () => {
  const app = createNano();

  app.get('/hello', (c) => c.text('world'));
  app.get('/users/:id', (c) => c.json({ id: c.params.id, q: c.query.q ?? null }));
  app.get('/files/*', (c) => c.text(c.params['*'] ?? ''));

  const hello = await app.fetch(new Request('https://example.com/hello'));
  assert.equal(hello.status, 200);
  assert.equal(await hello.text(), 'world');
  assert.equal(hello.headers.get('content-type'), 'text/plain; charset=utf-8');

  const user = await app.fetch(new Request('https://example.com/users/a%2Fb?q=42'));
  assert.equal(user.status, 200);
  assert.deepEqual(await user.json(), { id: 'a/b', q: '42' });

  const file = await app.fetch(new Request('https://example.com/files/docs/readme.md'));
  assert.equal(file.status, 200);
  assert.equal(await file.text(), 'docs/readme.md');

  const head = await app.fetch(new Request('https://example.com/hello', { method: 'HEAD' }));
  assert.equal(head.status, 200);
  assert.equal(await head.text(), 'world');
});

test('runs middleware in order and supports early responses', async () => {
  const app = createNano<{ trace: string[] }>();
  const order: string[] = [];

  app.use(async (c, next) => {
    order.push('global:before');
    c.set('trace', ['global']);
    await next();
    order.push('global:after');
  });

  app.get(
    '/ok',
    async (c, next) => {
      order.push('route:before');
      c.get('trace')?.push('route');
      await next();
      order.push('route:after');
    },
    (c) => {
      order.push('handler');
      return c.json({ trace: c.get('trace') });
    }
  );

  const ok = await app.fetch(new Request('https://example.com/ok'));
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), { trace: ['global', 'route'] });
  assert.deepEqual(order, [
    'global:before',
    'route:before',
    'handler',
    'route:after',
    'global:after',
  ]);

  app.get(
    '/blocked',
    () => {
      order.push('blocked');
      return new Response('blocked', { status: 401 });
    },
    () => {
      throw new Error('should not run');
    }
  );

  const blocked = await app.fetch(new Request('https://example.com/blocked'));
  assert.equal(blocked.status, 401);
  assert.equal(await blocked.text(), 'blocked');
  assert.equal(order.includes('should not run'), false);
});

test('applies grouped prefixes and inherited middleware', async () => {
  const app = createNano<{ scope: string[] }>();

  app.use(async (c, next) => {
    c.set('scope', ['root']);
    await next();
  });

  app.group('/api', (group) => {
    group.use(async (c, next) => {
      c.get('scope')?.push('api');
      await next();
    });

    group.get('/items/:id', (c) => c.json({ id: c.params.id, scope: c.get('scope') }));
  });

  const response = await app.fetch(new Request('https://example.com/api/items/99'));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id: '99', scope: ['root', 'api'] });
});

test('supports custom notFound and onError handlers', async () => {
  const app = createNano();

  app.notFound((c) => c.text('missing', 404));
  app.onError((err, c) => c.json({ message: err.message }, 500));
  app.get('/boom', () => {
    throw new Error('boom');
  });

  const missing = await app.fetch(new Request('https://example.com/missing'));
  assert.equal(missing.status, 404);
  assert.equal(await missing.text(), 'missing');

  const boom = await app.fetch(new Request('https://example.com/boom'));
  assert.equal(boom.status, 500);
  assert.deepEqual(await boom.json(), { message: 'boom' });
});

test('caches parsed request bodies and exposes response helpers', async () => {
  const app = createNano();

  app.post('/body', async (c) => {
    const first = await c.req.json();
    const second = await c.req.json();
    return c.json({ sameReference: first === second, payload: first });
  });

  app.get('/html', (c) => c.html('<h1>nano</h1>'));
  app.get('/jump', (c) => c.redirect('/target', 307));
  app.get('/download', (c) => c.download(['hello ', 'nano'], 'file name.txt'));

  const body = await app.fetch(new Request('https://example.com/body', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  }));
  assert.equal(body.status, 200);
  assert.deepEqual(await body.json(), {
    sameReference: true,
    payload: { ok: true },
  });

  const html = await app.fetch(new Request('https://example.com/html'));
  assert.equal(html.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.equal(await html.text(), '<h1>nano</h1>');

  const redirect = await app.fetch(new Request('https://example.com/jump'));
  assert.equal(redirect.status, 307);
  assert.equal(redirect.headers.get('location'), '/target');

  const download = await app.fetch(new Request('https://example.com/download'));
  assert.equal(download.status, 200);
  assert.equal(download.headers.get('content-type'), 'application/octet-stream');
  assert.equal(
    download.headers.get('content-disposition'),
    'attachment; filename="file%20name.txt"'
  );
  assert.equal(await download.text(), 'hello nano');
});

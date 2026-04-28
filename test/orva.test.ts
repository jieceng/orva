import test from 'node:test';
import assert from 'node:assert/strict';

import { createOrva } from '../src/index.ts';

test('matches static, param, wildcard routes and supports HEAD fallback', async () => {
  const app = createOrva();

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
  const app = createOrva<{ trace: string[] }>();
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

test('middleware pipeline rejects multiple next calls', async () => {
  const app = createOrva();

  app.onError((err, c) => c.json({ message: err.message }, 500));
  app.get(
    '/double-next',
    async (_c, next) => {
      await next();
      await next();
    },
    (c) => c.text('ok'),
  );

  const response = await app.fetch(new Request('https://example.com/double-next'));
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { message: 'next() called multiple times' });
});

test('applies grouped prefixes and inherited middleware', async () => {
  const app = createOrva<{ scope: string[] }>();

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
  const app = createOrva();

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
  const app = createOrva();

  app.post('/body', async (c) => {
    const first = await c.req.json();
    const second = await c.req.json();
    return c.json({ sameReference: first === second, payload: first });
  });

  app.get('/html', (c) => c.html('<h1>orva</h1>'));
  app.get('/jump', (c) => c.redirect('/target', 307));
  app.get('/download', (c) => c.download(['hello ', 'orva'], 'file name.txt'));

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
  assert.equal(await html.text(), '<h1>orva</h1>');

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
  assert.equal(await download.text(), 'hello orva');
});

test('fast responses still support response finalizers and multiple cookies', async () => {
  const app = createOrva();

  app.use(async (c, next) => {
    c.after((response) => {
      response.headers.set('x-after', 'applied');
      return response;
    });
    await next();
  });

  app.get('/fast', (c) => {
    c.setCookie('theme', 'dark', { path: '/' });
    c.setCookie('session', 'abc', { httpOnly: true, path: '/' });
    return c.json({ ok: true });
  });

  const response = await app.fetch(new Request('https://example.com/fast'));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(response.headers.get('x-after'), 'applied');

  const setCookies = response.headers.getSetCookie();
  assert.equal(setCookies.length, 2);
  assert.match(setCookies[0], /theme=dark/);
  assert.match(setCookies[1], /session=abc/);
});

test('early fast responses still run upstream finalizers', async () => {
  const app = createOrva();

  app.use(async (c, next) => {
    c.after((response) => {
      response.headers.set('x-upstream', 'true');
      return response;
    });
    await next();
  });

  app.get(
    '/early-fast',
    () => new Response('blocked', { status: 401 }),
    () => {
      throw new Error('should not run');
    },
  );

  app.get(
    '/early-fast-context',
    (c) => c.text('blocked', 401),
    () => {
      throw new Error('should not run');
    },
  );

  const nativeBlocked = await app.fetch(new Request('https://example.com/early-fast'));
  assert.equal(nativeBlocked.status, 401);
  assert.equal(nativeBlocked.headers.get('x-upstream'), 'true');

  const contextBlocked = await app.fetch(new Request('https://example.com/early-fast-context'));
  assert.equal(contextBlocked.status, 401);
  assert.equal(await contextBlocked.text(), 'blocked');
  assert.equal(contextBlocked.headers.get('x-upstream'), 'true');
});

test('query and params stay lazily decoded until accessed', async () => {
  const app = createOrva();

  app.get('/lazy/:id/:bad', (c) => c.json({
    id: c.params.id,
    q: c.query.q,
  }));

  const response = await app.fetch(new Request('https://example.com/lazy/a%2Fb/%E0%A4%A?q=42&broken=%E0%A4%A'));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    id: 'a/b',
    q: '42',
  });
});

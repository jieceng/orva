import test from 'node:test';
import assert from 'node:assert/strict';

import { createRPC } from '../../src/rpc/index.ts';

test('createRPC builds url, query, headers and json body', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];

  const rpc = createRPC({
    baseURL: 'https://api.example.com',
    headers: { authorization: 'Bearer base' },
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    },
  });

  const result = await rpc.users[':id'].$post({
    param: { id: 'a/b' },
    query: { page: '2', filter: 'yes' },
    headers: { 'x-trace': '1' },
    body: { name: 'orva' },
  });

  assert.deepEqual(result, { ok: true });
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    'https://api.example.com/users/a%2Fb?page=2&filter=yes'
  );
  assert.equal(calls[0].init?.method, 'POST');

  const headers = new Headers(calls[0].init?.headers);
  assert.equal(headers.get('authorization'), 'Bearer base');
  assert.equal(headers.get('x-trace'), '1');
  assert.equal(headers.get('content-type'), 'application/json');
  assert.equal(calls[0].init?.body, JSON.stringify({ name: 'orva' }));
});

test('createRPC preserves FormData and throws on non-ok responses', async () => {
  const form = new FormData();
  form.set('file', 'orva');

  const rpc = createRPC({
    baseURL: 'https://api.example.com',
    fetch: async (_url, init) => {
      assert.equal(init?.body, form);
      const headers = new Headers(init?.headers);
      assert.equal(headers.get('content-type'), null);
      return new Response('bad request', { status: 400 });
    },
  });

  await assert.rejects(
    rpc.upload.$post({ body: form }),
    /RPC Error 400: bad request/
  );
});

test('createRPC can serialize cookies into the cookie header', async () => {
  const rpc = createRPC({
    baseURL: 'https://api.example.com',
    fetch: async (_url, init) => {
      const headers = new Headers(init?.headers);
      assert.equal(headers.get('cookie'), 'session=abc123; theme=dark');
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  const result = await rpc.profile.$get({
    cookie: {
      session: 'abc123',
      theme: 'dark',
    },
  });

  assert.deepEqual(result, { ok: true });
});

test('createRPC serializes body according to explicit content-type', async () => {
  const calls: Array<{ init?: RequestInit }> = [];

  const rpc = createRPC({
    baseURL: 'https://api.example.com',
    fetch: async (_url, init) => {
      calls.push({ init });
      return new Response('ok', {
        status: 200,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    },
  });

  await rpc.forms.$post({
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: { a: '1', b: 'two' },
  });
  await rpc.notes.$post({
    headers: { 'content-type': 'text/plain; charset=utf-8' },
    body: 123,
  });

  const formHeaders = new Headers(calls[0]?.init?.headers);
  assert.equal(formHeaders.get('content-type'), 'application/x-www-form-urlencoded');
  assert.equal(String(calls[0]?.init?.body), 'a=1&b=two');

  const textHeaders = new Headers(calls[1]?.init?.headers);
  assert.equal(textHeaders.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(calls[1]?.init?.body, '123');
});

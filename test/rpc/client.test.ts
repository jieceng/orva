import test from 'node:test';
import assert from 'node:assert/strict';

import type { Orva, RouteDefinition } from '../../src/index.ts';
import { createRPC } from '../../src/rpc/index.ts';

type AppWithRoutes<Routes extends Record<string, RouteDefinition>> = Orva<any, any, Routes, any>;

test('createRPC builds url, query, headers and json body', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  type App = AppWithRoutes<{
    'POST /users/:id': RouteDefinition<
      '/users/:id',
      'POST',
      {
        param: { id: string };
        query: { page: string; filter: string };
        headers?: { 'x-trace': string };
        body: { name: string };
      },
      { ok: boolean }
    >;
  }>;

  const rpc = createRPC<App>({
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

  const response = await rpc.users[':id'].$post({
    param: { id: 'a/b' },
    query: { page: '2', filter: 'yes' },
    headers: { 'x-trace': '1' },
    body: { name: 'orva' },
  });

  assert.equal(response.status, 200);
  assert.equal(response.ok, true);
  assert.deepEqual(await response.value(), { ok: true });
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

test('createRPC preserves FormData and returns typed non-ok responses', async () => {
  const form = new FormData();
  form.set('file', 'orva');
  type App = AppWithRoutes<{
    'POST /upload': RouteDefinition<
      '/upload',
      'POST',
      { body: FormData },
      string
    >;
  }>;

  const rpc = createRPC<App>({
    baseURL: 'https://api.example.com',
    fetch: async (_url, init) => {
      assert.equal(init?.body, form);
      const headers = new Headers(init?.headers);
      assert.equal(headers.get('content-type'), null);
      return new Response('bad request', { status: 400 });
    },
  });

  const response = await rpc.upload.$post({ body: form });
  assert.equal(response.status, 400);
  assert.equal(response.ok, false);
  assert.equal(await response.text(), 'bad request');
});

test('createRPC can serialize cookies into the cookie header', async () => {
  type App = AppWithRoutes<{
    'GET /profile': RouteDefinition<
      '/profile',
      'GET',
      { cookie?: { session: string; theme: string } },
      { ok: boolean }
    >;
  }>;

  const rpc = createRPC<App>({
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

  const response = await rpc.profile.$get({
    cookie: {
      session: 'abc123',
      theme: 'dark',
    },
  });

  assert.deepEqual(await response.value(), { ok: true });
});

test('createRPC serializes body according to explicit content-type', async () => {
  const calls: Array<{ init?: RequestInit }> = [];
  type App = AppWithRoutes<{
    'POST /forms': RouteDefinition<
      '/forms',
      'POST',
      {
        headers?: { 'content-type': 'application/x-www-form-urlencoded' };
        body: Record<string, string>;
      },
      string
    >;
    'POST /notes': RouteDefinition<
      '/notes',
      'POST',
      {
        headers?: { 'content-type': 'text/plain; charset=utf-8' };
        body: string;
      },
      string
    >;
  }>;

  const rpc = createRPC<App>({
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
    body: '123',
  });

  const formHeaders = new Headers(calls[0]?.init?.headers);
  assert.equal(formHeaders.get('content-type'), 'application/x-www-form-urlencoded');
  assert.equal(String(calls[0]?.init?.body), 'a=1&b=two');

  const textHeaders = new Headers(calls[1]?.init?.headers);
  assert.equal(textHeaders.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(calls[1]?.init?.body, '123');
});

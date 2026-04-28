import test from 'node:test';
import assert from 'node:assert/strict';

import { createOrva } from '../../src/index.ts';
import {
  getCookie,
  parseCookieHeader,
  serializeCookie,
  serializeDeleteCookie,
} from '../../src/middlewares/cookie.ts';

test('cookie helpers parse, serialize, and mutate response cookies', async () => {
  const app = createOrva();

  app.get('/cookies', (c) => {
    const session = c.cookie('session');
    const cookies = c.cookies();
    c.setCookie('theme', 'dark', { httpOnly: true, sameSite: 'Lax', path: '/' });
    c.deleteCookie('legacy', { path: '/' });
    return c.json({ session, cookies });
  });

  const response = await app.fetch(new Request('https://example.com/cookies', {
    headers: {
      cookie: 'session=abc123; theme=light',
    },
  }));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    session: 'abc123',
    cookies: {
      session: 'abc123',
      theme: 'light',
    },
  });

  const setCookie = response.headers.get('set-cookie') ?? '';
  assert.match(setCookie, /theme=dark/);
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /legacy=/);
  assert.match(setCookie, /Max-Age=0/);
});

test('cookie utility functions support direct header access', () => {
  const headers = new Headers({
    cookie: 'a=1; hello=world',
  });

  assert.deepEqual(parseCookieHeader(headers.get('cookie')), { a: '1', hello: 'world' });
  assert.equal(getCookie(headers, 'hello'), 'world');
  assert.match(serializeCookie('token', 'abc', { secure: true, sameSite: 'None' }), /token=abc/);
  assert.match(serializeDeleteCookie('token', { path: '/' }), /Expires=/);
});

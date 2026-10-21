import test, { beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { authFetch } from '../src/utils/api.ts';

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
let storedUser;
let unauthorizedCount;
beforeEach(() => {
  storedUser = JSON.stringify({ token: 'test-session' });
  unauthorizedCount = 0;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => storedUser } });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: new EventTarget() });
  window.addEventListener('auth:unauthorized', () => { unauthorizedCount++; });
});
afterEach(() => {
  mock.restoreAll();
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete globalThis.localStorage;
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else delete globalThis.window;
});

test('auth requests preserve object, tuple, and Headers overrides', async () => {
  for (const headers of [{ 'X-Request': 'test' }, [['X-Request', 'test']], new Headers({ 'X-Request': 'test' })]) {
    mock.method(globalThis, 'fetch', async (_url, options) => {
      assert.equal(options.headers.get('Authorization'), 'Bearer test-session');
      assert.equal(options.headers.get('X-Request'), 'test');
      return new Response('{}');
    });
    await authFetch('/api/test', { headers });
    mock.restoreAll();
  }
});

test('a 401 for the current session triggers sign-out', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('', { status: 401 }));
  const response = await authFetch('/api/auth/profile');
  assert.equal(response.status, 401);
  assert.equal(unauthorizedCount, 1);
});

test('a delayed 401 from an old session does not sign out the new user', async () => {
  let finish;
  mock.method(globalThis, 'fetch', () => new Promise((resolve) => { finish = resolve; }));
  const request = authFetch('/api/test');
  storedUser = JSON.stringify({ token: 'new-test-session' });
  finish(new Response('', { status: 401 }));
  await request;
  assert.equal(unauthorizedCount, 0);
});

test('anonymous and corrupt stored sessions do not trigger unrelated sign-outs', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('', { status: 401 }));
  for (const value of [null, '{bad json']) {
    storedUser = value;
    await authFetch('/api/test');
  }
  assert.equal(unauthorizedCount, 0);
});

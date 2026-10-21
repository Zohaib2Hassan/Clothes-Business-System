import test, { afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import User from '../server/models/User.js';
import { verify2FA, resend2FACode } from '../server/controllers/authController.js';

afterEach(() => mock.restoreAll());
const token = (purpose = '2fa_login', expiresIn = '10m') => jwt.sign(
  { id: 'test-user', purpose }, process.env.JWT_SECRET || 'secret', { expiresIn },
);
function response() {
  return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

test('email alone cannot verify or resend a sign-in code', async () => {
  const lookup = mock.method(User, 'findOne', () => { throw new Error('Password session required'); });
  for (const handler of [verify2FA, resend2FACode]) {
    const res = response();
    await handler({ body: { email: 'test@example.invalid', code: '123456' } }, res);
    assert.equal(res.statusCode, 401);
  }
  assert.equal(lookup.mock.callCount(), 0);
});

test('expired and non-login tokens cannot verify or resend codes', async () => {
  for (const handler of [verify2FA, resend2FACode]) {
    for (const tempToken of [token('access'), token('2fa_login', -1)]) {
      const res = response();
      await handler({ body: { code: '456789', tempToken } }, res);
      assert.equal(res.statusCode, 401);
    }
  }
});

test('the old fixed code and expired codes are rejected', async () => {
  const user = { twoFactorEnabled: true, twoFactorCode: '456789', twoFactorCodeExpires: new Date(Date.now() + 60000) };
  mock.method(User, 'findById', async () => user);
  const res = response();
  await verify2FA({ body: { code: '123456', tempToken: token() } }, res);
  assert.equal(res.statusCode, 400);
  user.twoFactorCodeExpires = new Date(Date.now() - 1000);
  await verify2FA({ body: { code: '456789', tempToken: token() } }, res);
  assert.equal(res.statusCode, 400);
});

test('a valid password session and matching current code sign in once', async () => {
  const user = { _id: 'test-user', name: 'Test', email: 'test@example.invalid', twoFactorEnabled: true,
    twoFactorCode: '456789', twoFactorCodeExpires: new Date(Date.now() + 60000), save: async () => {} };
  mock.method(User, 'findById', async () => user);
  const req = { body: { code: '456789', tempToken: token() } };
  const res = response();
  await verify2FA(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body._id, 'test-user');
  assert.ok(res.body.token);
  assert.equal(user.twoFactorCode, '');
  assert.equal(user.twoFactorCodeExpires, null);
  const retry = response();
  await verify2FA(req, retry);
  assert.equal(retry.statusCode, 400);
});

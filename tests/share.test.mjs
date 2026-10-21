import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createShareApp } from '../scripts/shareServer.js';

test('public sharing serves only the build, supports routes, and preserves API bodies and status', async () => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'threadly-share-test-'));
  const distDirectory = path.join(temporaryDirectory, 'dist');
  await mkdir(distDirectory);
  await writeFile(path.join(distDirectory, 'index.html'), '<html>Threadly test</html>');
  await writeFile(path.join(temporaryDirectory, '.env'), 'PRIVATE_TEST_VALUE=do-not-serve');
  const backend = http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ method: req.method, path: req.url, body }));
  });
  let server;
  try {
    await new Promise((resolve) => backend.listen(0, '127.0.0.1', resolve));
    server = createShareApp({ distDirectory, backendPort: backend.address().port }).listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const page = await fetch(`${base}/login`);
    assert.equal(page.status, 200);
    assert.equal(await page.text(), '<html>Threadly test</html>');
    for (const file of ['/.env', '/server/server.js', '/src/main.tsx', '/package.json']) {
      assert.equal((await fetch(base + file)).status, 404);
    }
    const response = await fetch(`${base}/api/auth/login?test=1`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"test":true}' });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { method: 'POST', path: '/api/auth/login?test=1', body: '{"test":true}' });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await new Promise((resolve) => backend.close(resolve));
    assert.ok(path.resolve(temporaryDirectory).startsWith(path.resolve(tmpdir()) + path.sep));
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});

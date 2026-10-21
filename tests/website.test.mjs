import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import path from 'node:path';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { websiteRouter } from '../server/middleware/website.js';

test('Docker web routes serve the client without masking API errors or exposing project files', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'threadly-website-test-'));
  await writeFile(path.join(directory, 'index.html'), '<html>Docker client</html>');
  await writeFile(path.join(directory, 'app.js'), 'console.log("client")');
  const app = express();
  app.get('/api', (_req, res) => res.json({ status: 'ok' }));
  app.use(websiteRouter(directory));
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const route of ['/', '/login', '/products/add']) {
      const response = await fetch(base + route);
      assert.equal(response.status, 200);
      assert.equal(await response.text(), '<html>Docker client</html>');
    }
    assert.deepEqual(await (await fetch(base + '/api')).json(), { status: 'ok' });
    for (const route of ['/api/not-found', '/.env', '/server/server.js', '/src/main.tsx']) {
      assert.equal((await fetch(base + route)).status, 404);
    }
    assert.equal((await fetch(base + '/app.js')).status, 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    assert.ok(path.resolve(directory).startsWith(path.resolve(tmpdir()) + path.sep));
    await rm(directory, { recursive: true, force: true });
  }
});

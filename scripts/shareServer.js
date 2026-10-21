import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';

const projectDirectory = fileURLToPath(new URL('../', import.meta.url));

export function createShareApp({
  distDirectory = path.join(projectDirectory, 'dist'),
  backendPort = 5000,
} = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  // Keep API calls on the same public origin as the built website.
  app.use('/api', (req, res) => {
    const upstream = http.request({
      hostname: '127.0.0.1',
      port: backendPort,
      path: req.originalUrl,
      method: req.method,
      headers: { ...req.headers, host: `127.0.0.1:${backendPort}` },
    }, (response) => {
      res.writeHead(response.statusCode, response.headers);
      response.pipe(res);
    });
    upstream.setTimeout(120000, () => upstream.destroy(new Error('API request timed out')));
    upstream.on('error', () => {
      if (!res.headersSent) res.status(502).json({ message: 'The app server is unavailable. Please try again shortly.' });
      else res.destroy();
    });
    req.on('aborted', () => upstream.destroy());
    res.on('close', () => upstream.destroy());
    req.pipe(upstream);
  });

  // Only the compiled website is public; the project directory is never served.
  app.use(express.static(distDirectory, { dotfiles: 'deny', index: false }));
  app.get('/{*path}', (req, res) => {
    if (path.extname(req.path) || req.path.split('/').some((segment) => segment.startsWith('.'))) return res.sendStatus(404);
    res.setHeader('Cache-Control', 'no-store');
    return res.sendFile(path.join(distDirectory, 'index.html'));
  });
  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!existsSync(path.join(projectDirectory, 'dist/index.html'))) {
    console.error('Build the website first with npm run build.');
    process.exit(1);
  }
  const port = Number(process.env.SHARE_PORT || 4173);
  createShareApp({ backendPort: Number(process.env.PORT || 5000) })
    .listen(port, '127.0.0.1', () => console.log(`Share server ready at http://127.0.0.1:${port}`))
    .on('error', (error) => { console.error(error.message); process.exitCode = 1; });
}

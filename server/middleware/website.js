import express from 'express';
import path from 'node:path';

// Serve built client routes on the API's origin when running the Docker image.
export function websiteRouter(distDirectory) {
  const router = express.Router();
  router.use(express.static(distDirectory, { index: false, dotfiles: 'deny' }));
  router.get('/{*path}', (req, res) => {
    if (req.path === '/api' || req.path.startsWith('/api/') || path.extname(req.path)
      || req.path.split('/').some((segment) => segment.startsWith('.'))) {
      return res.sendStatus(404);
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.sendFile(path.join(distDirectory, 'index.html'));
  });
  return router;
}

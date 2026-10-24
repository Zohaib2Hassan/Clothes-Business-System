import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

// Check the real `eas build:inspect --stage archive` result, not just local files.
const output = process.argv[2];
if (!output) throw new Error('Usage: node scripts/verify-archive.mjs <archive-directory>');
const root = path.resolve(output);
const config = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
const required = ['package.json', 'package-lock.json', 'app.json', 'eas.json', 'tsconfig.json', 'src/app/_layout.tsx', 'src/app/index.tsx', 'src/app/(tabs)/_layout.tsx', ...['home','stock','sell','ledger','more'].map((tab) => `src/app/(tabs)/${tab}.tsx`), 'src/domain/shop.ts', 'src/data/ShopContext.tsx', 'src/data/files.ts', config.icon, config.android.adaptiveIcon.foregroundImage, config.web.favicon];
for (const entry of fs.readdirSync('src', { recursive: true, withFileTypes: true }).filter((item) => item.isFile())) {
  const relative = path.relative(process.cwd(), path.join(entry.parentPath, entry.name)).replaceAll('\\', '/');
  if (!required.includes(relative)) required.push(relative);
}
for (const relative of required) {
  const file = path.resolve(root, relative);
  assert.ok(file.startsWith(root + path.sep), `Asset must stay inside archive: ${relative}`);
  assert.ok(fs.statSync(file).isFile(), `Missing build input: ${relative}`);
  const actual = fs.readFileSync(file);
  const original = fs.readFileSync(path.resolve(relative));
  assert.equal(createHash('sha256').update(actual).digest('hex'), createHash('sha256').update(original).digest('hex'), `Stale build input: ${relative}`);
}
const all = fs.readdirSync(root, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile());
for (const entry of all) {
  const relative = path.relative(root, path.join(entry.parentPath, entry.name)).replaceAll('\\', '/');
  assert.ok(required.includes(relative) || relative.startsWith('src/') || ['assets/icon.png','assets/adaptive-icon.png','assets/favicon.png'].includes(relative), `Unexpected upload file: ${relative}`);
  assert.ok(!/(^|\/)(\.env(?:\.|$)|credentials(?:\/|\.json)|node_modules\/|artifacts\/|\.git\/)/.test(relative), `Private/generated file in archive: ${relative}`);
}
console.log(`Archive verified: ${all.length} files; app source and all configured icons match the workspace. No credentials, local records or dependencies included.`);

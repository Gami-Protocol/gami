#!/usr/bin/env node
/**
 * Serves dist/ the way Vercel serves it in production, by reading the real
 * vercel.json rewrites rather than reimplementing them. That means the
 * compliance gate exercises the actual routing config: if someone deletes the
 * 410 rewrites, the gate fails instead of quietly passing against a dev server
 * that never had them.
 *
 * Usage: node scripts/preview-server.mjs [port]
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, '..');
const repoRoot = join(webRoot, '..');
const dist = join(webRoot, 'dist');
const port = Number(process.argv[2] ?? 4173);

const vercel = JSON.parse(readFileSync(join(repoRoot, 'vercel.json'), 'utf8'));
const gone = (await import(pathToFileURL(join(repoRoot, 'api', 'gone.js')).href)).default;

/** Vercel path syntax -> RegExp. Supports :param* and bare regex groups. */
function toRegExp(source) {
  if (source.startsWith('/(') || source.includes('(?!')) return new RegExp(`^${source}$`);
  return new RegExp(`^${source.replace(/:[A-Za-z]+\*/g, '.*')}$`);
}
const rewrites = (vercel.rewrites ?? []).map((r) => ({ ...r, re: toRegExp(r.source) }));

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

function sendFile(res, file) {
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}

createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);

  const direct = join(dist, pathname);
  if (pathname !== '/' && existsSync(direct) && statSync(direct).isFile()) {
    return sendFile(res, direct);
  }

  for (const rule of rewrites) {
    if (!rule.re.test(pathname)) continue;
    if (rule.destination === '/api/gone') return gone(req, res);
    if (rule.destination === '/index.html') return sendFile(res, join(dist, 'index.html'));
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
}).listen(port, '127.0.0.1', () => {
  console.log(`preview server on http://127.0.0.1:${port} (vercel.json rewrites applied)`);
});

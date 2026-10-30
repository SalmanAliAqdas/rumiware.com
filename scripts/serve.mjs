import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const {redirectFor}=createRequire(import.meta.url)('./routes.cjs');

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const site = JSON.parse(await readFile(new URL('../src/data/site.json', import.meta.url), 'utf8'));
if (!site.previewPath.startsWith('/') || !site.previewPath.endsWith('/')) throw new Error('previewPath must start and end with /');
const previewMount = site.previewPath.slice(0, -1);
const types = { '.htm': 'text/html; charset=utf-8', '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp':'image/webp', '.woff2':'font/woff2', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain' };
const port = Number(process.env.PORT || 4174);
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  // Test-owned servers can shut down without relying on Windows process-tree signals.
  // Ordinary previews never enable this route.
  if (process.argv.includes('--qa') && req.method === 'POST' && url.pathname === '/__qa_stop') {
    res.writeHead(200).end('Stopping test preview');
    setImmediate(() => { server.close(); server.closeAllConnections(); }); return;
  }
  let path;
  try { path = decodeURIComponent(url.pathname); } catch { res.writeHead(400).end(); return; }
  if (path.startsWith(site.previewPath)) path = path.slice(previewMount.length);
  // Regression-only compatibility URL. It is never written into published dist/.
  if (process.argv.includes('--qa') && path === '/get-quote-preview.html') {
    const source = await readFile(resolve(root,'get-quote/index.html'),'utf8');
    res.writeHead(200,{'Content-Type':types['.html']});res.end(source.replace('<head>','<head><meta name="robots" content="noindex">'));return;
  }
  // Local model of the explicit redirect map. This does not execute .htaccess.
  const redirect=redirectFor(path);
  if(redirect!==null){const mount=url.pathname.startsWith(site.previewPath)?previewMount:'';res.writeHead(301,{Location:mount+redirect+url.search}).end();return;}
  if (path.endsWith('/')) path += 'index.html';
  const file = resolve(root, '.' + path);
  const relative = file.slice(root.length).replaceAll('\\', '/');
  const publicFile = !relative.includes('..') && !relative.split('/').some(p => p.startsWith('.')) &&
    (!relative.includes('/') || relative.startsWith('images/') || /^(?:[a-z0-9-]+\/)+index\.html$/.test(relative)) && types[extname(file)];
  try {
    if (!file.startsWith(root) || !publicFile || !(await stat(file)).isFile()) throw new Error('missing');
    res.writeHead(200, { 'Content-Type': types[extname(file)] }); res.end(await readFile(file));
  } catch {
    res.writeHead(404, { 'Content-Type': types['.html'] }); res.end(await readFile(resolve(root, '404.html')));
  }
});
server.listen(port, '127.0.0.1', () => process.stdout.write(`Rumiware preview: http://127.0.0.1:${port}\nRoot and /rumiware.com/ hosting enabled; missing routes return 404.\n`));

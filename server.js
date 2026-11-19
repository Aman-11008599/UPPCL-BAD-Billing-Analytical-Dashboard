// UPPCL Spot Billing Dashboard - office server
// Requires Node.js 16 or newer (no other packages needed).
//
// Start:  node server.js
// Open:   http://localhost:8080 on this PC
//         http://<this-PC-IP>:8080 from any other computer on the office network
//
// Keep UPPCL_Spot_Billing_Dashboard.html in the same folder as this file.
// Reports are saved as one JSON file per report date in ./data/snapshots/

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data', 'snapshots');
const PAGE = path.join(ROOT, 'UPPCL_Spot_Billing_Dashboard.html');
const MAX_BODY = 20 * 1024 * 1024;               // 20 MB per request
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

fs.mkdirSync(DATA_DIR, { recursive: true });

function send(res, code, body, type) {
  const isRaw = Buffer.isBuffer(body) || typeof body === 'string';
  res.writeHead(code, { 'Content-Type': type || 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(isRaw ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('Payload too large')); req.destroy(); }
      else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function listSnapshots() {
  const out = {};
  const files = await fs.promises.readdir(DATA_DIR).catch(() => []);
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    const date = f.slice(0, -5);
    if (!DATE_RE.test(date)) continue;
    try {
      out[date] = JSON.parse(await fs.promises.readFile(path.join(DATA_DIR, f), 'utf8'));
    } catch (e) {
      console.error('Skipping unreadable file', f, e.message);
    }
  }
  return out;
}

async function saveSnapshot(date, obj) {
  const file = path.join(DATA_DIR, date + '.json');
  const tmp = file + '.tmp';
  await fs.promises.writeFile(tmp, JSON.stringify(obj));
  await fs.promises.rename(tmp, file);           // atomic replace, so a crash never leaves half a file
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const p = url.pathname;

    if (req.method === 'GET' && (p === '/' || p === '/index.html')) {
      return send(res, 200, await fs.promises.readFile(PAGE), 'text/html; charset=utf-8');
    }
    if (req.method === 'GET' && p === '/api/snapshots') {
      return send(res, 200, await listSnapshots());
    }
    const m = p.match(/^\/api\/snapshots\/(\d{4}-\d{2}-\d{2})$/);
    if (m) {
      const date = m[1];
      if (req.method === 'PUT') {
        const obj = JSON.parse(await readBody(req));
        if (!obj || obj.date !== date) return send(res, 400, { error: 'date in body does not match URL' });
        await saveSnapshot(date, obj);
        return send(res, 200, { ok: true });
      }
      if (req.method === 'DELETE') {
        await fs.promises.unlink(path.join(DATA_DIR, date + '.json')).catch(() => {});
        return send(res, 200, { ok: true });
      }
    }
    send(res, 404, { error: 'not found' });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: e.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`UPPCL Spot Billing Dashboard running on port ${PORT}`);
  console.log(`On this PC:            http://localhost:${PORT}`);
  console.log(`From other computers:  http://<this-PC-IP>:${PORT}`);
});

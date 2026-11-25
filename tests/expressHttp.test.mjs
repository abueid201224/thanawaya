import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as http from 'node:http';
import { createExpressApp, startEmbeddedServer } from '../server/app.ts';

function requestHttp({ port, path, method = 'GET', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const payload = body !== null ? JSON.stringify(body) : null;
    const reqHeaders = { ...headers };
    if (payload !== null) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = String(Buffer.byteLength(payload));
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: reqHeaders
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: raw
          });
        });
      }
    );
    req.on('error', reject);
    if (payload !== null) req.write(payload);
    req.end();
  });
}

test('real HTTP: loopbackOnly middleware enforces Host, Origin, security headers, and API validation', async (t) => {
  const running = await startEmbeddedServer({
    host: '127.0.0.1',
    preferredPort: 47910,
    loopbackOnly: true,
    initialApiKey: ''
  });
  t.after(async () => {
    await running.close();
  });

  // 1. DNS rebinding Host header rejected over real TCP/HTTP
  const badHost = await requestHttp({
    port: running.port,
    path: '/api/health',
    headers: { Host: `evil.com:${running.port}` }
  });
  assert.equal(badHost.statusCode, 403);
  assert.match(badHost.body, /unexpected Host header/);

  // 2. Cross-origin Origin header rejected
  const badOrigin = await requestHttp({
    port: running.port,
    path: '/api/key-status',
    headers: {
      Host: `127.0.0.1:${running.port}`,
      Origin: 'https://attacker.example'
    }
  });
  assert.equal(badOrigin.statusCode, 403);
  assert.match(badOrigin.body, /cross-origin/);

  // 3. Valid loopback Host + Origin succeeds and includes hardening headers
  const okHealth = await requestHttp({
    port: running.port,
    path: '/api/health',
    headers: {
      Host: `localhost:${running.port}`,
      Origin: `http://localhost:${running.port}`
    }
  });
  assert.equal(okHealth.statusCode, 200);
  assert.equal(okHealth.headers['x-frame-options'], 'DENY');
  assert.equal(okHealth.headers['x-content-type-options'], 'nosniff');
  assert.equal(okHealth.headers['referrer-policy'], 'no-referrer');
  const healthJson = JSON.parse(okHealth.body);
  assert.equal(healthJson.status, 'ok');
  assert.equal(healthJson.hasGeminiKey, false);

  // 4. Model config endpoint validates regex over real HTTP
  const badModel = await requestHttp({
    port: running.port,
    path: '/api/model-config',
    method: 'POST',
    headers: { Host: `127.0.0.1:${running.port}` },
    body: { model: 'invalid model with spaces!' }
  });
  assert.equal(badModel.statusCode, 400);

  const okModel = await requestHttp({
    port: running.port,
    path: '/api/model-config',
    method: 'POST',
    headers: { Host: `127.0.0.1:${running.port}` },
    body: { model: 'gemini-2.5-flash' }
  });
  assert.equal(okModel.statusCode, 200);
  assert.equal(JSON.parse(okModel.body).currentModel, 'gemini-2.5-flash');

  // 5. OCR endpoint rejects missing image with 400 and missing key with 503
  const missingImg = await requestHttp({
    port: running.port,
    path: '/api/ocr-math',
    method: 'POST',
    headers: { Host: `127.0.0.1:${running.port}` },
    body: {}
  });
  assert.equal(missingImg.statusCode, 400);
  assert.equal(JSON.parse(missingImg.body).code, 'IMAGE_DATA_REQUIRED');

  const missingKey = await requestHttp({
    port: running.port,
    path: '/api/ocr-math',
    method: 'POST',
    headers: { Host: `127.0.0.1:${running.port}` },
    body: { imageBase64: 'ZmFrZQ==' }
  });
  assert.equal(missingKey.statusCode, 503);
  assert.equal(JSON.parse(missingKey.body).code, 'MISSING_API_KEY');
});

test('real HTTP: loopbackOnly=false (Cloud Run / network mode) accepts cloud Host headers', async (t) => {
  const { app } = createExpressApp({ loopbackOnly: false });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  t.after(
    () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      })
  );

  const address = server.address();
  assert.ok(address && typeof address === 'object');

  const res = await requestHttp({
    port: address.port,
    path: '/api/health',
    headers: { Host: 'ais-dev-example.europe-west2.run.app' }
  });
  assert.equal(res.statusCode, 200);
  assert.equal(JSON.parse(res.body).status, 'ok');
});

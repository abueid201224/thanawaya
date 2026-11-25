import test from 'node:test';
import assert from 'node:assert/strict';
import * as http from 'node:http';
import { startEmbeddedServer } from '../../server/app';

function sendRawRequest(params: {
  port: number;
  path: string;
  headers?: Record<string, string>;
}): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: params.port,
        path: params.path,
        method: 'GET',
        headers: params.headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode || 0, body: data });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

test('startEmbeddedServer fails closed on non-loopback bind host when loopbackOnly is enabled', async () => {
  await assert.rejects(
    () =>
      startEmbeddedServer({
        host: '0.0.0.0',
        loopbackOnly: true,
        preferredPort: 48210
      }),
    /Security violation/
  );
});

test('loopback security middleware blocks untrusted Host, untrusted Origin, and missing session token', async () => {
  const sessionToken = 'test-launch-token-1234567890abcdef';
  const server = await startEmbeddedServer({
    host: '127.0.0.1',
    loopbackOnly: true,
    preferredPort: 48310,
    sessionToken
  });

  try {
    // 1. Untrusted Host header (DNS rebinding attempt) -> 403
    const badHost = await sendRawRequest({
      port: server.port,
      path: '/api/key-status',
      headers: {
        Host: `evil.example.com:${server.port}`,
        'X-Thanaweya-Session': sessionToken
      }
    });
    assert.equal(badHost.statusCode, 403);

    // 2. Untrusted Origin header -> 403
    const badOrigin = await sendRawRequest({
      port: server.port,
      path: '/api/key-status',
      headers: {
        Host: `127.0.0.1:${server.port}`,
        Origin: 'https://attacker.example',
        'X-Thanaweya-Session': sessionToken
      }
    });
    assert.equal(badOrigin.statusCode, 403);

    // 3. Missing per-launch X-Thanaweya-Session header -> 403
    const missingToken = await sendRawRequest({
      port: server.port,
      path: '/api/key-status',
      headers: {
        Host: `127.0.0.1:${server.port}`
      }
    });
    assert.equal(missingToken.statusCode, 403);

    // 4. Wrong per-launch X-Thanaweya-Session header -> 403
    const wrongToken = await sendRawRequest({
      port: server.port,
      path: '/api/key-status',
      headers: {
        Host: `127.0.0.1:${server.port}`,
        'X-Thanaweya-Session': 'wrong-token-value'
      }
    });
    assert.equal(wrongToken.statusCode, 403);

    // 5. Valid Host + valid session token reaches API handler -> 200
    const validReq = await sendRawRequest({
      port: server.port,
      path: '/api/key-status',
      headers: {
        Host: `127.0.0.1:${server.port}`,
        'X-Thanaweya-Session': sessionToken
      }
    });
    assert.equal(validReq.statusCode, 200);
    assert.deepEqual(JSON.parse(validReq.body), { isConfigured: false });

    // 6. Health endpoint stays reachable on valid loopback Host
    const healthReq = await sendRawRequest({
      port: server.port,
      path: '/api/health',
      headers: {
        Host: `127.0.0.1:${server.port}`
      }
    });
    assert.equal(healthReq.statusCode, 200);
  } finally {
    await server.close();
  }
});

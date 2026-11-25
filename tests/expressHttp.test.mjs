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

test('real HTTP: /api/study/* endpoints persist MOE schema, attempts, mistakes, and spaced reviews in SQLite', async (t) => {
  const running = await startEmbeddedServer({
    host: '127.0.0.1',
    preferredPort: 47940,
    loopbackOnly: true
  });
  t.after(async () => {
    await running.close();
  });

  const hostHeaders = { Host: `127.0.0.1:${running.port}` };

  // 1. Official MOE sources pre-seeded
  const srcRes = await requestHttp({
    port: running.port,
    path: '/api/study/sources',
    headers: hostHeaders
  });
  assert.equal(srcRes.statusCode, 200);
  const srcJson = JSON.parse(srcRes.body);
  assert.equal(srcJson.sources.length, 3);

  // 2. Reject untrusted source URL with 400
  const badSource = await requestHttp({
    port: running.port,
    path: '/api/study/sources',
    method: 'POST',
    headers: hostHeaders,
    body: {
      id: 'evil_src',
      titleAr: 'غير موثوق',
      portalType: 'student_books',
      url: 'https://evil.example/book.pdf',
      academicYear: '2026/2027'
    }
  });
  assert.equal(badSource.statusCode, 400);

  // 3. Upsert curriculum unit + 1 reviewed + 1 unreviewed question; GET /api/study/curriculum exposes only reviewed
  const unitRes = await requestHttp({
    port: running.port,
    path: '/api/study/curriculum/unit',
    method: 'POST',
    headers: hostHeaders,
    body: {
      id: 'unit_stat_01',
      subjectCode: 'STATICS',
      subjectNameAr: 'الاستاتيكا',
      unitNumber: 1,
      title: 'الاحتكاك',
      description: 'اتزان جسم على مستوى أفقي خشن',
      learningOutcomes: ['حساب قوة الاحتكاك السكوني النهائي'],
      sourceId: 'moe_studentbooks_sec',
      academicYear: '2026/2027'
    }
  });
  assert.equal(unitRes.statusCode, 201);

  const qRev = await requestHttp({
    port: running.port,
    path: '/api/study/curriculum/question',
    method: 'POST',
    headers: hostHeaders,
    body: {
      id: 'q_stat_http_1',
      questionVersion: 1,
      unitId: 'unit_stat_01',
      subjectCode: 'STATICS',
      questionNumber: 1,
      questionText: 'احسب قوة الاحتكاك السكوني النهائي',
      options: [
        { key: 'A', text: '$10\\text{ N}$' },
        { key: 'B', text: '$20\\text{ N}$' }
      ],
      correctKey: 'A',
      explanation: '$f_s = \\mu_s R$',
      difficulty: 'C',
      targetedLearningOutcome: 'قوة الاحتكاك النهائي',
      sourceId: 'moe_performance_assessments',
      reviewStatus: 'reviewed',
      reviewedBy: 'موجه الاستاتيكا',
      verifiedBySympy: true
    }
  });
  assert.equal(qRev.statusCode, 201);

  const qUnrev = await requestHttp({
    port: running.port,
    path: '/api/study/curriculum/question',
    method: 'POST',
    headers: hostHeaders,
    body: {
      id: 'q_stat_http_unrev',
      questionVersion: 1,
      unitId: 'unit_stat_01',
      subjectCode: 'STATICS',
      questionNumber: 2,
      questionText: 'سؤال قيد المراجعة',
      options: [
        { key: 'A', text: '1' },
        { key: 'B', text: '2' }
      ],
      correctKey: 'A',
      explanation: 'مسودة',
      difficulty: 'B',
      targetedLearningOutcome: 'مسودة',
      reviewStatus: 'unreviewed'
    }
  });
  assert.equal(qUnrev.statusCode, 201);

  const curRes = await requestHttp({
    port: running.port,
    path: '/api/study/curriculum',
    headers: hostHeaders
  });
  assert.equal(curRes.statusCode, 200);
  const curJson = JSON.parse(curRes.body);
  assert.equal(curJson.units[0].questions.length, 1);
  assert.equal(curJson.units[0].questions[0].id, 'q_stat_http_1');

  // 4. Record study attempt and capture mistake over real HTTP
  const attRes = await requestHttp({
    port: running.port,
    path: '/api/study/attempts',
    method: 'POST',
    headers: hostHeaders,
    body: {
      questionId: 'q_stat_http_1',
      questionVersion: 1,
      unitId: 'unit_stat_01',
      subjectCode: 'STATICS',
      mode: 'practice',
      selectedKey: 'B',
      isCorrect: false,
      hintTierUsed: 1
    }
  });
  assert.equal(attRes.statusCode, 201);

  const mstRes = await requestHttp({
    port: running.port,
    path: '/api/study/mistakes',
    method: 'POST',
    headers: hostHeaders,
    body: {
      questionId: 'q_stat_http_1',
      questionVersion: 1,
      unitId: 'unit_stat_01',
      subjectCode: 'STATICS',
      subjectNameAr: 'الاستاتيكا',
      questionText: 'احسب قوة الاحتكاك السكوني النهائي',
      selectedKey: 'B',
      correctKey: 'A',
      explanation: '$f_s = \\mu_s R$',
      errorType: 'rule'
    }
  });
  assert.equal(mstRes.statusCode, 201);
  const mistakeId = JSON.parse(mstRes.body).mistake.id;

  const revRes = await requestHttp({
    port: running.port,
    path: `/api/study/mistakes/${encodeURIComponent(mistakeId)}/review`,
    method: 'POST',
    headers: hostHeaders,
    body: { wasCorrect: true }
  });
  assert.equal(revRes.statusCode, 200);
  assert.equal(JSON.parse(revRes.body).mistake.reviewIntervalDays, 3);
});

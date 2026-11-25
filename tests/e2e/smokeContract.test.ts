import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsFiles(full));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

test('source code has zero Unsplash URLs and zero fake Ministry/Vision grading claims', () => {
  const rootDir = path.resolve(process.cwd());
  const srcFiles = collectTsFiles(path.join(rootDir, 'src'));

  for (const file of srcFiles) {
    const text = fs.readFileSync(file, 'utf8');
    assert.equal(text.includes('images.unsplash.com'), false, `Found Unsplash URL in ${file}`);
    assert.equal(/\bwindow\.(alert|confirm|open)\s*\(/.test(text), false, `Found blocked window dialog/open in ${file}`);
    assert.equal(/\balert\s*\(/.test(text), false, `Found alert() in ${file}`);
    assert.equal(/BigBuckBunny|ElephantsDream|ForBiggerBlazes|SoundHelix/.test(text), false, `Found demo media placeholder in ${file}`);
  }

  const essayView = fs.readFileSync(
    path.join(rootDir, 'src/components/HandwrittenEssayGraderView.tsx'),
    'utf8'
  );
  assert.equal(essayView.includes('مطابق لباريم تصحيح الوزارة'), false);
  assert.equal(essayView.includes('Gemini Vision OCR'), false);
  assert.equal(essayView.includes('98.4%'), false);
});

test('compiled dist/index.html and dist-electron/main.cjs meet offline & Electron security contracts', () => {
  const rootDir = path.resolve(process.cwd());
  const distIndex = path.join(rootDir, 'dist/index.html');
  const mainCjs = path.join(rootDir, 'dist-electron/main.cjs');

  assert.equal(fs.existsSync(distIndex), true, 'dist/index.html missing — run npm run build:all first');
  assert.equal(fs.existsSync(mainCjs), true, 'dist-electron/main.cjs missing — run npm run build:all first');

  const html = fs.readFileSync(distIndex, 'utf8');
  assert.ok(html.includes('dir="rtl"'), 'dist/index.html must preserve RTL direction');
  assert.equal(/https:\/\//i.test(html), false, 'dist/index.html must contain zero external https:// URLs');
  assert.equal(/href="\//i.test(html), false, 'dist/index.html must contain zero root-relative href="/ paths');
  assert.equal(/src="\//i.test(html), false, 'dist/index.html must contain zero root-relative src="/ paths');

  const mainBundle = fs.readFileSync(mainCjs, 'utf8');
  assert.ok(mainBundle.includes('Content-Security-Policy'));
  assert.ok(mainBundle.includes('setPermissionRequestHandler'));
  assert.ok(mainBundle.includes('requestSingleInstanceLock'));
});

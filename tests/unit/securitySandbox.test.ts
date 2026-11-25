import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  hasUnsafePathConstructs,
  isPathInSandbox,
  safeWriteSandboxedFile,
  type SandboxBaseDirs
} from '../../electron/security';

function makeTempDirs(): { root: string; dirs: SandboxBaseDirs; outside: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'thanaweya-sandbox-'));
  const userDataDir = path.join(root, 'userData');
  const documentsDir = path.join(root, 'documents');
  const downloadsDir = path.join(root, 'downloads');
  const outside = path.join(root, 'outside');

  fs.mkdirSync(path.join(userDataDir, 'student_workspace'), { recursive: true });
  fs.mkdirSync(path.join(documentsDir, 'ThanaweyaAmma'), { recursive: true });
  fs.mkdirSync(path.join(downloadsDir, 'ThanaweyaAmma'), { recursive: true });
  fs.mkdirSync(outside, { recursive: true });

  return {
    root,
    dirs: { userDataDir, documentsDir, downloadsDir },
    outside
  };
}

test('hasUnsafePathConstructs blocks NTFS ADS, device names, UNC paths, and null bytes', () => {
  assert.equal(hasUnsafePathConstructs('file.txt::$DATA'), true);
  assert.equal(hasUnsafePathConstructs('C:\\workspace\\note.txt:Zone.Identifier'), true);
  assert.equal(hasUnsafePathConstructs('\\\\evil-server\\share\\file.json'), true);
  assert.equal(hasUnsafePathConstructs('//evil-server/share/file.json'), true);
  assert.equal(hasUnsafePathConstructs('CON'), true);
  assert.equal(hasUnsafePathConstructs('/tmp/NUL.txt'), true);
  assert.equal(hasUnsafePathConstructs('COM1'), true);
  assert.equal(hasUnsafePathConstructs('LPT9.json'), true);
  assert.equal(hasUnsafePathConstructs('bad\0path.json'), true);
  assert.equal(hasUnsafePathConstructs('C:\\Users\\Student\\Documents\\ThanaweyaAmma\\summary.pdf'), false);
});

test('isPathInSandbox rejects root escapes, protected files, and forbidden extensions', () => {
  const { root, dirs } = makeTempDirs();
  try {
    const workspace = path.join(dirs.userDataDir, 'student_workspace');

    // Root directories outside subdirectories must be rejected
    assert.equal(isPathInSandbox(path.join(dirs.userDataDir, 'notes.txt'), dirs, { mode: 'write_file' }), false);
    assert.equal(isPathInSandbox(path.join(dirs.documentsDir, 'notes.txt'), dirs, { mode: 'write_file' }), false);
    assert.equal(isPathInSandbox(path.join(dirs.downloadsDir, 'notes.txt'), dirs, { mode: 'write_file' }), false);

    // Protected filenames must always be rejected even inside workspace
    assert.equal(isPathInSandbox(path.join(workspace, 'secure_keys.dat'), dirs, { mode: 'write_file' }), false);
    assert.equal(isPathInSandbox(path.join(workspace, 'user_settings.json'), dirs, { mode: 'write_file' }), false);
    assert.equal(isPathInSandbox(path.join(workspace, 'main.log'), dirs, { mode: 'write_file' }), false);
    assert.equal(isPathInSandbox(path.join(workspace, 'thanaweya_study.sqlite'), dirs, { mode: 'write_file' }), false);
    assert.equal(isPathInSandbox(path.join(workspace, 'thanaweya_study.sqlite-wal'), dirs, { mode: 'write_file' }), false);

    // Forbidden extensions (.lnk, .url, .msix, .exe, .ps1, .html, .htm, .svg) must be rejected
    assert.equal(isPathInSandbox(path.join(workspace, 'shortcut.lnk'), dirs, { mode: 'write_file' }), false);
    assert.equal(isPathInSandbox(path.join(workspace, 'link.url'), dirs, { mode: 'write_file' }), false);
    assert.equal(isPathInSandbox(path.join(workspace, 'pkg.msix'), dirs, { mode: 'write_file' }), false);
    assert.equal(isPathInSandbox(path.join(workspace, 'run.exe'), dirs, { mode: 'write_file' }), false);
    assert.equal(isPathInSandbox(path.join(workspace, 'page.html'), dirs, { mode: 'write_file' }), false);
    assert.equal(isPathInSandbox(path.join(workspace, 'page.htm'), dirs, { mode: 'write_file' }), false);
    assert.equal(isPathInSandbox(path.join(workspace, 'vector.svg'), dirs, { mode: 'write_file' }), false);

    // Path traversal out of workspace must be rejected
    assert.equal(
      isPathInSandbox(path.join(workspace, '..', 'user_settings.json'), dirs, { mode: 'write_file' }),
      false
    );

    // Valid authorized paths succeed
    assert.equal(isPathInSandbox(path.join(workspace, 'study-notes.json'), dirs, { mode: 'write_file' }), true);
    assert.equal(
      isPathInSandbox(path.join(dirs.documentsDir, 'ThanaweyaAmma', 'report.pdf'), dirs, { mode: 'write_file' }),
      true
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('safeWriteSandboxedFile prevents symlink escape (TOCTOU) and writes valid workspace files atomically', async () => {
  const { root, dirs, outside } = makeTempDirs();
  try {
    const workspace = path.join(dirs.userDataDir, 'student_workspace');
    const symlinkEscape = path.join(workspace, 'escape_dir');
    fs.symlinkSync(outside, symlinkEscape, 'dir');

    // Attempt to write via symlink pointing outside sandbox
    const escapedTarget = path.join(symlinkEscape, 'pwned.json');
    const escapeResult = await safeWriteSandboxedFile(
      escapedTarget,
      Buffer.from('{"evil":true}', 'utf8'),
      dirs
    );
    assert.equal(escapeResult.success, false);
    assert.equal(fs.existsSync(path.join(outside, 'pwned.json')), false);

    // Valid nested write inside student_workspace succeeds
    const validTarget = path.join(workspace, 'calculus', 'unit1_notes.md');
    const okResult = await safeWriteSandboxedFile(
      validTarget,
      Buffer.from('# Unit 1 Notes', 'utf8'),
      dirs
    );
    assert.equal(okResult.success, true);
    assert.equal(fs.readFileSync(validTarget, 'utf8'), '# Unit 1 Notes');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

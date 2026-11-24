import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  evaluatePath,
  isPathAllowed,
  isInsideDir,
  isUnderStudentDriveFolder
} from '../electron/pathSandbox.ts';

function makeSandbox(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'thanaweya-sbx-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const documents = path.join(root, 'documents');
  const userData = path.join(root, 'userData');
  const home = root;
  fs.mkdirSync(documents);
  fs.mkdirSync(userData);
  fs.mkdirSync(path.join(root, 'documents-evil'));
  fs.mkdirSync(path.join(root, 'outside'));
  fs.writeFileSync(path.join(root, 'outside', 'secret.txt'), 'x');
  const options = { allowedBases: [userData, documents] };
  return { root, documents, userData, home, options };
}

test('path inside an allowed base is accepted (existing and not-yet-created)', (t) => {
  const { documents, options } = makeSandbox(t);
  fs.writeFileSync(path.join(documents, 'a.txt'), 'x');
  assert.equal(isPathAllowed(path.join(documents, 'a.txt'), options), true);
  assert.equal(isPathAllowed(path.join(documents, 'new', 'deep', 'file.pdf'), options), true);
  assert.equal(isPathAllowed(documents, options), true);
});

test('.. traversal out of an allowed base is rejected', (t) => {
  const { documents, options } = makeSandbox(t);
  const p = path.join(documents, '..', 'outside', 'secret.txt');
  assert.deepEqual(evaluatePath(p, options), { allowed: false, reason: 'outside-sandbox' });
});

test('sibling folder sharing the base name as a prefix is rejected', (t) => {
  const { root, options } = makeSandbox(t);
  const p = path.join(root, 'documents-evil', 'x.txt');
  assert.equal(isPathAllowed(p, options), false);
});

test('path directly under home but outside allowed bases is rejected (home is not a base)', (t) => {
  const { home, options } = makeSandbox(t);
  assert.equal(isPathAllowed(path.join(home, 'outside', 'secret.txt'), options), false);
  assert.equal(isPathAllowed(path.join(home, '.ssh', 'id_rsa'), options), false);
});

test('symlink inside an allowed base pointing outside is rejected', (t) => {
  const { root, documents, options } = makeSandbox(t);
  const link = path.join(documents, 'escape');
  try {
    fs.symlinkSync(path.join(root, 'outside'), link, 'junction');
  } catch (err) {
    t.skip(`cannot create symlink here: ${err.code}`);
    return;
  }
  assert.equal(isPathAllowed(path.join(link, 'secret.txt'), options), false);
  // writing a new file through the link must be refused as well
  assert.equal(isPathAllowed(path.join(link, 'new.txt'), options), false);
});

test('dangling symlink inside an allowed base is rejected', (t) => {
  const { root, documents, options } = makeSandbox(t);
  const link = path.join(documents, 'dangling.txt');
  try {
    fs.symlinkSync(path.join(root, 'outside', 'does-not-exist.txt'), link);
  } catch (err) {
    t.skip(`cannot create symlink here: ${err.code}`);
    return;
  }
  assert.equal(isPathAllowed(link, options), false);
});

test('symlink to a forbidden extension is rejected by its real path', (t) => {
  const { documents, options } = makeSandbox(t);
  fs.writeFileSync(path.join(documents, 'tool.exe'), 'x');
  const link = path.join(documents, 'notes.txt');
  try {
    fs.symlinkSync(path.join(documents, 'tool.exe'), link);
  } catch (err) {
    t.skip(`cannot create symlink here: ${err.code}`);
    return;
  }
  assert.deepEqual(evaluatePath(link, options), { allowed: false, reason: 'forbidden-extension' });
});

test('forbidden extensions, NUL bytes and invalid input are rejected', (t) => {
  const { documents, options } = makeSandbox(t);
  assert.deepEqual(evaluatePath(path.join(documents, 'run.EXE'), options), {
    allowed: false,
    reason: 'forbidden-extension'
  });
  assert.equal(isPathAllowed(path.join(documents, 'a.ps1'), options), false);
  assert.equal(isPathAllowed(path.join(documents, 'a\0.txt'), options), false);
  assert.equal(isPathAllowed('', options), false);
  assert.equal(isPathAllowed(undefined, options), false);
  assert.equal(isPathAllowed(42, options), false);
});

test('an unresolvable or empty base grants nothing', (t) => {
  const { documents } = makeSandbox(t);
  assert.equal(isPathAllowed(path.join(documents, 'a.txt'), { allowedBases: ['', 5] }), false);
});

// --- Windows semantics, exercised with path.win32 so they run on any OS -----------------

test('win32: case-insensitive comparison accepts the same folder in another case', () => {
  const base = 'C:\\Users\\Student\\Documents';
  const target = 'c:\\users\\student\\DOCUMENTS\\Maths\\a.pdf';
  assert.equal(isInsideDir(base, target, path.win32, true), true);
  // path.win32.relative is already case-insensitive; the explicit flag matters for other
  // path APIs (e.g. a case-insensitive macOS volume), so check it on posix semantics.
  assert.equal(isInsideDir('/Users/S/Docs', '/users/s/docs/a.pdf', path.posix, true), true);
  assert.equal(isInsideDir('/Users/S/Docs', '/users/s/docs/a.pdf', path.posix, false), false);
});

test('win32: sibling prefix, traversal and other drives are not inside', () => {
  const base = 'C:\\Users\\Student\\Documents';
  assert.equal(isInsideDir(base, 'C:\\Users\\Student\\Documents-evil\\x.txt', path.win32, true), false);
  assert.equal(isInsideDir(base, 'C:\\Users\\Student\\Desktop\\x.txt', path.win32, true), false);
  assert.equal(isInsideDir(base, 'D:\\Users\\Student\\Documents\\x.txt', path.win32, true), false);
  assert.equal(isInsideDir(base, 'C:\\Users\\Student\\Documents\\..\\x.txt', path.win32, true), false);
});

test('posix: a folder whose name merely starts with two dots is still inside', () => {
  assert.equal(isInsideDir('/a/docs', '/a/docs/..notes/x.txt', path.posix, false), true);
});

test('win32: only whole ThanaweyaAmma[_YYYY] folders on a drive root are student folders', () => {
  const w = path.win32;
  assert.equal(isUnderStudentDriveFolder('C:\\ThanaweyaAmma_2027\\x', w), true);
  assert.equal(isUnderStudentDriveFolder('D:\\ThanaweyaAmma_2027', w), true);
  assert.equal(isUnderStudentDriveFolder('D:\\ThanaweyaAmma\\lessons\\a.json', w), true);
  assert.equal(isUnderStudentDriveFolder('C:\\ThanaweyaAmmaEvil\\x', w), false);
  assert.equal(isUnderStudentDriveFolder('C:\\ThanaweyaAmma_2027x\\x', w), false);
  assert.equal(isUnderStudentDriveFolder('C:\\Other\\ThanaweyaAmma_2027\\x', w), false);
  assert.equal(isUnderStudentDriveFolder('D:\\', w), false);
});

test('posix paths are never student drive folders', () => {
  assert.equal(isUnderStudentDriveFolder('/ThanaweyaAmma_2027/x', path.posix), false);
});

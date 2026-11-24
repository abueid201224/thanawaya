/**
 * Path sandbox: pure, dependency-free (Node built-ins only) so it can be unit tested
 * without Electron.
 *
 * A path is allowed only when ALL of the following hold:
 *  1. It is a non-empty string without NUL bytes.
 *  2. Neither the requested path nor its real (symlink-resolved) path has a forbidden extension.
 *  3. Its real path is inside one of the allowed base directories (compared with
 *     `path.relative`, never with `startsWith`), or inside a student drive folder such as
 *     `D:\ThanaweyaAmma_2027`.
 */
import * as path from 'path';
import * as fs from 'fs';

export const FORBIDDEN_EXTENSIONS: ReadonlySet<string> = new Set([
  '.exe', '.bat', '.cmd', '.ps1', '.vbs', '.vbe', '.js', '.jse',
  '.wsf', '.wsh', '.msc', '.msi', '.msp', '.com', '.scr', '.pif',
  '.reg', '.hta', '.cpl', '.jar', '.dll', '.sys', '.drv'
]);

/** Whole folder name only: `ThanaweyaAmma` or `ThanaweyaAmma_2027` (no open-ended prefix). */
export const STUDENT_FOLDER_NAME = /^ThanaweyaAmma(?:_\d{4})?$/i;

export type PathDecision =
  | { allowed: true }
  | { allowed: false; reason: 'invalid' | 'forbidden-extension' | 'unresolvable' | 'outside-sandbox' };

export interface PathSandboxOptions {
  /** Directories the app may touch (e.g. userData, documents, downloads). Not `home`. */
  allowedBases: readonly string[];
  forbiddenExtensions?: ReadonlySet<string>;
}

type PathApi = typeof path.posix;

/**
 * True when `target` equals `base` or is located inside it. Uses path.relative so sibling
 * folders sharing a prefix (`/a/docs` vs `/a/docs-evil`) are NOT treated as inside.
 */
export function isInsideDir(
  base: string,
  target: string,
  pathApi: PathApi = path,
  caseInsensitive = false
): boolean {
  const b = caseInsensitive ? base.toLowerCase() : base;
  const t = caseInsensitive ? target.toLowerCase() : target;
  const rel = pathApi.relative(b, t);
  if (rel === '') return true;
  if (pathApi.isAbsolute(rel)) return false; // different drive / root
  return rel !== '..' && !rel.startsWith('..' + pathApi.sep);
}

/** True for `<DriveLetter>:\ThanaweyaAmma[_YYYY]` and anything beneath it. Windows paths only. */
export function isUnderStudentDriveFolder(
  resolvedPath: string,
  pathApi: PathApi = path
): boolean {
  const { root } = pathApi.parse(resolvedPath);
  if (!/^[a-zA-Z]:[\\/]$/.test(root)) return false;
  const rel = pathApi.relative(root, resolvedPath);
  if (rel === '' || pathApi.isAbsolute(rel)) return false;
  const first = rel.split(pathApi.sep)[0];
  if (first === '..') return false;
  return STUDENT_FOLDER_NAME.test(first);
}

function errCode(err: unknown): string | undefined {
  return typeof err === 'object' && err !== null ? (err as { code?: string }).code : undefined;
}

/**
 * Resolves symlinks/junctions of the deepest existing ancestor, then re-appends the
 * not-yet-existing tail (so brand-new files and folders can be validated too).
 * A dangling symlink is refused (throws), because writing through it would create a file
 * at its target. Throws on any other filesystem error; callers treat that as "deny".
 */
export function resolveRealPath(target: string): string {
  const absolute = path.resolve(target);
  const tail: string[] = [];
  let current = absolute;
  for (;;) {
    try {
      const real = fs.realpathSync.native(current);
      return tail.length ? path.join(real, ...tail.reverse()) : real;
    } catch (err) {
      const code = errCode(err);
      if (code !== 'ENOENT' && code !== 'ENOTDIR') throw err;
      let isDanglingLink = false;
      try {
        isDanglingLink = fs.lstatSync(current).isSymbolicLink();
      } catch {
        // nothing at this level: keep climbing
      }
      if (isDanglingLink) throw err;
      const parent = path.dirname(current);
      if (parent === current) return absolute;
      tail.push(path.basename(current));
      current = parent;
    }
  }
}

export function evaluatePath(targetPath: unknown, options: PathSandboxOptions): PathDecision {
  if (typeof targetPath !== 'string' || targetPath.length === 0) {
    return { allowed: false, reason: 'invalid' };
  }
  if (targetPath.indexOf('\0') !== -1) return { allowed: false, reason: 'invalid' };

  const forbidden = options.forbiddenExtensions ?? FORBIDDEN_EXTENSIONS;
  const lexical = path.resolve(targetPath);
  if (forbidden.has(path.extname(lexical).toLowerCase())) {
    return { allowed: false, reason: 'forbidden-extension' };
  }

  let real: string;
  try {
    real = resolveRealPath(lexical);
  } catch {
    return { allowed: false, reason: 'unresolvable' };
  }
  // A symlink named `notes.txt` pointing at `tool.exe` must not slip through.
  if (forbidden.has(path.extname(real).toLowerCase())) {
    return { allowed: false, reason: 'forbidden-extension' };
  }

  const caseInsensitive = process.platform === 'win32';
  const bases: string[] = [];
  for (const base of options.allowedBases) {
    if (typeof base !== 'string' || base.length === 0) continue;
    try {
      bases.push(resolveRealPath(base));
    } catch {
      // an unresolvable base grants nothing
    }
  }

  const inside =
    bases.some((base) => isInsideDir(base, real, path, caseInsensitive)) ||
    isUnderStudentDriveFolder(real, path);

  return inside ? { allowed: true } : { allowed: false, reason: 'outside-sandbox' };
}

export function isPathAllowed(targetPath: unknown, options: PathSandboxOptions): boolean {
  return evaluatePath(targetPath, options).allowed;
}

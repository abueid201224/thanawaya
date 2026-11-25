import * as path from 'path';
import * as fs from 'fs';

/**
 * Strict Path Sandbox & TOCTOU-hardened Filesystem Guard
 * Protects against:
 * - NTFS Alternate Data Streams (e.g., evil.exe::$DATA or :Zone.Identifier)
 * - Windows reserved device names (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
 * - Path traversal (..), UNC paths (\\server\share), and symlink/junction escapes
 * - Overwriting sensitive app config/key files in userData root (secure_keys.dat, user_settings.json)
 * - Arbitrary drive roots / removable USB drives
 */

export const FORBIDDEN_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.ps1', '.vbs', '.vbe', '.js', '.jse', '.mjs', '.cjs',
  '.wsf', '.wsh', '.msc', '.msi', '.msp', '.com', '.scr', '.pif',
  '.reg', '.hta', '.cpl', '.jar', '.dll', '.sys', '.drv',
  '.lnk', '.url', '.msix', '.msixbundle', '.appx', '.appxbundle',
  '.scf', '.inf', '.iso', '.img', '.chm', '.sct', '.wsc', '.dat'
]);

export const ALLOWED_WRITE_EXTENSIONS = new Set([
  '.json', '.txt', '.md', '.pdf', '.png', '.jpg', '.jpeg', '.webp',
  '.svg', '.csv', '.mp3', '.mp4', '.wav', '.webm'
]);

export const PROTECTED_FILENAMES = new Set([
  'secure_keys.dat',
  'user_settings.json',
  'main.log'
]);

const WINDOWS_DEVICE_NAMES = new Set([
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
]);

export interface SandboxBaseDirs {
  userDataDir: string;
  documentsDir: string;
  downloadsDir: string;
}

export interface PathCheckOptions {
  mode: 'read_or_dir' | 'write_file';
}

export function getAuthorizedSandboxBases(dirs: SandboxBaseDirs): string[] {
  return [
    path.resolve(dirs.userDataDir, 'student_workspace'),
    path.resolve(dirs.documentsDir, 'ThanaweyaAmma'),
    path.resolve(dirs.downloadsDir, 'ThanaweyaAmma')
  ].map((p) => path.normalize(p));
}

function hasTrailingSepContainment(target: string, base: string): boolean {
  const normTarget = process.platform === 'win32' ? target.toLowerCase() : target;
  const normBase = process.platform === 'win32' ? base.toLowerCase() : base;
  return normTarget === normBase || normTarget.startsWith(normBase + path.sep);
}

/**
 * Checks if a raw path has NTFS Alternate Data Streams, colons after drive letter,
 * UNC shares, null bytes, or Windows reserved device names.
 */
export function hasUnsafePathConstructs(rawPath: string): boolean {
  if (!rawPath || typeof rawPath !== 'string') return true;
  if (rawPath.includes('\0')) return true;

  const trimmed = rawPath.trim();
  if (!trimmed) return true;

  // Reject UNC network paths (\\server\share or //server/share)
  if (trimmed.startsWith('\\\\') || trimmed.startsWith('//')) {
    return true;
  }

  // Reject colon anywhere other than a Windows drive prefix (e.g., C:\...)
  // Blocks NTFS Alternate Data Streams like file.txt::$DATA or evil.exe::$DATA
  const hasDrivePrefix = /^[a-zA-Z]:[\\/]/.test(trimmed);
  const afterDrive = hasDrivePrefix ? trimmed.slice(2) : trimmed;
  if (afterDrive.includes(':')) {
    return true;
  }

  // Reject Windows reserved device names on every segment (e.g., CON, NUL.txt, COM1)
  const segments = trimmed.split(/[\\/]+/).filter(Boolean);
  for (const seg of segments) {
    const baseName = seg.split('.')[0].toUpperCase();
    if (WINDOWS_DEVICE_NAMES.has(baseName)) {
      return true;
    }
  }

  return false;
}

/**
 * Resolves the deepest existing ancestor to defend against symlink/junction escapes & TOCTOU.
 */
export function verifyRealpathContainment(resolvedTarget: string, allowedBases: string[]): boolean {
  let cursor = resolvedTarget;
  let realAncestor: string | null = null;

  for (let i = 0; i < 64; i++) {
    if (fs.existsSync(cursor)) {
      try {
        realAncestor = fs.realpathSync(cursor);
      } catch {
        return false;
      }
      break;
    }
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }

  if (!realAncestor) {
    // No ancestor exists on disk yet — fall back to lexical containment
    return allowedBases.some((base) => hasTrailingSepContainment(resolvedTarget, base));
  }

  // Check if realAncestor itself is inside any allowed base (or realpath of allowed base)
  return allowedBases.some((base) => {
    let realBase = base;
    try {
      if (fs.existsSync(base)) {
        realBase = fs.realpathSync(base);
      }
    } catch {
      realBase = base;
    }
    return (
      hasTrailingSepContainment(realAncestor!, realBase) ||
      hasTrailingSepContainment(realBase, realAncestor!)
    );
  });
}

export function isPathInSandbox(
  targetPath: string,
  dirs: SandboxBaseDirs,
  options: PathCheckOptions = { mode: 'read_or_dir' }
): boolean {
  if (hasUnsafePathConstructs(targetPath)) {
    return false;
  }

  const normalized = path.normalize(path.resolve(targetPath));
  const fileName = path.basename(normalized).toLowerCase();

  // Explicitly block protected root configuration/secret files
  if (PROTECTED_FILENAMES.has(fileName)) {
    return false;
  }

  // Check extension safely on clean filename (colon/ADS already blocked above)
  const ext = path.extname(normalized).toLowerCase();
  if (FORBIDDEN_EXTENSIONS.has(ext)) {
    return false;
  }

  if (options.mode === 'write_file') {
    if (!ext || !ALLOWED_WRITE_EXTENSIONS.has(ext)) {
      return false;
    }
  }

  const allowedBases = getAuthorizedSandboxBases(dirs);
  const lexicallyInside = allowedBases.some((base) => hasTrailingSepContainment(normalized, base));
  if (!lexicallyInside) {
    return false;
  }

  return verifyRealpathContainment(normalized, allowedBases);
}

/**
 * Performs TOCTOU-resistant atomic file write after verifying realpath inside sandbox.
 */
export async function safeWriteSandboxedFile(
  targetPath: string,
  buffer: Buffer,
  dirs: SandboxBaseDirs
): Promise<{ success: boolean; filePath: string; bytesWritten?: number; error?: string }> {
  if (!isPathInSandbox(targetPath, dirs, { mode: 'write_file' })) {
    return {
      success: false,
      filePath: targetPath,
      error: 'Access denied: Target path is outside authorized app workspace or uses disallowed file type'
    };
  }

  const normalized = path.normalize(path.resolve(targetPath));
  const parentDir = path.dirname(normalized);
  const allowedBases = getAuthorizedSandboxBases(dirs);

  if (!fs.existsSync(parentDir)) {
    await fs.promises.mkdir(parentDir, { recursive: true });
  }

  // Re-verify realpath after mkdir to eliminate TOCTOU symlink races
  const realParent = await fs.promises.realpath(parentDir);
  const parentSafe = allowedBases.some((base) => {
    const resolvedBase = fs.existsSync(base) ? fs.realpathSync(base) : base;
    return hasTrailingSepContainment(realParent, resolvedBase);
  });

  if (!parentSafe) {
    return {
      success: false,
      filePath: targetPath,
      error: 'Access denied: Resolved parent directory escaped sandbox'
    };
  }

  // Write to exclusive temp file inside verified realParent directory, then atomic rename
  const safeDest = path.join(realParent, path.basename(normalized));
  const tempPath = path.join(
    realParent,
    `.${path.basename(normalized)}.${process.pid}.${Date.now()}.tmp`
  );

  const handle = await fs.promises.open(tempPath, 'wx', 0o600);
  try {
    await handle.writeFile(buffer);
    await handle.sync();
  } finally {
    await handle.close();
  }

  await fs.promises.rename(tempPath, safeDest);
  return {
    success: true,
    filePath: safeDest,
    bytesWritten: buffer.length
  };
}

import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  dialog,
  nativeTheme,
  globalShortcut,
  safeStorage,
  session
} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import {
  evaluatePath,
  FORBIDDEN_EXTENSIONS as BASE_FORBIDDEN_EXTENSIONS,
  resolveRealPath
} from './pathSandbox';
import { ALLOWED_WRITE_EXTENSIONS, PROTECTED_FILENAMES } from './security';
import { GoogleGenAI } from '@google/genai';
import { startEmbeddedServer, RunningEmbeddedServer } from '../server/app';
import { SqliteStudyStore, isValidSpacedIntervalTuple } from '../server/sqliteStore';
import type {
  SystemInfo,
  FileWriteOptions,
  FileWriteResult,
  DirectoryEnsureResult,
  DirectoryListResult,
  DesktopPrintOptions,
  ApiKeyStatus,
  ApiKeyTestResult
} from './types';

// Enforce single instance lock on Windows
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let embeddedServer: RunningEmbeddedServer | null = null;
let studyStore: SqliteStudyStore | null = null;
let boundServerUrl: string = '';
let isShuttingDown = false;

const EXTENDED_FORBIDDEN_EXTENSIONS = new Set([
  ...BASE_FORBIDDEN_EXTENSIONS,
  '.html',
  '.htm',
  '.svg'
]);

// Determine environment
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';

/**
 * Appends diagnostic messages to main.log inside userData directory
 */
function logToMainLog(message: string, error?: any): void {
  try {
    const logPath = path.join(app.getPath('userData'), 'main.log');
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] ${message} ${error ? (error.stack || error.message || error) : ''}\n`;
    fs.appendFileSync(logPath, formatted, 'utf-8');
  } catch (e) {
    console.error('Failed to append to main.log:', e);
  }
}

// Secure Key Storage File inside UserData
function getSecureKeysFilePath(): string {
  return path.join(app.getPath('userData'), 'secure_keys.dat');
}

// User Settings File (Non-secret preferences like selected model)
function getUserSettingsFilePath(): string {
  return path.join(app.getPath('userData'), 'user_settings.json');
}

export const GEMINI_MODEL_REGEX = /^[A-Za-z0-9._-]{3,80}$/;

interface UserDesktopSettings {
  geminiModel?: string;
}

function loadUserSettings(): UserDesktopSettings {
  try {
    const settingsFile = getUserSettingsFilePath();
    if (fs.existsSync(settingsFile)) {
      const data = fs.readFileSync(settingsFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    // fallback
  }
  return {};
}

function saveUserSettings(settings: UserDesktopSettings): boolean {
  try {
    const settingsFile = getUserSettingsFilePath();
    const parentDir = path.dirname(settingsFile);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to save user settings:', err);
    return false;
  }
}

/**
 * Returns effective Gemini model using exact priority:
 * 1. User desktop setting
 * 2. GEMINI_MODEL environment variable
 * 3. Default: gemini-flash-latest
 */
function getEffectiveModel(overrideModel?: string): string {
  if (overrideModel && GEMINI_MODEL_REGEX.test(overrideModel.trim())) {
    return overrideModel.trim();
  }
  const settings = loadUserSettings();
  if (settings.geminiModel && GEMINI_MODEL_REGEX.test(settings.geminiModel.trim())) {
    return settings.geminiModel.trim();
  }
  const envModel = (process.env.GEMINI_MODEL || '').trim();
  if (envModel && GEMINI_MODEL_REGEX.test(envModel)) {
    return envModel;
  }
  return 'gemini-flash-latest';
}

/**
 * Loads the encrypted Gemini API key strictly using Electron SafeStorage (Windows DPAPI)
 * Never stores or reads plaintext fallback.
 */
function loadDecryptedApiKey(): string {
  try {
    const keyFile = getSecureKeysFilePath();
    if (!fs.existsSync(keyFile)) {
      return (process.env.GEMINI_API_KEY || '').trim();
    }

    const encryptedBuffer = fs.readFileSync(keyFile);
    if (!encryptedBuffer || encryptedBuffer.length === 0) {
      return '';
    }

    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(encryptedBuffer);
    } else {
      // Invariant: If DPAPI is unavailable, do NOT load plaintext
      return (process.env.GEMINI_API_KEY || '').trim();
    }
  } catch (err) {
    console.warn('Failed to decrypt stored API key:', err);
    return '';
  }
}

/**
 * Stores the API key encrypted with Windows DPAPI.
 * Never stores plaintext: if DPAPI is unavailable, fails securely.
 */
function storeEncryptedApiKey(rawKey: string): boolean {
  try {
    const keyFile = getSecureKeysFilePath();
    const parentDir = path.dirname(keyFile);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    const trimmed = (rawKey || '').trim();
    if (!trimmed) {
      if (fs.existsSync(keyFile)) {
        fs.unlinkSync(keyFile);
      }
      return true;
    }

    if (!safeStorage.isEncryptionAvailable()) {
      // DPAPI unavailable -> reject storing plaintext
      return false;
    }

    const bufferToWrite = safeStorage.encryptString(trimmed);
    fs.writeFileSync(keyFile, bufferToWrite);
    return true;
  } catch (err) {
    console.error('Failed to store encrypted API key:', err);
    return false;
  }
}

/**
 * Path Sandbox Verification (logic lives in ./pathSandbox for unit testing):
 * 1. Blocks executable and script extensions (.exe, .bat, .cmd, .ps1, .vbs, etc.)
 * 2. Restricts operations to authorized directories (userData, documents, downloads, or
 *    local Thanaweya project folders such as D:\ThanaweyaAmma_2027)
 * 3. Compares real paths (symlinks resolved) with path.relative, so `..` traversal, sibling
 *    folders with a shared prefix and symlink escapes are rejected. The whole home folder
 *    is intentionally NOT allowed.
 */
function getSandboxAllowedBases(): string[] {
  return [
    app.getPath('userData'),
    app.getPath('documents'),
    app.getPath('downloads')
  ];
}

function isPathInSandbox(
  targetPath: string,
  options: { mode?: 'read_or_dir' | 'write_file'; allowProtectedInternal?: boolean } = {}
): boolean {
  if (!targetPath || typeof targetPath !== 'string') return false;
  const resolved = path.resolve(targetPath);
  const fileName = path.basename(resolved).toLowerCase();

  if (!options.allowProtectedInternal && PROTECTED_FILENAMES.has(fileName)) {
    console.warn(`[Security Alert] Blocked attempt to access protected file -> ${fileName}`);
    return false;
  }

  const decision = evaluatePath(targetPath, {
    allowedBases: getSandboxAllowedBases(),
    forbiddenExtensions: EXTENDED_FORBIDDEN_EXTENSIONS
  });
  if (!decision.allowed) {
    if (decision.reason === 'forbidden-extension') {
      console.warn(`[Security Alert] Blocked attempt to access restricted extension -> ${String(targetPath)}`);
    }
    return false;
  }

  if (options.mode === 'write_file') {
    const ext = path.extname(resolved).toLowerCase();
    if (!ext || !ALLOWED_WRITE_EXTENSIONS.has(ext)) {
      console.warn(`[Security Alert] Blocked write to non-whitelisted extension -> ${ext || '(none)'}`);
      return false;
    }
  }

  return true;
}

/**
 * Strict IPC Sender Validation:
 * Guarantees that calls originate exclusively from the authorized Main Window Main Frame.
 */
function isTrustedSender(event: Electron.IpcMainInvokeEvent | Electron.IpcMainEvent): boolean {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  if (!event.senderFrame) return false;
  return event.senderFrame === mainWindow.webContents.mainFrame;
}

/**
 * Creates the hardened BrowserWindow with Context Isolation & Sandbox enabled
 */
function createWindow(): void {
  // Enforce Windows Light Theme
  nativeTheme.themeSource = 'light';

  const candidateIcons = [
    path.join(__dirname, '../installer-assets/icon.ico'),
    path.join(__dirname, '../installer-assets/icon.png'),
    path.join(__dirname, '../build/icon.ico'),
    path.join(__dirname, '../build/icon.png'),
    path.join(__dirname, '../build/icon.svg'),
    path.join(__dirname, '../public/icon.svg')
  ];
  const iconPath = candidateIcons.find((p) => fs.existsSync(p));

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: '#F8FAFC',
    show: false, // Show gracefully once ready-to-show
    icon: iconPath || undefined,
    autoHideMenuBar: true,
    title: 'Thanaweya Amma Math Copilot - ثانوية عامة علمي رياضة',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: true
    }
  });

  if (app.isPackaged) {
    mainWindow.removeMenu();
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }

  // Graceful show on ready
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Security: Disallow all webview attachments
  mainWindow.webContents.on('will-attach-webview', (e) => {
    e.preventDefault();
  });

  // Security: Intercept window.open requests and open strictly in external system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Security: Prevent in-app top-level navigations outside of our loopback server
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const isLoopbackNav =
      navigationUrl.startsWith(boundServerUrl) ||
      (isDev && navigationUrl.startsWith(devServerUrl));

    if (!isLoopbackNav) {
      event.preventDefault();
      if (navigationUrl.startsWith('http://') || navigationUrl.startsWith('https://')) {
        shell.openExternal(navigationUrl);
      }
    }
  });

  // Report load failure to user with Arabic dialog and log to main.log
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    const errMsg = `فشل تحميل الواجهة [${errorCode}]: ${errorDescription} (${validatedURL})`;
    logToMainLog(errMsg);
    dialog.showErrorBox(
      'خطأ في تشغيل التطبيق',
      'تعذر تحميل واجهة التطبيق بنجاح. يرجى إعادة تشغيل التطبيق أو التواصل مع الدعم الفني.'
    );
  });

  // Load URL from embedded loopback server
  const targetUrl = boundServerUrl || (isDev ? devServerUrl : 'http://127.0.0.1:47321');
  mainWindow.loadURL(targetUrl).catch((err) => {
    logToMainLog(`Failed to load target URL: ${targetUrl}`, err);
    dialog.showErrorBox(
      'تعذر الاتصال بالخادم المحلي',
      'حدث خطأ أثناء الاتصال بالخادم المحلي (127.0.0.1:47321). يرجى إعادة تشغيل التطبيق.'
    );
    // Fallback to local dist if available
    const indexPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow?.loadFile(indexPath);
    }
  });

  setupShortcuts();
}

/**
 * Configure Windows Desktop Shortcuts
 */
function setupShortcuts(): void {
  if (mainWindow) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // Ctrl+P -> Trigger Booklet Print Modal
      if (input.control && input.key.toLowerCase() === 'p' && input.type === 'keyDown') {
        event.preventDefault();
        mainWindow?.webContents.send('desktop:shortcut-print');
      }

      // Ctrl+F -> Focus Search Bar
      if (input.control && input.key.toLowerCase() === 'f' && input.type === 'keyDown') {
        event.preventDefault();
        mainWindow?.webContents.send('desktop:shortcut-search');
      }

      // Ctrl+, -> Settings & Gemini Key Management
      if (input.control && input.key === ',' && input.type === 'keyDown') {
        event.preventDefault();
        mainWindow?.webContents.send('desktop:shortcut-settings');
      }

      // Esc -> Close Active Modals
      if (input.key === 'Escape' && input.type === 'keyDown') {
        mainWindow?.webContents.send('desktop:shortcut-escape');
      }
    });
  }
}

/**
 * Register Secure IPC Handlers with isTrustedSender verification
 */
function setupIpcHandlers(): void {
  // 1. System Info
  ipcMain.handle('app:get-system-info', (event): SystemInfo => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    return {
      platform: process.platform,
      arch: process.arch,
      version: app.getVersion(),
      electronVersion: process.versions.electron || '',
      nodeVersion: process.versions.node || '',
      isPackaged: app.isPackaged,
      appDataDir: app.getPath('userData'),
      homeDir: app.getPath('home')
    };
  });

  // 2. Embedded Server URL
  ipcMain.handle('app:get-embedded-server-url', (event): string => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    return boundServerUrl;
  });

  // 3. Local Directory Ensure (Path Sandboxed)
  ipcMain.handle('fs:ensure-directory', async (event, dirPath: string): Promise<DirectoryEnsureResult> => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    try {
      if (!dirPath || typeof dirPath !== 'string') {
        return { success: false, path: dirPath, created: false, error: 'Invalid directory path' };
      }

      if (!isPathInSandbox(dirPath)) {
        return { success: false, path: dirPath, created: false, error: 'Access denied: Directory path is outside sandbox' };
      }

      const normalized = path.normalize(path.resolve(dirPath));
      if (!fs.existsSync(normalized)) {
        await fs.promises.mkdir(normalized, { recursive: true });
        return { success: true, path: normalized, created: true };
      }
      return { success: true, path: normalized, created: false };
    } catch (err: any) {
      return { success: false, path: dirPath, created: false, error: err?.message || 'Directory creation failed' };
    }
  });

  // 4. Check path existence (Path Sandboxed)
  ipcMain.handle('fs:check-exists', (event, targetPath: string): boolean => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    try {
      if (!targetPath || !isPathInSandbox(targetPath)) return false;
      return fs.existsSync(path.normalize(path.resolve(targetPath)));
    } catch {
      return false;
    }
  });

  // 5. Write local file (Path Sandboxed & TOCTOU-hardened Atomic Write)
  ipcMain.handle(
    'fs:write-file',
    async (
      event,
      args: { filePath: string; content: string; isBinary?: boolean; options?: FileWriteOptions }
    ): Promise<FileWriteResult> => {
      if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
      try {
        const { filePath, content, isBinary } = args;
        if (!isPathInSandbox(filePath, { mode: 'write_file' })) {
          return { success: false, filePath, error: 'Access denied: Target path is outside sandbox or has restricted extension' };
        }

        const normalized = path.normalize(path.resolve(filePath));
        const parentDir = path.dirname(normalized);

        if (!fs.existsSync(parentDir)) {
          await fs.promises.mkdir(parentDir, { recursive: true });
        }

        // Re-verify realpath after directory creation to mitigate TOCTOU symlink races
        const realParent = resolveRealPath(parentDir);
        const parentDecision = evaluatePath(realParent, {
          allowedBases: getSandboxAllowedBases(),
          forbiddenExtensions: EXTENDED_FORBIDDEN_EXTENSIONS
        });
        if (!parentDecision.allowed) {
          return { success: false, filePath, error: 'Access denied: Parent directory escaped sandbox' };
        }

        const buffer = isBinary
          ? Buffer.from(content, 'base64')
          : Buffer.from(content, 'utf-8');

        const safeDest = path.join(realParent, path.basename(normalized));
        const tempPath = path.join(realParent, `.${path.basename(normalized)}.${process.pid}.${Date.now()}.tmp`);
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
      } catch (err: any) {
        return {
          success: false,
          filePath: args.filePath,
          error: err?.message || 'File write failed'
        };
      }
    }
  );

  // 6. List Directory contents (Path Sandboxed)
  ipcMain.handle('fs:list-directory', async (event, dirPath: string): Promise<DirectoryListResult> => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    try {
      if (!isPathInSandbox(dirPath)) {
        return { success: false, path: dirPath, files: [], error: 'Access denied: Directory path is outside sandbox' };
      }

      const normalized = path.normalize(path.resolve(dirPath));
      if (!fs.existsSync(normalized)) {
        return { success: false, path: normalized, files: [], error: 'Directory does not exist' };
      }

      const entries = await fs.promises.readdir(normalized, { withFileTypes: true });
      const files = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(normalized, entry.name);
          let size = 0;
          let modifiedAt = new Date().toISOString();
          try {
            const stats = await fs.promises.stat(fullPath);
            size = stats.size;
            modifiedAt = stats.mtime.toISOString();
          } catch {
            // ignore stat failure
          }
          return {
            name: entry.name,
            isDirectory: entry.isDirectory(),
            size,
            modifiedAt
          };
        })
      );

      return { success: true, path: normalized, files };
    } catch (err: any) {
      return { success: false, path: dirPath, files: [], error: err?.message || 'List directory failed' };
    }
  });

  // 7. Open folder in native Windows Explorer (Path Sandboxed)
  ipcMain.handle('fs:open-folder-explorer', async (event, folderPath: string): Promise<boolean> => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    try {
      if (!folderPath || !isPathInSandbox(folderPath)) return false;
      const normalized = path.normalize(path.resolve(folderPath));
      if (!fs.existsSync(normalized)) {
        await fs.promises.mkdir(normalized, { recursive: true });
      }
      const result = await shell.openPath(normalized);
      return result === '';
    } catch {
      return false;
    }
  });

  // 8. Open External URL (Strict HTTP/HTTPS whitelist)
  ipcMain.handle('shell:open-external', async (event, url: string): Promise<boolean> => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    try {
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
        return false;
      }
      await shell.openExternal(url);
      return true;
    } catch {
      return false;
    }
  });

  // 9. Native Dialogs (Sanitized options bounded inside sandbox)
  ipcMain.handle('dialog:show-open', async (event, options: any) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    if (!mainWindow) return null;
    const safeDefault =
      typeof options?.defaultPath === 'string' && isPathInSandbox(options.defaultPath)
        ? path.resolve(options.defaultPath)
        : path.join(app.getPath('documents'), 'ThanaweyaAmma');
    const allowedProps = new Set(['openFile', 'multiSelections']);
    const safeProps = Array.isArray(options?.properties)
      ? options.properties.filter((p: unknown) => typeof p === 'string' && allowedProps.has(p))
      : ['openFile'];
    const safeFilters = Array.isArray(options?.filters)
      ? options.filters
          .filter((f: any) => f && typeof f.name === 'string' && Array.isArray(f.extensions))
          .slice(0, 8)
      : undefined;

    const result = await dialog.showOpenDialog(mainWindow, {
      title: typeof options?.title === 'string' ? options.title.slice(0, 120) : undefined,
      buttonLabel: typeof options?.buttonLabel === 'string' ? options.buttonLabel.slice(0, 40) : undefined,
      defaultPath: safeDefault,
      filters: safeFilters,
      properties: safeProps as Array<'openFile' | 'multiSelections'>
    });
    return result.canceled ? null : result.filePaths;
  });

  ipcMain.handle('dialog:show-save', async (event, options: any) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    if (!mainWindow) return null;
    const safeDefault =
      typeof options?.defaultPath === 'string' && isPathInSandbox(options.defaultPath, { mode: 'write_file' })
        ? path.resolve(options.defaultPath)
        : path.join(app.getPath('documents'), 'ThanaweyaAmma');
    const safeFilters = Array.isArray(options?.filters)
      ? options.filters
          .filter((f: any) => f && typeof f.name === 'string' && Array.isArray(f.extensions))
          .slice(0, 8)
      : undefined;

    const result = await dialog.showSaveDialog(mainWindow, {
      title: typeof options?.title === 'string' ? options.title.slice(0, 120) : undefined,
      buttonLabel: typeof options?.buttonLabel === 'string' ? options.buttonLabel.slice(0, 40) : undefined,
      defaultPath: safeDefault,
      filters: safeFilters
    });
    if (result.canceled || !result.filePath) return null;
    return isPathInSandbox(result.filePath, { mode: 'write_file' }) ? result.filePath : null;
  });

  // 10. Native A4 Print Engine
  ipcMain.handle('app:print-a4', async (event, options?: DesktopPrintOptions): Promise<{ success: boolean; error?: string }> => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    return new Promise((resolve) => {
      if (!mainWindow) {
        resolve({ success: false, error: 'Window not available' });
        return;
      }

      mainWindow.webContents.print(
        {
          silent: options?.silent ?? false,
          printBackground: true,
          pageSize: options?.pageSize || 'A4',
          color: options?.color ?? true,
          margins: {
            marginType: 'custom',
            top: 10,
            bottom: 12,
            left: 12,
            right: 12
          }
        },
        (success, failureReason) => {
          if (success) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: failureReason });
          }
        }
      );
    });
  });

  // 11. Secrets Management (Strict SafeStorage Windows DPAPI)
  ipcMain.handle('secrets:get-api-key-status', (event): ApiKeyStatus => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    const key = loadDecryptedApiKey();
    const isConfigured = Boolean(key && key.trim().length > 6);

    return {
      isConfigured,
      isEncryptionAvailable: safeStorage.isEncryptionAvailable(),
      storageType: safeStorage.isEncryptionAvailable() ? 'dpapi' : 'unconfigured'
    };
  });

  ipcMain.handle('secrets:save-api-key', async (event, apiKey: string): Promise<{ success: boolean; error?: string }> => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    if (!safeStorage.isEncryptionAvailable()) {
      return {
        success: false,
        error: 'التشفير العتادي الآمن (Windows DPAPI) غير متاح على هذا النظام، ولن يتم حفظ المفتاح بنص صريح لحماية أمان بياناتك.'
      };
    }

    try {
      const cleanKey = (apiKey || '').trim();
      const success = storeEncryptedApiKey(cleanKey);
      if (success) {
        if (embeddedServer) {
          embeddedServer.setApiKey(cleanKey);
        }
        return { success: true };
      }
      return { success: false, error: 'فشل حفظ المفتاح المشفر في وحدة التخزين الآمنة' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'فشلت عملية حفظ المفتاح' };
    }
  });

  ipcMain.handle('secrets:remove-api-key', async (event): Promise<{ success: boolean }> => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    try {
      const keyFile = getSecureKeysFilePath();
      if (fs.existsSync(keyFile)) {
        fs.unlinkSync(keyFile);
      }
      if (embeddedServer) {
        embeddedServer.setApiKey('');
      }
      return { success: true };
    } catch {
      return { success: false };
    }
  });

  ipcMain.handle('secrets:test-api-key', async (event, candidateKey?: string): Promise<ApiKeyTestResult> => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    const keyToTest = (candidateKey || loadDecryptedApiKey()).trim();

    if (!keyToTest) {
      return {
        success: false,
        message: 'مفتاح API غير متوفر للاختبار. يرجى إدخال مفتاح صالح.'
      };
    }

    const startTs = Date.now();
    try {
      const ai = new GoogleGenAI({
        apiKey: keyToTest,
        httpOptions: {
          headers: { 'User-Agent': 'thanaweya-copilot-test' }
        }
      });

      const testModel = getEffectiveModel();
      const response: any = await ai.models.generateContent({
        model: testModel,
        contents: 'Say OK',
        config: {
          maxOutputTokens: 5,
          temperature: 0.1
        }
      });

      const latencyMs = Date.now() - startTs;
      const text = response.text || '';
      if (text) {
        return {
          success: true,
          message: `تم التحقق بنجاح من مفتاح Gemini API! زمن الاستجابة: ${latencyMs}ms (${testModel})`,
          latencyMs
        };
      }
      return {
        success: false,
        message: 'لم يرجع النموذج أي رد، يرجى مراجعة صلاحيات المفتاح.'
      };
    } catch (err: any) {
      console.error('[API Key Test Error]:', err);
      return {
        success: false,
        message: 'فشل التحقق من المفتاح. يرجى مراجعة صحة المفتاح أو الاتصال بالإنترنت.'
      };
    }
  });

  // 12. Model Configuration IPC Handlers
  ipcMain.handle('model:get-config', (event) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    const settings = loadUserSettings();
    return {
      currentModel: getEffectiveModel(),
      defaultModel: 'gemini-flash-latest',
      userConfiguredModel: settings.geminiModel || null,
      envModel: process.env.GEMINI_MODEL || null
    };
  });

  ipcMain.handle('model:set-config', async (event, modelName: string) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    const clean = (modelName || '').trim();
    const settings = loadUserSettings();

    if (!clean) {
      delete settings.geminiModel;
      saveUserSettings(settings);
      const effective = getEffectiveModel();
      if (embeddedServer) {
        embeddedServer.setModel(effective);
      }
      return { success: true, currentModel: effective };
    }

    if (!GEMINI_MODEL_REGEX.test(clean)) {
      return {
        success: false,
        error: 'اسم النموذج غير صالح. يجب أن يتكون من 3 إلى 80 حرفاً ويحتوي فقط على أحرف وأرقام ونقاط وشرطات (^[A-Za-z0-9._-]{3,80}$).',
        currentModel: getEffectiveModel()
      };
    }

    settings.geminiModel = clean;
    saveUserSettings(settings);
    if (embeddedServer) {
      embeddedServer.setModel(clean);
    }
    return { success: true, currentModel: clean };
  });

  // 13. Window Controls
  ipcMain.on('window:minimize', (event) => {
    if (!isTrustedSender(event)) return;
    mainWindow?.minimize();
  });
  ipcMain.on('window:maximize', (event) => {
    if (!isTrustedSender(event)) return;
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window:close', (event) => {
    if (!isTrustedSender(event)) return;
    mainWindow?.close();
  });
  // 14. Local SQLite Study Persistence & MOE Content Schema IPC Handlers
  ipcMain.handle('study:get-sources', (event) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    if (!studyStore) return { ok: false, error: 'SQLite store unavailable' };
    return { ok: true, sources: studyStore.listOfficialSources() };
  });

  ipcMain.handle('study:get-curriculum', (event) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    if (!studyStore) return { ok: false, error: 'SQLite store unavailable' };
    return { ok: true, units: studyStore.getStudentApprovedCurriculum() };
  });

  ipcMain.handle('study:record-attempt', (event, payload: any) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    if (!studyStore) return { ok: false, error: 'SQLite store unavailable' };
    try {
      const attempt = studyStore.recordAttempt(payload);
      return { ok: true, attempt };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Failed to record attempt' };
    }
  });

  ipcMain.handle('study:get-attempts', (event, limit?: number) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    if (!studyStore) return { ok: false, error: 'SQLite store unavailable' };
    return { ok: true, attempts: studyStore.getAttempts(limit) };
  });

  ipcMain.handle('study:capture-mistake', (event, payload: any) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    if (!studyStore) return { ok: false, error: 'SQLite store unavailable' };
    try {
      const mistake = studyStore.captureMistake(payload);
      return { ok: true, mistake };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Failed to capture mistake' };
    }
  });

  ipcMain.handle('study:get-mistakes', (event) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    if (!studyStore) return { ok: false, error: 'SQLite store unavailable' };
    return { ok: true, mistakes: studyStore.getMistakes() };
  });

  ipcMain.handle('study:record-review', (event, args: { mistakeId: string; wasCorrect: boolean }) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    if (!studyStore) return { ok: false, error: 'SQLite store unavailable' };
    try {
      const mistake = studyStore.recordSpacedReviewOutcome(args.mistakeId, Boolean(args.wasCorrect));
      return { ok: true, mistake };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Failed to record review' };
    }
  });

  ipcMain.handle(
    'study:update-mistake',
    (event, args: { mistakeId: string; errorType: string; studentNote?: string }) => {
      if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
      if (!studyStore) return { ok: false, error: 'SQLite store unavailable' };
      try {
        const mistake = studyStore.updateMistakeClassification(
          args.mistakeId,
          args.errorType as any,
          args.studentNote
        );
        return { ok: true, mistake };
      } catch (err: any) {
        return { ok: false, error: err?.message || 'Failed to update mistake' };
      }
    }
  );

  ipcMain.handle('study:get-spaced-intervals', (event) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    if (!studyStore) return { ok: false, error: 'SQLite store unavailable' };
    return { ok: true, intervals: studyStore.getSpacedIntervals() };
  });

  ipcMain.handle('study:save-spaced-intervals', (event, intervals: unknown) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    if (!studyStore) return { ok: false, error: 'SQLite store unavailable' };
    if (!isValidSpacedIntervalTuple(intervals)) {
      return { ok: false, error: 'Invalid spaced interval tuple (expected 4 positive integers <= 60)' };
    }
    const saved = studyStore.saveSpacedIntervals(intervals);
    return { ok: true, intervals: saved };
  });

  ipcMain.handle('study:get-outbox', (event, limit?: number) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    if (!studyStore) return { ok: false, error: 'SQLite store unavailable' };
    return {
      ok: true,
      entries: studyStore.getPendingOutboxEntries(new Date(), limit ?? 50),
      stats: studyStore.getOutboxStats()
    };
  });

  ipcMain.handle('study:ack-outbox', (event, outboxId: string) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    if (!studyStore) return { ok: false, error: 'SQLite store unavailable' };
    studyStore.markOutboxSynced(outboxId);
    return { ok: true, stats: studyStore.getOutboxStats() };
  });

  ipcMain.handle('study:fail-outbox', (event, args: { outboxId: string; error: string }) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    if (!studyStore) return { ok: false, error: 'SQLite store unavailable' };
    try {
      const result = studyStore.markOutboxFailed(args.outboxId, args.error || 'Sync failed');
      return { ok: true, ...result, stats: studyStore.getOutboxStats() };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Failed to update outbox' };
    }
  });

  ipcMain.handle('study:get-schedule', (event) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    if (!studyStore) return { ok: false, error: 'SQLite store unavailable' };
    return { ok: true, ...studyStore.getStudentSchedule() };
  });

  ipcMain.handle('study:save-schedule', (event, slots: unknown[]) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    if (!studyStore) return { ok: false, error: 'SQLite store unavailable' };
    try {
      const saved = studyStore.saveStudentSchedule(slots);
      return { ok: true, ...saved };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Failed to save schedule' };
    }
  });
}

if (gotTheLock) {
  // Second instance focus
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // App lifecycle
  app.whenReady().then(async () => {
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // 1. Enforce hardened Content-Security-Policy on embedded loopback origin
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' http://127.0.0.1:* ws://127.0.0.1:*; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' data: blob: https://*.moe.gov.eg; font-src 'self' data:; connect-src 'self' http://127.0.0.1:* ws://127.0.0.1:* https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com; frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://*.moe.gov.eg; object-src 'none'; base-uri 'self';"
          ]
        }
      });
    });

    // 1b. Attach per-launch session token strictly to authorized main-window requests to embedded API
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      const headers = { ...details.requestHeaders };
      const isAuthorizedRenderer =
        details.webContentsId === undefined ||
        Boolean(mainWindow && !mainWindow.isDestroyed() && details.webContentsId === mainWindow.webContents.id);
      if (boundServerUrl && isAuthorizedRenderer && details.url.startsWith(`${boundServerUrl}/api/`)) {
        headers['X-Thanaweya-Session'] = sessionToken;
      }
      callback({ requestHeaders: headers });
    });

    // 2. Strict Permissions Request Handler: only allow media (camera/mic for OCR/Audio)
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
      if (permission === 'media') {
        callback(true);
      } else {
        callback(false);
      }
    });

    // 3. Initialize sandboxed local SQLite study store inside student_workspace
    try {
      const sqliteDbPath = path.join(
        app.getPath('userData'),
        'student_workspace',
        'thanaweya_study.sqlite'
      );
      if (isPathInSandbox(sqliteDbPath, { allowProtectedInternal: true })) {
        studyStore = new SqliteStudyStore(sqliteDbPath);
      }
    } catch (err) {
      logToMainLog('Failed to initialize SQLite study store (continuing with renderer storage):', err);
      studyStore = null;
    }

    setupIpcHandlers();

    // Initialize embedded Express server on neutral loopback 127.0.0.1
    const initialKey = loadDecryptedApiKey();
    const staticDir = path.join(__dirname, '../dist');

    try {
      embeddedServer = await startEmbeddedServer({
        preferredPort: 47321,
        staticDir,
        initialApiKey: initialKey,
        host: '127.0.0.1',
        loopbackOnly: true,
        sessionToken,
        sqliteStore: studyStore ?? undefined
      });
      embeddedServer.setModel(getEffectiveModel());
      boundServerUrl = embeddedServer.url;
      console.log(`[Embedded Server] Running on loopback: ${boundServerUrl}`);
    } catch (err) {
      logToMainLog('Failed to start embedded server on 47321, falling back to static loadFile:', err);
      boundServerUrl = '';
    }

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('will-quit', (event) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    event.preventDefault();
    globalShortcut.unregisterAll();

    Promise.resolve()
      .then(async () => {
        if (embeddedServer) {
          await embeddedServer.close().catch(() => {});
          embeddedServer = null;
        }
        if (studyStore) {
          try {
            studyStore.close();
          } catch {
            // ignore close errors
          }
          studyStore = null;
        }
      })
      .finally(() => {
        app.quit();
      });
  });
}

// Crash resilience
process.on('uncaughtException', (error) => {
  logToMainLog('Unhandled Electron Exception:', error);
  console.error('Unhandled Electron Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  logToMainLog('Unhandled Electron Rejection:', reason);
  console.error('Unhandled Electron Rejection:', reason);
});

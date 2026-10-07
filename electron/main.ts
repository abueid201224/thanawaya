import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  dialog,
  nativeTheme,
  globalShortcut,
  safeStorage
} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { startEmbeddedServer, RunningEmbeddedServer } from '../server/app';
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
let boundServerUrl: string = '';

// Determine environment
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';

// Secure Key Storage File inside UserData
function getSecureKeysFilePath(): string {
  return path.join(app.getPath('userData'), 'secure_keys.dat');
}

/**
 * Loads the encrypted Gemini API key using Electron SafeStorage (Windows DPAPI)
 */
function loadDecryptedApiKey(): string {
  try {
    const keyFile = getSecureKeysFilePath();
    if (!fs.existsSync(keyFile)) {
      return process.env.GEMINI_API_KEY || '';
    }

    const encryptedBuffer = fs.readFileSync(keyFile);
    if (!encryptedBuffer || encryptedBuffer.length === 0) {
      return '';
    }

    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(encryptedBuffer);
    } else {
      // Fallback for environments where DPAPI is unavailable
      return encryptedBuffer.toString('utf-8');
    }
  } catch (err) {
    console.warn('Failed to decrypt stored API key:', err);
    return '';
  }
}

/**
 * Stores the API key encrypted with Windows DPAPI
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

    let bufferToWrite: Buffer;
    if (safeStorage.isEncryptionAvailable()) {
      bufferToWrite = safeStorage.encryptString(trimmed);
    } else {
      bufferToWrite = Buffer.from(trimmed, 'utf-8');
    }

    fs.writeFileSync(keyFile, bufferToWrite);
    return true;
  } catch (err) {
    console.error('Failed to store encrypted API key:', err);
    return false;
  }
}

/**
 * Path Sandbox Verification:
 * 1. Blocks executable and script extensions (.exe, .bat, .cmd, .ps1, .vbs, etc.)
 * 2. Restricts operations to authorized directories (userData, documents, downloads, or local Thanaweya project folders)
 * 3. Prevents path traversal (..)
 */
const FORBIDDEN_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.ps1', '.vbs', '.vbe', '.js', '.jse',
  '.wsf', '.wsh', '.msc', '.msi', '.msp', '.com', '.scr', '.pif',
  '.reg', '.hta', '.cpl', '.jar', '.dll', '.sys', '.drv'
]);

function isPathInSandbox(targetPath: string): boolean {
  if (!targetPath || typeof targetPath !== 'string') return false;
  if (targetPath.indexOf('\0') !== -1) return false;

  const normalized = path.normalize(path.resolve(targetPath));
  const ext = path.extname(normalized).toLowerCase();

  if (FORBIDDEN_EXTENSIONS.has(ext)) {
    console.warn(`[Security Alert] Blocked attempt to access executable extension: ${ext} -> ${normalized}`);
    return false;
  }

  // Allowed base directories
  const allowedBases = [
    path.normalize(app.getPath('userData')),
    path.normalize(app.getPath('documents')),
    path.normalize(app.getPath('downloads')),
    path.normalize(app.getPath('home'))
  ];

  // Also authorize drive root Thanaweya project folders (e.g., D:/ThanaweyaAmma_2027/ or C:/ThanaweyaAmma_2027/)
  const isStudentDriveFolder = /^[a-zA-Z]:[\\\/]ThanaweyaAmma/i.test(normalized);
  const isUnderAllowedBase = allowedBases.some((base) => normalized.startsWith(base));

  return isUnderAllowedBase || isStudentDriveFolder;
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

  // Load URL from embedded loopback server
  const targetUrl = boundServerUrl || (isDev ? devServerUrl : 'http://127.0.0.1:34567');
  mainWindow.loadURL(targetUrl).catch((err) => {
    console.error('Failed to load embedded server URL:', targetUrl, err);
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

  // 5. Write local file (Path Sandboxed & Atomic Write)
  ipcMain.handle(
    'fs:write-file',
    async (
      event,
      args: { filePath: string; content: string; isBinary?: boolean; options?: FileWriteOptions }
    ): Promise<FileWriteResult> => {
      if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
      try {
        const { filePath, content, isBinary } = args;
        if (!isPathInSandbox(filePath)) {
          return { success: false, filePath, error: 'Access denied: Target path is outside sandbox or has restricted extension' };
        }

        const normalized = path.normalize(path.resolve(filePath));
        const parentDir = path.dirname(normalized);

        if (!fs.existsSync(parentDir)) {
          await fs.promises.mkdir(parentDir, { recursive: true });
        }

        const buffer = isBinary
          ? Buffer.from(content, 'base64')
          : Buffer.from(content, 'utf-8');

        // Atomic write via temporary file
        const tempPath = `${normalized}.tmp_${Date.now()}`;
        await fs.promises.writeFile(tempPath, buffer);
        await fs.promises.rename(tempPath, normalized);

        return {
          success: true,
          filePath: normalized,
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

  // 9. Native Dialogs
  ipcMain.handle('dialog:show-open', async (event, options: any) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, options || {});
    return result.canceled ? null : result.filePaths;
  });

  ipcMain.handle('dialog:show-save', async (event, options: any) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    if (!mainWindow) return null;
    const result = await dialog.showSaveDialog(mainWindow, options || {});
    return result.canceled ? null : result.filePath;
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

  // 11. Secrets Management (SafeStorage Windows DPAPI)
  ipcMain.handle('secrets:get-api-key-status', (event): ApiKeyStatus => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    const key = loadDecryptedApiKey();
    const isConfigured = Boolean(key && key.trim().length > 6);
    const masked = isConfigured
      ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}`
      : null;

    return {
      isConfigured,
      isEncryptionAvailable: safeStorage.isEncryptionAvailable(),
      maskedKey: masked,
      storageType: safeStorage.isEncryptionAvailable() ? 'dpapi' : 'plaintext_fallback'
    };
  });

  ipcMain.handle('secrets:save-api-key', async (event, apiKey: string): Promise<{ success: boolean; error?: string }> => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC sender');
    try {
      const cleanKey = (apiKey || '').trim();
      const success = storeEncryptedApiKey(cleanKey);
      if (success) {
        if (embeddedServer) {
          embeddedServer.setApiKey(cleanKey);
        }
        return { success: true };
      }
      return { success: false, error: 'Failed to write encrypted key to storage' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Key storage failed' };
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

      const response: any = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
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
          message: `تم التحقق بنجاح من مفتاح Gemini API! زمن الاستجابة: ${latencyMs}ms`,
          latencyMs
        };
      }
      return {
        success: false,
        message: 'لم يرجع النموذج أي رد، يرجى مراجعة صلاحيات المفتاح.'
      };
    } catch (err: any) {
      return {
        success: false,
        message: `فشل التحقق من المفتاح: ${err?.message || 'خطأ في الاتصال بالنموذج'}`
      };
    }
  });

  // 12. Window Controls
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
}

// App lifecycle
app.whenReady().then(async () => {
  setupIpcHandlers();

  // Initialize embedded Express server on neutral loopback 127.0.0.1
  const initialKey = loadDecryptedApiKey();
  const staticDir = path.join(__dirname, '../dist');

  try {
    embeddedServer = await startEmbeddedServer({
      preferredPort: 34567,
      staticDir,
      initialApiKey: initialKey,
      host: '127.0.0.1'
    });
    boundServerUrl = embeddedServer.url;
    console.log(`[Embedded Server] Running on loopback: ${boundServerUrl}`);
  } catch (err) {
    console.warn('Failed to start embedded server, falling back to static loadFile:', err);
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

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (embeddedServer) {
    embeddedServer.close().catch(() => {});
  }
});

// Second instance focus
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Crash resilience
process.on('uncaughtException', (error) => {
  console.error('Unhandled Electron Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Electron Rejection:', reason);
});

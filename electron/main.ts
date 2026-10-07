import { app, BrowserWindow, ipcMain, shell, dialog, nativeTheme, globalShortcut } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import type {
  SystemInfo,
  FileWriteOptions,
  FileWriteResult,
  DirectoryEnsureResult,
  DirectoryListResult,
  DesktopPrintOptions
} from './types';

// Enforce single instance lock on Windows
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

// Determine environment
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';

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

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Intercept new window requests and open securely in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Load URL or packaged dist/index.html
  if (isDev && !process.env.ELECTRON_START_DIST) {
    mainWindow.loadURL(devServerUrl).catch(() => {
      // Fallback to local dist if dev server was offline
      const indexPath = path.join(__dirname, '../dist/index.html');
      if (fs.existsSync(indexPath)) {
        mainWindow?.loadFile(indexPath);
      }
    });
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
  }

  // Register desktop global shortcuts
  setupShortcuts();
}

/**
 * Configure Windows Desktop Shortcuts
 */
function setupShortcuts(): void {
  // Note: Local accelerators within BrowserWindow are preferred over system-wide shortcuts
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
 * Register Secure IPC Handlers
 */
function setupIpcHandlers(): void {
  // System Info
  ipcMain.handle('app:get-system-info', (): SystemInfo => {
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

  // Local Directory Ensure (for WhatsApp Educational Hub paths, e.g. D:/ThanaweyaAmma_2027/...)
  ipcMain.handle('fs:ensure-directory', async (_event, dirPath: string): Promise<DirectoryEnsureResult> => {
    try {
      if (!dirPath || typeof dirPath !== 'string') {
        return { success: false, path: dirPath, created: false, error: 'Invalid directory path' };
      }
      const normalized = path.normalize(dirPath);
      if (!fs.existsSync(normalized)) {
        await fs.promises.mkdir(normalized, { recursive: true });
        return { success: true, path: normalized, created: true };
      }
      return { success: true, path: normalized, created: false };
    } catch (err: any) {
      return { success: false, path: dirPath, created: false, error: err?.message || 'Directory creation failed' };
    }
  });

  // Check path existence
  ipcMain.handle('fs:check-exists', (_event, targetPath: string): boolean => {
    try {
      if (!targetPath) return false;
      return fs.existsSync(path.normalize(targetPath));
    } catch {
      return false;
    }
  });

  // Write local file (atomic write)
  ipcMain.handle(
    'fs:write-file',
    async (
      _event,
      args: { filePath: string; content: string; isBinary?: boolean; options?: FileWriteOptions }
    ): Promise<FileWriteResult> => {
      try {
        const { filePath, content, isBinary } = args;
        const normalized = path.normalize(filePath);
        const parentDir = path.dirname(normalized);

        if (!fs.existsSync(parentDir)) {
          await fs.promises.mkdir(parentDir, { recursive: true });
        }

        const buffer = isBinary
          ? Buffer.from(content, 'base64')
          : Buffer.from(content, 'utf-8');

        // Atomic write via temp file
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

  // List Directory contents
  ipcMain.handle('fs:list-directory', async (_event, dirPath: string): Promise<DirectoryListResult> => {
    try {
      const normalized = path.normalize(dirPath);
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

  // Open folder in native Windows Explorer
  ipcMain.handle('fs:open-folder-explorer', async (_event, folderPath: string): Promise<boolean> => {
    try {
      if (!folderPath) return false;
      const normalized = path.normalize(folderPath);
      if (!fs.existsSync(normalized)) {
        await fs.promises.mkdir(normalized, { recursive: true });
      }
      const result = await shell.openPath(normalized);
      return result === ''; // Empty string indicates success in Electron
    } catch {
      return false;
    }
  });

  // Open External URL
  ipcMain.handle('shell:open-external', async (_event, url: string): Promise<boolean> => {
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

  // Native Open Dialog
  ipcMain.handle('dialog:show-open', async (_event, options: any) => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, options || {});
    return result.canceled ? null : result.filePaths;
  });

  // Native Save Dialog
  ipcMain.handle('dialog:show-save', async (_event, options: any) => {
    if (!mainWindow) return null;
    const result = await dialog.showSaveDialog(mainWindow, options || {});
    return result.canceled ? null : result.filePath;
  });

  // Native A4 Print Engine
  ipcMain.handle('app:print-a4', async (_event, options?: DesktopPrintOptions): Promise<{ success: boolean; error?: string }> => {
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

  // Window Controls
  ipcMain.on('window:minimize', () => {
    mainWindow?.minimize();
  });
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window:close', () => {
    mainWindow?.close();
  });
}

// App lifecycle
app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On Windows, quit when all windows closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
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

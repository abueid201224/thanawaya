var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron = require("electron");
var path = __toESM(require("path"), 1);
var fs = __toESM(require("fs"), 1);
var gotTheLock = import_electron.app.requestSingleInstanceLock();
if (!gotTheLock) {
  import_electron.app.quit();
}
var mainWindow = null;
var isDev = process.env.NODE_ENV === "development" || !import_electron.app.isPackaged;
var devServerUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:3000";
function createWindow() {
  import_electron.nativeTheme.themeSource = "light";
  const candidateIcons = [
    path.join(__dirname, "../build/icon.ico"),
    path.join(__dirname, "../build/icon.png"),
    path.join(__dirname, "../build/icon.svg"),
    path.join(__dirname, "../public/icon.svg")
  ];
  const iconPath = candidateIcons.find((p) => fs.existsSync(p));
  mainWindow = new import_electron.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: "#F8FAFC",
    show: false,
    // Show gracefully once ready-to-show
    icon: iconPath || void 0,
    autoHideMenuBar: true,
    title: "Thanaweya Amma Math Copilot - \u062B\u0627\u0646\u0648\u064A\u0629 \u0639\u0627\u0645\u0629 \u0639\u0644\u0645\u064A \u0631\u064A\u0627\u0636\u0629",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: true
    }
  });
  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      import_electron.shell.openExternal(url);
    }
    return { action: "deny" };
  });
  if (isDev && !process.env.ELECTRON_START_DIST) {
    mainWindow.loadURL(devServerUrl).catch(() => {
      const indexPath = path.join(__dirname, "../dist/index.html");
      if (fs.existsSync(indexPath)) {
        mainWindow?.loadFile(indexPath);
      }
    });
  } else {
    const indexPath = path.join(__dirname, "../dist/index.html");
    mainWindow.loadFile(indexPath);
  }
  setupShortcuts();
}
function setupShortcuts() {
  if (mainWindow) {
    mainWindow.webContents.on("before-input-event", (event, input) => {
      if (input.control && input.key.toLowerCase() === "p" && input.type === "keyDown") {
        event.preventDefault();
        mainWindow?.webContents.send("desktop:shortcut-print");
      }
      if (input.control && input.key.toLowerCase() === "f" && input.type === "keyDown") {
        event.preventDefault();
        mainWindow?.webContents.send("desktop:shortcut-search");
      }
      if (input.key === "Escape" && input.type === "keyDown") {
        mainWindow?.webContents.send("desktop:shortcut-escape");
      }
    });
  }
}
function setupIpcHandlers() {
  import_electron.ipcMain.handle("app:get-system-info", () => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: import_electron.app.getVersion(),
      electronVersion: process.versions.electron || "",
      nodeVersion: process.versions.node || "",
      isPackaged: import_electron.app.isPackaged,
      appDataDir: import_electron.app.getPath("userData"),
      homeDir: import_electron.app.getPath("home")
    };
  });
  import_electron.ipcMain.handle("fs:ensure-directory", async (_event, dirPath) => {
    try {
      if (!dirPath || typeof dirPath !== "string") {
        return { success: false, path: dirPath, created: false, error: "Invalid directory path" };
      }
      const normalized = path.normalize(dirPath);
      if (!fs.existsSync(normalized)) {
        await fs.promises.mkdir(normalized, { recursive: true });
        return { success: true, path: normalized, created: true };
      }
      return { success: true, path: normalized, created: false };
    } catch (err) {
      return { success: false, path: dirPath, created: false, error: err?.message || "Directory creation failed" };
    }
  });
  import_electron.ipcMain.handle("fs:check-exists", (_event, targetPath) => {
    try {
      if (!targetPath) return false;
      return fs.existsSync(path.normalize(targetPath));
    } catch {
      return false;
    }
  });
  import_electron.ipcMain.handle(
    "fs:write-file",
    async (_event, args) => {
      try {
        const { filePath, content, isBinary } = args;
        const normalized = path.normalize(filePath);
        const parentDir = path.dirname(normalized);
        if (!fs.existsSync(parentDir)) {
          await fs.promises.mkdir(parentDir, { recursive: true });
        }
        const buffer = isBinary ? Buffer.from(content, "base64") : Buffer.from(content, "utf-8");
        const tempPath = `${normalized}.tmp_${Date.now()}`;
        await fs.promises.writeFile(tempPath, buffer);
        await fs.promises.rename(tempPath, normalized);
        return {
          success: true,
          filePath: normalized,
          bytesWritten: buffer.length
        };
      } catch (err) {
        return {
          success: false,
          filePath: args.filePath,
          error: err?.message || "File write failed"
        };
      }
    }
  );
  import_electron.ipcMain.handle("fs:list-directory", async (_event, dirPath) => {
    try {
      const normalized = path.normalize(dirPath);
      if (!fs.existsSync(normalized)) {
        return { success: false, path: normalized, files: [], error: "Directory does not exist" };
      }
      const entries = await fs.promises.readdir(normalized, { withFileTypes: true });
      const files = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(normalized, entry.name);
          let size = 0;
          let modifiedAt = (/* @__PURE__ */ new Date()).toISOString();
          try {
            const stats = await fs.promises.stat(fullPath);
            size = stats.size;
            modifiedAt = stats.mtime.toISOString();
          } catch {
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
    } catch (err) {
      return { success: false, path: dirPath, files: [], error: err?.message || "List directory failed" };
    }
  });
  import_electron.ipcMain.handle("fs:open-folder-explorer", async (_event, folderPath) => {
    try {
      if (!folderPath) return false;
      const normalized = path.normalize(folderPath);
      if (!fs.existsSync(normalized)) {
        await fs.promises.mkdir(normalized, { recursive: true });
      }
      const result = await import_electron.shell.openPath(normalized);
      return result === "";
    } catch {
      return false;
    }
  });
  import_electron.ipcMain.handle("shell:open-external", async (_event, url) => {
    try {
      if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("mailto:")) {
        return false;
      }
      await import_electron.shell.openExternal(url);
      return true;
    } catch {
      return false;
    }
  });
  import_electron.ipcMain.handle("dialog:show-open", async (_event, options) => {
    if (!mainWindow) return null;
    const result = await import_electron.dialog.showOpenDialog(mainWindow, options || {});
    return result.canceled ? null : result.filePaths;
  });
  import_electron.ipcMain.handle("dialog:show-save", async (_event, options) => {
    if (!mainWindow) return null;
    const result = await import_electron.dialog.showSaveDialog(mainWindow, options || {});
    return result.canceled ? null : result.filePath;
  });
  import_electron.ipcMain.handle("app:print-a4", async (_event, options) => {
    return new Promise((resolve) => {
      if (!mainWindow) {
        resolve({ success: false, error: "Window not available" });
        return;
      }
      mainWindow.webContents.print(
        {
          silent: options?.silent ?? false,
          printBackground: true,
          pageSize: options?.pageSize || "A4",
          color: options?.color ?? true,
          margins: {
            marginType: "custom",
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
  import_electron.ipcMain.on("window:minimize", () => {
    mainWindow?.minimize();
  });
  import_electron.ipcMain.on("window:maximize", () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  import_electron.ipcMain.on("window:close", () => {
    mainWindow?.close();
  });
}
import_electron.app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();
  import_electron.app.on("activate", () => {
    if (import_electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron.app.quit();
  }
});
import_electron.app.on("will-quit", () => {
  import_electron.globalShortcut.unregisterAll();
});
import_electron.app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});
process.on("uncaughtException", (error) => {
  console.error("Unhandled Electron Exception:", error);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Electron Rejection:", reason);
});
//# sourceMappingURL=main.cjs.map

// electron/preload.ts
var import_electron = require("electron");
var api = {
  isElectron: true,
  getSystemInfo: () => {
    return import_electron.ipcRenderer.invoke("app:get-system-info");
  },
  ensureDirectory: (dirPath) => {
    return import_electron.ipcRenderer.invoke("fs:ensure-directory", dirPath);
  },
  checkPathExists: (targetPath) => {
    return import_electron.ipcRenderer.invoke("fs:check-exists", targetPath);
  },
  writeLocalFile: (filePath, content, isBinary = false, options) => {
    return import_electron.ipcRenderer.invoke("fs:write-file", { filePath, content, isBinary, options });
  },
  listDirectory: (dirPath) => {
    return import_electron.ipcRenderer.invoke("fs:list-directory", dirPath);
  },
  openFolderInExplorer: (folderPath) => {
    return import_electron.ipcRenderer.invoke("fs:open-folder-explorer", folderPath);
  },
  openExternalUrl: (url) => {
    return import_electron.ipcRenderer.invoke("shell:open-external", url);
  },
  showOpenDialog: (options) => {
    return import_electron.ipcRenderer.invoke("dialog:show-open", options);
  },
  showSaveDialog: (options) => {
    return import_electron.ipcRenderer.invoke("dialog:show-save", options);
  },
  printA4Document: (options) => {
    return import_electron.ipcRenderer.invoke("app:print-a4", options);
  },
  minimizeWindow: () => {
    import_electron.ipcRenderer.send("window:minimize");
  },
  maximizeWindow: () => {
    import_electron.ipcRenderer.send("window:maximize");
  },
  closeWindow: () => {
    import_electron.ipcRenderer.send("window:close");
  },
  onShortcut: (shortcut, callback) => {
    const channelMap = {
      print: "desktop:shortcut-print",
      search: "desktop:shortcut-search",
      escape: "desktop:shortcut-escape"
    };
    const channel = channelMap[shortcut];
    const listener = () => callback();
    import_electron.ipcRenderer.on(channel, listener);
    return () => {
      import_electron.ipcRenderer.removeListener(channel, listener);
    };
  },
  getApiKeyStatus: () => {
    return import_electron.ipcRenderer.invoke("secrets:get-api-key-status");
  },
  saveApiKey: (apiKey) => {
    return import_electron.ipcRenderer.invoke("secrets:save-api-key", apiKey);
  },
  removeApiKey: () => {
    return import_electron.ipcRenderer.invoke("secrets:remove-api-key");
  },
  testApiKey: (apiKey) => {
    return import_electron.ipcRenderer.invoke("secrets:test-api-key", apiKey);
  },
  getEmbeddedServerUrl: () => {
    return import_electron.ipcRenderer.invoke("app:get-embedded-server-url");
  }
};
import_electron.contextBridge.exposeInMainWorld("electronAPI", api);
//# sourceMappingURL=preload.cjs.map

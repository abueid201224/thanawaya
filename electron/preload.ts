import { contextBridge, ipcRenderer } from 'electron';
import type {
  ElectronAPIContract,
  SystemInfo,
  FileWriteOptions,
  FileWriteResult,
  DirectoryEnsureResult,
  DirectoryListResult,
  DesktopPrintOptions
} from './types';

/**
 * Preload script for Thanaweya Amma Math Copilot
 * Enforces strict Context Isolation and Node Integration boundary
 */
const api: ElectronAPIContract = {
  isElectron: true,

  getSystemInfo: (): Promise<SystemInfo> => {
    return ipcRenderer.invoke('app:get-system-info');
  },

  ensureDirectory: (dirPath: string): Promise<DirectoryEnsureResult> => {
    return ipcRenderer.invoke('fs:ensure-directory', dirPath);
  },

  checkPathExists: (targetPath: string): Promise<boolean> => {
    return ipcRenderer.invoke('fs:check-exists', targetPath);
  },

  writeLocalFile: (
    filePath: string,
    content: string,
    isBinary: boolean = false,
    options?: FileWriteOptions
  ): Promise<FileWriteResult> => {
    return ipcRenderer.invoke('fs:write-file', { filePath, content, isBinary, options });
  },

  listDirectory: (dirPath: string): Promise<DirectoryListResult> => {
    return ipcRenderer.invoke('fs:list-directory', dirPath);
  },

  openFolderInExplorer: (folderPath: string): Promise<boolean> => {
    return ipcRenderer.invoke('fs:open-folder-explorer', folderPath);
  },

  openExternalUrl: (url: string): Promise<boolean> => {
    return ipcRenderer.invoke('shell:open-external', url);
  },

  showOpenDialog: (options?: { title?: string; defaultPath?: string; properties?: string[] }): Promise<string[] | null> => {
    return ipcRenderer.invoke('dialog:show-open', options);
  },

  showSaveDialog: (options?: { title?: string; defaultPath?: string; filters?: { name: string; extensions: string[] }[] }): Promise<string | null> => {
    return ipcRenderer.invoke('dialog:show-save', options);
  },

  printA4Document: (options?: DesktopPrintOptions): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('app:print-a4', options);
  },

  minimizeWindow: (): void => {
    ipcRenderer.send('window:minimize');
  },

  maximizeWindow: (): void => {
    ipcRenderer.send('window:maximize');
  },

  closeWindow: (): void => {
    ipcRenderer.send('window:close');
  },

  onShortcut: (shortcut: 'print' | 'search' | 'escape', callback: () => void): (() => void) => {
    const channelMap = {
      print: 'desktop:shortcut-print',
      search: 'desktop:shortcut-search',
      escape: 'desktop:shortcut-escape'
    };
    const channel = channelMap[shortcut];
    const listener = () => callback();
    ipcRenderer.on(channel, listener);
    return () => {
      ipcRenderer.removeListener(channel, listener);
    };
  }
};

contextBridge.exposeInMainWorld('electronAPI', api);

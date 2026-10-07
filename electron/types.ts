/**
 * IPC Types and Communication Contracts between Electron Main & Renderer Processes
 * for Thanaweya Amma Math Copilot
 */

export interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  electronVersion: string;
  nodeVersion: string;
  isPackaged: boolean;
  appDataDir: string;
  homeDir: string;
}

export interface FileWriteOptions {
  atomic?: boolean;
  overwrite?: boolean;
  createDirs?: boolean;
}

export interface FileWriteResult {
  success: boolean;
  filePath: string;
  bytesWritten?: number;
  error?: string;
}

export interface DirectoryEnsureResult {
  success: boolean;
  path: string;
  created: boolean;
  error?: string;
}

export interface DirectoryListResult {
  success: boolean;
  path: string;
  files: Array<{
    name: string;
    isDirectory: boolean;
    size: number;
    modifiedAt: string;
  }>;
  error?: string;
}

export interface DesktopPrintOptions {
  silent?: boolean;
  pageSize?: 'A4' | 'Letter';
  marginsType?: number;
  color?: boolean;
}

export interface ApiKeyStatus {
  isConfigured: boolean;
  isEncryptionAvailable: boolean;
  maskedKey: string | null;
  storageType: 'dpapi' | 'plaintext_fallback' | 'unconfigured';
}

export interface ApiKeyTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
}

export interface ElectronAPIContract {
  getSystemInfo: () => Promise<SystemInfo>;
  ensureDirectory: (dirPath: string) => Promise<DirectoryEnsureResult>;
  checkPathExists: (targetPath: string) => Promise<boolean>;
  writeLocalFile: (filePath: string, contentBase64OrUtf8: string, isBinary?: boolean, options?: FileWriteOptions) => Promise<FileWriteResult>;
  listDirectory: (dirPath: string) => Promise<DirectoryListResult>;
  openFolderInExplorer: (folderPath: string) => Promise<boolean>;
  openExternalUrl: (url: string) => Promise<boolean>;
  showOpenDialog: (options?: { title?: string; defaultPath?: string; properties?: string[] }) => Promise<string[] | null>;
  showSaveDialog: (options?: { title?: string; defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) => Promise<string | null>;
  printA4Document: (options?: DesktopPrintOptions) => Promise<{ success: boolean; error?: string }>;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  onShortcut?: (shortcut: 'print' | 'search' | 'escape', callback: () => void) => () => void;
  getApiKeyStatus: () => Promise<ApiKeyStatus>;
  saveApiKey: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
  removeApiKey: () => Promise<{ success: boolean }>;
  testApiKey: (apiKey?: string) => Promise<ApiKeyTestResult>;
  getEmbeddedServerUrl: () => Promise<string>;
  isElectron: boolean;
}

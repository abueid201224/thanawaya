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
  storageType: 'dpapi' | 'unconfigured';
}

export interface ModelConfig {
  currentModel: string;
  defaultModel: string;
  userConfiguredModel: string | null;
  envModel: string | null;
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
  onShortcut?: (shortcut: 'print' | 'search' | 'escape' | 'settings', callback: () => void) => () => void;
  getApiKeyStatus: () => Promise<ApiKeyStatus>;
  saveApiKey: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
  removeApiKey: () => Promise<{ success: boolean }>;
  testApiKey: (apiKey?: string) => Promise<ApiKeyTestResult>;
  getModelConfig: () => Promise<ModelConfig>;
  saveModelConfig: (model: string) => Promise<{ success: boolean; currentModel: string; error?: string }>;
  getEmbeddedServerUrl: () => Promise<string>;
  studyDb?: {
    getSources: () => Promise<{ ok: boolean; sources?: any[]; error?: string }>;
    getCurriculum: () => Promise<{ ok: boolean; units?: any[]; error?: string }>;
    recordAttempt: (payload: any) => Promise<{ ok: boolean; attempt?: any; error?: string }>;
    getAttempts: (limit?: number) => Promise<{ ok: boolean; attempts?: any[]; error?: string }>;
    captureMistake: (payload: any) => Promise<{ ok: boolean; mistake?: any; error?: string }>;
    getMistakes: () => Promise<{ ok: boolean; mistakes?: any[]; error?: string }>;
    updateMistake: (mistakeId: string, errorType: string, studentNote?: string) => Promise<{ ok: boolean; mistake?: any; error?: string }>;
    recordReview: (mistakeId: string, wasCorrect: boolean) => Promise<{ ok: boolean; mistake?: any; error?: string }>;
    getSpacedIntervals: () => Promise<{ ok: boolean; intervals?: number[]; error?: string }>;
    saveSpacedIntervals: (intervals: number[]) => Promise<{ ok: boolean; intervals?: number[]; error?: string }>;
    getOutbox?: (limit?: number) => Promise<{ ok: boolean; entries?: any[]; stats?: { pendingCount: number; syncedCount: number; failedCount: number }; error?: string }>;
    ackOutbox?: (outboxId: string) => Promise<{ ok: boolean; stats?: { pendingCount: number; syncedCount: number; failedCount: number }; error?: string }>;
    failOutbox?: (outboxId: string, error: string) => Promise<{ ok: boolean; retryCount?: number; nextRetryAt?: string; status?: string; stats?: { pendingCount: number; syncedCount: number; failedCount: number }; error?: string }>;
    getSchedule?: () => Promise<{ ok: boolean; slots?: any[]; updatedAt?: string | null; error?: string }>;
    saveSchedule?: (slots: unknown[]) => Promise<{ ok: boolean; slots?: any[]; updatedAt?: string; error?: string }>;
  };
  isElectron: boolean;
}

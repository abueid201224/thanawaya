import type { ElectronAPIContract } from '../../electron/types';

declare global {
  interface Window {
    electronAPI?: ElectronAPIContract;
  }
}

export {};

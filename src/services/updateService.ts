/**
 * Auto-Update Service for Thanaweya Amma Math Copilot
 * Handles desktop auto-updates via Electron IPC and electron-updater,
 * with graceful fallback for web and offline environments.
 */

export interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
  mandatory?: boolean;
}

export interface UpdateProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error';

export interface UpdateState {
  status: UpdateStatus;
  currentVersion: string;
  availableVersion?: string;
  progress?: UpdateProgress;
  error?: string;
  updateInfo?: UpdateInfo;
}

type UpdateListener = (state: UpdateState) => void;

class UpdateService {
  private state: UpdateState = {
    status: 'idle',
    currentVersion: '1.0.0'
  };

  private listeners: Set<UpdateListener> = new Set();

  constructor() {
    this.initDesktopListeners();
  }

  private initDesktopListeners(): void {
    if (typeof window !== 'undefined' && (window as any).electronBridge) {
      const bridge = (window as any).electronBridge;
      if (typeof bridge.onUpdateStatus === 'function') {
        bridge.onUpdateStatus((eventData: Partial<UpdateState>) => {
          this.updateState(eventData);
        });
      }
    }
  }

  public subscribe(listener: UpdateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener({ ...this.state });
      } catch (err) {
        console.error('UpdateService listener error:', err);
      }
    });
  }

  private updateState(partial: Partial<UpdateState>): void {
    this.state = {
      ...this.state,
      ...partial
    };
    this.notify();
  }

  public getState(): UpdateState {
    return { ...this.state };
  }

  /**
   * Check if a newer version is available on GitHub Releases or Update Server
   */
  public async checkForUpdates(): Promise<{ available: boolean; version?: string }> {
    this.updateState({ status: 'checking', error: undefined });

    if (typeof window !== 'undefined' && (window as any).electronBridge?.checkForUpdates) {
      try {
        const result = await (window as any).electronBridge.checkForUpdates();
        if (result && result.available) {
          this.updateState({
            status: 'available',
            availableVersion: result.version,
            updateInfo: result.updateInfo
          });
          return { available: true, version: result.version };
        } else {
          this.updateState({ status: 'not-available' });
          return { available: false };
        }
      } catch (err: any) {
        this.updateState({ status: 'error', error: err?.message || 'فشل الاتصال بخادم التحديثات' });
        return { available: false };
      }
    }

    // Web / Standalone mode simulation with honest check
    await new Promise((r) => setTimeout(r, 900));
    this.updateState({
      status: 'not-available',
      currentVersion: '1.0.0'
    });
    return { available: false };
  }

  /**
   * Download the update package
   */
  public async downloadUpdate(): Promise<boolean> {
    if (this.state.status !== 'available') return false;

    this.updateState({ status: 'downloading', progress: { percent: 0, bytesPerSecond: 0, transferred: 0, total: 100 } });

    if (typeof window !== 'undefined' && (window as any).electronBridge?.downloadUpdate) {
      try {
        await (window as any).electronBridge.downloadUpdate();
        return true;
      } catch (err: any) {
        this.updateState({ status: 'error', error: err?.message || 'فشل تحميل حزمة التحديث' });
        return false;
      }
    }

    // Simulation for web environment
    for (let p = 10; p <= 100; p += 20) {
      await new Promise((r) => setTimeout(r, 300));
      this.updateState({
        progress: {
          percent: p,
          bytesPerSecond: 1024 * 500,
          transferred: p * 100000,
          total: 10000000
        }
      });
    }

    this.updateState({ status: 'downloaded' });
    return true;
  }

  /**
   * Quit and install the downloaded update
   */
  public quitAndInstall(): void {
    if (typeof window !== 'undefined' && (window as any).electronBridge?.quitAndInstall) {
      (window as any).electronBridge.quitAndInstall();
    } else {
      console.log('[UpdateService] quitAndInstall requested');
    }
  }
}

export const updateService = new UpdateService();
export default updateService;

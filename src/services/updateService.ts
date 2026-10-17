/**
 * Auto-Update Service for Thanaweya Amma Math Copilot
 * 
 * Handles checking for updates, downloading, and installing new versions
 * Uses electron-updater for seamless auto-update experience
 */

import { autoUpdater, UpdateCheckResult } from 'electron-updater';
import { app, dialog, BrowserWindow, MessageBoxOptions } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

interface UpdateConfig {
  feedUrl: string;
  checkInterval: number;
  autoDownload: boolean;
  autoInstall: boolean;
}

const DEFAULT_CONFIG: UpdateConfig = {
  feedUrl: 'https://thanaweya-copilot-updates.example.com/updates',
  checkInterval: 60 * 60 * 1000, // 1 hour
  autoDownload: true,
  autoInstall: false // Let user choose when to install
};

class UpdateService {
  private config: UpdateConfig;
  private mainWindow: BrowserWindow | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private isChecking = false;

  constructor(config: Partial<UpdateConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Configure autoUpdater
    autoUpdater.setFeedURL(this.config.feedUrl);
    
    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set the main window reference for update notifications
   */
  public setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
  }

  /**
   * Start automatic update checking
   */
  public startAutoCheck(): void {
    if (this.checkInterval) {
      return; // Already running
    }

    // Check immediately on start
    this.checkForUpdates();

    // Set up periodic checking
    this.checkInterval = setInterval(() => {
      this.checkForUpdates();
    }, this.config.checkInterval);

    console.log(`[UpdateService] Auto-update checker started (interval: ${this.config.checkInterval}ms)`);
  }

  /**
   * Stop automatic update checking
   */
  public stopAutoCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[UpdateService] Auto-update checker stopped');
    }
  }

  /**
   * Manually check for updates
   */
  public async checkForUpdates(): Promise<void> {
    if (this.isChecking) {
      console.log('[UpdateService] Update check already in progress');
      return;
    }

    this.isChecking = true;
    
    try {
      console.log('[UpdateService] Checking for updates...');
      
      const updateCheck: UpdateCheckResult | null = await autoUpdater.checkForUpdates();
      
      if (!updateCheck) {
        console.log('[UpdateService] No updates available');
        return;
      }

      if (updateCheck.updateInfo) {
        console.log(`[UpdateService] Update available: ${updateCheck.updateInfo.version}`);
        this.handleUpdateAvailable(updateCheck.updateInfo.version, updateCheck.updateInfo.releaseNotes as string);
      }
    } catch (error) {
      console.error('[UpdateService] Error checking for updates:', error);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Download and install the latest update
   */
  public async downloadAndInstall(): Promise<void> {
    try {
      console.log('[UpdateService] Starting download...');
      
      // Show download progress
      autoUpdater.on('download-progress', (progressObj) => {
        this.sendStatusToWindow('download-progress', {
          percent: Math.round(progressObj.percent),
          bytesPerSecond: progressObj.bytesPerSecond,
          transferred: progressObj.transferred,
          total: progressObj.total
        });
      });

      const downloadResult = await autoUpdater.downloadUpdate();
      
      if (downloadResult) {
        console.log('[UpdateService] Download completed, ready to install');
        this.handleDownloadComplete();
      }
    } catch (error) {
      console.error('[UpdateService] Error downloading update:', error);
      this.sendStatusToWindow('error', {
        message: 'فشل تحميل التحديث. يرجى المحاولة مرة أخرى لاحقاً.'
      });
    }
  }

  /**
   * Install the downloaded update and restart
   */
  public installUpdate(): void {
    console.log('[UpdateService] Installing update...');
    
    autoUpdater.quitAndInstall();
  }

  /**
   * Get current version
   */
  public getCurrentVersion(): string {
    return app.getVersion();
  }

  /**
   * Set up autoUpdater event listeners
   */
  private setupEventListeners(): void {
    // Update available
    autoUpdater.on('update-available', (info) => {
      console.log(`[UpdateService] Update available: ${info.version}`);
      this.handleUpdateAvailable(info.version, info.releaseNotes as string);
    });

    // Update not available
    autoUpdater.on('update-not-available', (info) => {
      console.log('[UpdateService] Update not available');
      this.sendStatusToWindow('up-to-date', {
        message: 'إصدارك الحالي هو أحدث إصدار.'
      });
    });

    // Error
    autoUpdater.on('error', (error: Error) => {
      console.error('[UpdateService] Update error:', error);
      this.sendStatusToWindow('error', {
        message: 'حدث خطأ أثناء التحقق من التحديثات.'
      });
    });

    // Download progress
    autoUpdater.on('download-progress', (progressObj) => {
      this.sendStatusToWindow('download-progress', {
        percent: Math.round(progressObj.percent),
        bytesPerSecond: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total
      });
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      console.log(`[UpdateService] Update downloaded: ${info.version}`);
      this.handleDownloadComplete();
    });
  }

  /**
   * Handle update available event
   */
  private handleUpdateAvailable(version: string, releaseNotes: string): void {
    console.log(`[UpdateService] Handling update available: ${version}`);
    
    this.sendStatusToWindow('update-available', {
      version,
      releaseNotes: releaseNotes || '',
      currentVersion: this.getCurrentVersion()
    });

    // Show notification to user
    if (this.mainWindow) {
      this.mainWindow.webContents.send('update:available', {
        version,
        releaseNotes: releaseNotes || '',
        currentVersion: this.getCurrentVersion()
      });
    }
  }

  /**
   * Handle download complete event
   */
  private handleDownloadComplete(): void {
    console.log('[UpdateService] Handling download complete');
    
    this.sendStatusToWindow('update-downloaded', {
      message: 'تم تحميل التحديث. جاهز للتثبيت.'
    });

    if (this.mainWindow) {
      this.mainWindow.webContents.send('update:downloaded', {
        message: 'تم تحميل التحديث. جاهز للتثبيت.'
      });
    }
  }

  /**
   * Send status to main window
   */
  private sendStatusToWindow(event: string, data: any): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send(`update:${event}`, data);
    }
  }

  /**
   * Show update dialog to user
   */
  public showUpdateDialog(version: string, releaseNotes: string): void {
    if (!this.mainWindow) return;

    const options: MessageBoxOptions = {
      type: 'info',
      title: 'تحديث متاح',
      message: `الإصدار ${version} متاح الآن.`,
      detail: releaseNotes || 'يحتوي هذا التحديث على تحسينات واصلاحات مهمة.',
      buttons: ['تثبيت الآن', 'لاحقاً', 'تجاهل'],
      cancelId: 1,
      defaultId: 0
    };

    dialog.showMessageBox(this.mainWindow, options).then((result) => {
      if (result.response === 0) {
        // Install now
        this.downloadAndInstall();
      } else if (result.response === 2) {
        // Ignore this version - not available in electron-updater v6
        // This would need to be tracked manually
        console.log('[UpdateService] User chose to ignore this update version');
      }
    });
  }
}

// Singleton instance
export const updateService = new UpdateService();
export default updateService;

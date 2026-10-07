/**
 * Native Desktop Bridge for Thanaweya Amma Math Copilot
 * Provides seamless integration between React UI and Windows Electron Native APIs
 * with zero-crash browser fallback.
 */

import type {
  SystemInfo,
  DirectoryEnsureResult,
  FileWriteResult,
  ApiKeyStatus,
  ApiKeyTestResult
} from '../../electron/types';

class NativeDesktopBridge {
  public get isNativeDesktop(): boolean {
    return typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron);
  }

  /**
   * Get native Windows system and Electron metadata
   */
  public async getSystemInfo(): Promise<SystemInfo | null> {
    if (this.isNativeDesktop && window.electronAPI) {
      try {
        return await window.electronAPI.getSystemInfo();
      } catch (err) {
        console.warn('Failed to retrieve system info:', err);
      }
    }
    return null;
  }

  /**
   * Ensures educational library folder path exists on Windows drive (e.g. D:/ThanaweyaAmma_2027/...)
   */
  public async ensureDirectory(dirPath: string): Promise<DirectoryEnsureResult> {
    if (this.isNativeDesktop && window.electronAPI) {
      try {
        return await window.electronAPI.ensureDirectory(dirPath);
      } catch (err: any) {
        return { success: false, path: dirPath, created: false, error: err?.message };
      }
    }
    // Web fallback
    return { success: true, path: dirPath, created: false };
  }

  /**
   * Opens the folder directly in native Windows File Explorer
   */
  public async openFolderInExplorer(folderPath: string): Promise<boolean> {
    if (this.isNativeDesktop && window.electronAPI) {
      try {
        return await window.electronAPI.openFolderInExplorer(folderPath);
      } catch (err) {
        console.warn('Failed to open folder in explorer:', err);
      }
    }
    // Web fallback: copy to clipboard
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(folderPath);
    }
    return false;
  }

  /**
   * Opens web link securely in default OS browser
   */
  public async openExternalUrl(url: string): Promise<boolean> {
    if (this.isNativeDesktop && window.electronAPI) {
      try {
        return await window.electronAPI.openExternalUrl(url);
      } catch (err) {
        console.warn('Failed to open external url:', err);
      }
    }
    // Web fallback
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }

  /**
   * Writes local media file or worksheet to disk
   */
  public async saveLocalFile(
    filePath: string,
    content: string,
    isBinary: boolean = false
  ): Promise<FileWriteResult> {
    if (this.isNativeDesktop && window.electronAPI) {
      try {
        return await window.electronAPI.writeLocalFile(filePath, content, isBinary);
      } catch (err: any) {
        return { success: false, filePath, error: err?.message };
      }
    }
    return { success: false, filePath, error: 'Not running in native desktop environment' };
  }

  /**
   * Triggers native A4 printing
   */
  public async printA4Document(): Promise<{ success: boolean; error?: string }> {
    if (this.isNativeDesktop && window.electronAPI) {
      try {
        return await window.electronAPI.printA4Document({ pageSize: 'A4', color: true });
      } catch (err: any) {
        return { success: false, error: err?.message };
      }
    }
    // Browser fallback
    window.print();
    return { success: true };
  }

  /**
   * Listen to native desktop shortcut events forwarded by Electron Main process
   */
  public onShortcut(shortcut: 'print' | 'search' | 'escape', callback: () => void): () => void {
    if (this.isNativeDesktop && window.electronAPI?.onShortcut) {
      try {
        return window.electronAPI.onShortcut(shortcut, callback);
      } catch (err) {
        console.warn('Failed to bind native shortcut:', err);
      }
    }
    return () => {};
  }

  /**
   * Get secure storage status for Gemini API key (Windows DPAPI)
   */
  public async getApiKeyStatus(): Promise<ApiKeyStatus> {
    if (this.isNativeDesktop && window.electronAPI?.getApiKeyStatus) {
      try {
        return await window.electronAPI.getApiKeyStatus();
      } catch (err) {
        console.warn('Failed to fetch native API key status:', err);
      }
    }

    // Web fallback: check backend endpoint or session
    try {
      const res = await fetch('/api/key-status');
      if (res.ok) {
        const data = await res.json();
        return {
          isConfigured: Boolean(data.isConfigured),
          isEncryptionAvailable: false,
          maskedKey: data.prefix ? `${data.prefix}****` : null,
          storageType: 'plaintext_fallback'
        };
      }
    } catch {
      // ignore
    }

    return {
      isConfigured: false,
      isEncryptionAvailable: false,
      maskedKey: null,
      storageType: 'unconfigured'
    };
  }

  /**
   * Save Gemini API Key securely using Windows DPAPI encryption
   */
  public async saveApiKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
    if (this.isNativeDesktop && window.electronAPI?.saveApiKey) {
      try {
        return await window.electronAPI.saveApiKey(apiKey);
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to save key in desktop safeStorage' };
      }
    }

    // Web fallback: note to user
    return {
      success: true
    };
  }

  /**
   * Remove stored encrypted API key
   */
  public async removeApiKey(): Promise<{ success: boolean }> {
    if (this.isNativeDesktop && window.electronAPI?.removeApiKey) {
      try {
        return await window.electronAPI.removeApiKey();
      } catch {
        return { success: false };
      }
    }
    return { success: true };
  }

  /**
   * Test the validity of a Gemini API key
   */
  public async testApiKey(candidateKey?: string): Promise<ApiKeyTestResult> {
    if (this.isNativeDesktop && window.electronAPI?.testApiKey) {
      try {
        return await window.electronAPI.testApiKey(candidateKey);
      } catch (err: any) {
        return { success: false, message: err?.message || 'IPC test call failed' };
      }
    }

    // Web fallback test
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        if (data.hasGeminiKey) {
          return { success: true, message: 'مفتاح الخادم متصل بنجاح بالنموذج' };
        }
      }
    } catch {
      // ignore
    }

    return {
      success: false,
      message: 'لم يتم التحقق من المفتاح في بيئة المتصفح الحالية.'
    };
  }

  /**
   * Get the embedded loopback server URL (e.g. http://127.0.0.1:34567)
   */
  public async getEmbeddedServerUrl(): Promise<string> {
    if (this.isNativeDesktop && window.electronAPI?.getEmbeddedServerUrl) {
      try {
        return await window.electronAPI.getEmbeddedServerUrl();
      } catch (err) {
        console.warn('Failed to get embedded server url:', err);
      }
    }
    return window.location.origin;
  }
}

export const nativeDesktop = new NativeDesktopBridge();
export default nativeDesktop;

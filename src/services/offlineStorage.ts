/**
 * Offline-First IndexedDB & Cache Storage Service
 * Handles caching of Thanaweya Amma curriculum, printable A4 sheets, and sync queuing.
 */

const DB_NAME = 'ThanaweyaAmmaMathDB';
const DB_VERSION = 1;
const STORE_NAME = 'offline_curriculum_cache';

export interface OfflineCacheRecord {
  key: string;
  data: any;
  cachedAt: string;
  type: 'curriculum' | 'printable_sheet' | 'schedule' | 'exam_result';
}

class OfflineStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.initDB();
    }
  }

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Save an item in IndexedDB with local timestamp
   */
  public async setItem(key: string, data: any, type: OfflineCacheRecord['type'] = 'curriculum'): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const record: OfflineCacheRecord = {
          key,
          data,
          cachedAt: new Date().toISOString(),
          type
        };
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      // Fallback to localStorage
      try {
        localStorage.setItem(`offline_${key}`, JSON.stringify(data));
      } catch (e) {
        console.warn('Local storage fallback error:', e);
      }
    }
  }

  /**
   * Retrieve an item from IndexedDB
   */
  public async getItem<T>(key: string): Promise<T | null> {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => {
          if (req.result) {
            resolve(req.result.data as T);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch (err) {
      try {
        const fallback = localStorage.getItem(`offline_${key}`);
        return fallback ? JSON.parse(fallback) : null;
      } catch {
        return null;
      }
    }
  }

  /**
   * Enqueue a pending sync action for when internet reconnects
   */
  public queuePendingSync(actionType: string, payload: any): void {
    try {
      const currentQueue = JSON.parse(localStorage.getItem('pending_sync_queue') || '[]');
      currentQueue.push({
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        actionType,
        payload,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('pending_sync_queue', JSON.stringify(currentQueue));
    } catch (e) {
      console.warn('Queue sync error:', e);
    }
  }

  public getPendingSyncCount(): number {
    try {
      const currentQueue = JSON.parse(localStorage.getItem('pending_sync_queue') || '[]');
      return currentQueue.length;
    } catch {
      return 0;
    }
  }

  public clearPendingSync(): void {
    localStorage.removeItem('pending_sync_queue');
  }
}

export const offlineStorage = new OfflineStorageService();

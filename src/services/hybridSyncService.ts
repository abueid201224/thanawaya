/**
 * Hybrid Local-First Sync Worker (SQLite sync_outbox <-> Supabase)
 * Implements:
 * - Append-Only sync for study_attempts logs
 * - Last-Write-Wins (LWW) conflict resolution for schedules, spaced intervals & mistake states
 * - Exponential Backoff retries on transient/offline failures
 */

import { getSupabase } from './supabaseClient';
import { offlineStorage } from './offlineStorage';
import { normalizeMistakeErrorType } from './studyPersistenceService';

export interface SyncOutboxRecord {
  id: string;
  entityType: 'study_attempt' | 'mistake_entry' | 'spaced_intervals' | 'student_schedule';
  entityId: string;
  operation: 'append' | 'upsert';
  payload: Record<string, unknown>;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  nextRetryAt: string;
  lastError: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncCycleReport {
  ok: boolean;
  offline?: boolean;
  unauthenticated?: boolean;
  syncedCount: number;
  failedCount: number;
  pendingCount: number;
}

export function computeExponentialBackoffMs(retryCount: number): number {
  const safeCount = Math.max(0, Math.min(10, Math.floor(retryCount)));
  return Math.min(300_000, 1000 * Math.pow(2, safeCount));
}

export type SyncTimestampRecord = { updatedAt?: string; updated_at?: string };

export function resolveLastWriteWins<
  TLocal extends SyncTimestampRecord,
  TRemote extends SyncTimestampRecord
>(local: TLocal | null, remote: TRemote | null): TLocal | TRemote | null {
  if (!local) return remote;
  if (!remote) return local;
  const localTs = new Date(local.updatedAt || local.updated_at || 0).getTime();
  const remoteTs = new Date(remote.updatedAt || remote.updated_at || 0).getTime();
  return localTs >= remoteTs ? local : remote;
}

export function mergeAppendOnlyLogs<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of remote) {
    if (item?.id) map.set(item.id, item);
  }
  for (const item of local) {
    if (item?.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

interface ElectronOutboxBridge {
  getOutbox?: (limit?: number) => Promise<{
    ok?: boolean;
    entries?: unknown[];
    stats?: { pendingCount: number; syncedCount: number; failedCount: number };
  }>;
  ackOutbox?: (outboxId: string) => Promise<unknown>;
  failOutbox?: (outboxId: string, error: string) => Promise<unknown>;
}

function getElectronOutboxBridge(): ElectronOutboxBridge | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { electronAPI?: { studyDb?: ElectronOutboxBridge } }).electronAPI
    ?.studyDb;
}

async function fetchOutboxFromStore(): Promise<{
  entries: SyncOutboxRecord[];
  pendingCount: number;
}> {
  const electronDb = getElectronOutboxBridge();

  if (electronDb?.getOutbox) {
    const res = await electronDb.getOutbox(50);
    if (res?.ok && Array.isArray(res.entries)) {
      return {
        entries: res.entries as SyncOutboxRecord[],
        pendingCount: res.stats?.pendingCount ?? res.entries.length
      };
    }
  }

  if (
    typeof fetch === 'function' &&
    typeof window !== 'undefined' &&
    window.location?.protocol?.startsWith('http')
  ) {
    try {
      const res = await fetch('/api/study/sync-outbox?limit=50');
      const ct = res.headers?.get?.('content-type') || '';
      if (res.ok && ct.toLowerCase().includes('application/json')) {
        const data = await res.json();
        if (data?.ok && Array.isArray(data.entries)) {
          return {
            entries: data.entries as SyncOutboxRecord[],
            pendingCount: data.stats?.pendingCount ?? data.entries.length
          };
        }
      }
    } catch {
      // ignore in static offline mode
    }
  }

  return { entries: [], pendingCount: offlineStorage.getPendingSyncCount() };
}

async function ackOutboxEntry(id: string): Promise<void> {
  const electronDb = getElectronOutboxBridge();
  if (electronDb?.ackOutbox) {
    await electronDb.ackOutbox(id);
    return;
  }
  if (typeof fetch === 'function') {
    await fetch(`/api/study/sync-outbox/${encodeURIComponent(id)}/ack`, {
      method: 'POST'
    }).catch(() => {});
  }
}

async function failOutboxEntry(id: string, errorMessage: string): Promise<void> {
  const electronDb = getElectronOutboxBridge();
  if (electronDb?.failOutbox) {
    await electronDb.failOutbox(id, errorMessage);
    return;
  }
  if (typeof fetch === 'function') {
    await fetch(`/api/study/sync-outbox/${encodeURIComponent(id)}/fail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: errorMessage })
    }).catch(() => {});
  }
}

class HybridSyncService {
  private syncInFlight: Promise<SyncCycleReport> | null = null;
  private workerTimer: ReturnType<typeof setInterval> | null = null;
  private onlineListener: (() => void) | null = null;

  public async flushLocalBrowserQueueToSqlite(): Promise<number> {
    if (
      typeof window === 'undefined' ||
      typeof fetch !== 'function' ||
      !window.location?.protocol?.startsWith('http')
    ) {
      return 0;
    }

    let rawQueue: Array<{
      id: string;
      actionType: string;
      payload: { apiPath?: string; method?: 'POST' | 'PATCH'; payload?: unknown };
    }> = [];
    try {
      rawQueue = JSON.parse(localStorage.getItem('pending_sync_queue') || '[]');
    } catch {
      return 0;
    }
    if (!Array.isArray(rawQueue) || rawQueue.length === 0) return 0;

    let flushed = 0;
    const remaining: typeof rawQueue = [];
    for (const item of rawQueue) {
      if (item.actionType === 'sqlite_mirror' && item.payload?.apiPath) {
        try {
          const res = await fetch(item.payload.apiPath, {
            method: item.payload.method || 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload.payload)
          });
          const ct = res.headers?.get?.('content-type') || '';
          if (res.ok && ct.toLowerCase().includes('application/json')) {
            flushed += 1;
            continue;
          }
        } catch {
          // keep in queue
        }
      }
      remaining.push(item);
    }

    try {
      localStorage.setItem('pending_sync_queue', JSON.stringify(remaining));
    } catch {
      // ignore storage error
    }
    return flushed;
  }

  public syncNow(): Promise<SyncCycleReport> {
    if (this.syncInFlight) return this.syncInFlight;
    this.syncInFlight = this.executeSyncCycle().finally(() => {
      this.syncInFlight = null;
    });
    return this.syncInFlight;
  }

  private async executeSyncCycle(): Promise<SyncCycleReport> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    await this.flushLocalBrowserQueueToSqlite();

    const { entries, pendingCount } = await fetchOutboxFromStore();
    if (!isOnline) {
      return { ok: false, offline: true, syncedCount: 0, failedCount: 0, pendingCount };
    }

    const supabase = getSupabase();
    if (!supabase) {
      return { ok: true, unauthenticated: true, syncedCount: 0, failedCount: 0, pendingCount };
    }

    let userId: string | null = null;
    try {
      const { data } = await supabase.auth.getUser();
      userId = data?.user?.id || null;
    } catch {
      return { ok: false, unauthenticated: true, syncedCount: 0, failedCount: 0, pendingCount };
    }

    if (!userId) {
      return { ok: true, unauthenticated: true, syncedCount: 0, failedCount: 0, pendingCount };
    }

    let syncedCount = 0;
    let failedCount = 0;

    for (const entry of entries) {
      try {
        if (entry.entityType === 'study_attempt') {
          // Append-Only log sync
          const p = entry.payload;
          const { error } = await supabase
            .from('study_attempts')
            .upsert(
              {
                id: String(p.id),
                user_id: userId,
                question_id: String(p.questionId),
                question_version: Number(p.questionVersion || 1),
                unit_id: String(p.unitId),
                subject_code: String(p.subjectCode),
                mode: String(p.mode || 'practice'),
                selected_key: String(p.selectedKey || ''),
                is_correct: Boolean(p.isCorrect),
                hint_tier_used: Number(p.hintTierUsed || 0),
                created_at: String(p.timestamp || entry.createdAt)
              },
              { onConflict: 'id', ignoreDuplicates: true }
            );
          if (error) throw new Error(error.message);
        } else if (entry.entityType === 'mistake_entry') {
          // Last-Write-Wins on (user_id, question_id, question_version)
          const p = entry.payload;
          const { data: remoteRow, error: readErr } = await supabase
            .from('mistake_notebook')
            .select('updated_at')
            .eq('user_id', userId)
            .eq('question_id', String(p.questionId))
            .eq('question_version', Number(p.questionVersion || 1))
            .maybeSingle();
          if (readErr) throw new Error(readErr.message);

          const winner = resolveLastWriteWins(
            { updatedAt: String(p.updatedAt || entry.updatedAt) },
            remoteRow ? { updated_at: String(remoteRow.updated_at) } : null
          );
          if (winner && 'updatedAt' in winner) {
            const { error: upErr } = await supabase
              .from('mistake_notebook')
              .upsert(
                {
                  user_id: userId,
                  question_id: String(p.questionId),
                  question_version: Number(p.questionVersion || 1),
                  unit_id: String(p.unitId),
                  subject_code: String(p.subjectCode),
                  error_type: normalizeMistakeErrorType(p.errorType),
                  conceptual_hint: String(p.conceptualHint || ''),
                  student_note: String(p.studentNote || ''),
                  review_interval_days: Number(p.reviewIntervalDays || 1),
                  review_count: Number(p.reviewCount || 0),
                  next_review_at: String(p.nextReviewAt || entry.updatedAt),
                  resolved: Boolean(p.resolved),
                  updated_at: String(p.updatedAt || entry.updatedAt)
                },
                { onConflict: 'user_id,question_id,question_version' }
              );
            if (upErr) throw new Error(upErr.message);
          }
        } else if (entry.entityType === 'student_schedule' || entry.entityType === 'spaced_intervals') {
          // Last-Write-Wins on student_schedules
          const p = entry.payload;
          const { data: remoteSched, error: readErr } = await supabase
            .from('student_schedules')
            .select('updated_at')
            .eq('user_id', userId)
            .maybeSingle();
          if (readErr) throw new Error(readErr.message);

          const winner = resolveLastWriteWins(
            { updatedAt: String(p.updatedAt || entry.updatedAt) },
            remoteSched ? { updated_at: String(remoteSched.updated_at) } : null
          );
          if (winner && 'updatedAt' in winner) {
            const patch: Record<string, unknown> = {
              user_id: userId,
              updated_at: String(p.updatedAt || entry.updatedAt)
            };
            if (entry.entityType === 'student_schedule') {
              patch.schedule_json = p.schedule || [];
            } else {
              patch.spaced_intervals_json = p.intervals || [1, 3, 7, 14];
            }
            const { error: upErr } = await supabase
              .from('student_schedules')
              .upsert(patch, { onConflict: 'user_id' });
            if (upErr) throw new Error(upErr.message);
          }
        }

        await ackOutboxEntry(entry.id);
        syncedCount += 1;
      } catch (err: any) {
        failedCount += 1;
        await failOutboxEntry(entry.id, err?.message || 'Supabase sync error');
      }
    }

    const after = await fetchOutboxFromStore();
    return {
      ok: failedCount === 0,
      syncedCount,
      failedCount,
      pendingCount: after.pendingCount
    };
  }

  public startBackgroundWorker(intervalMs: number = 45_000): () => void {
    if (typeof window === 'undefined') return () => {};
    this.stopBackgroundWorker();

    this.onlineListener = () => {
      void this.syncNow();
    };
    window.addEventListener('online', this.onlineListener);
    this.workerTimer = setInterval(() => {
      if (navigator.onLine) {
        void this.syncNow();
      }
    }, Math.max(10_000, intervalMs));

    return () => this.stopBackgroundWorker();
  }

  public stopBackgroundWorker(): void {
    if (this.workerTimer) {
      clearInterval(this.workerTimer);
      this.workerTimer = null;
    }
    if (this.onlineListener && typeof window !== 'undefined') {
      window.removeEventListener('online', this.onlineListener);
      this.onlineListener = null;
    }
  }
}

export const hybridSyncService = new HybridSyncService();
export default hybridSyncService;

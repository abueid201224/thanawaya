import type {
  MistakeEntry,
  MistakeErrorType,
  PracticeQuestion,
  SpacedReviewIntervalDays,
  StudyAttempt
} from '../types';

const ATTEMPTS_KEY = 'thanaweya_study_attempts_v1';
const MISTAKES_KEY = 'thanaweya_mistake_notebook_v1';
const ESSAY_CHECKS_KEY = 'thanaweya_essay_self_checks_v1';
const SPACED_INTERVALS_KEY = 'thanaweya_spaced_intervals_v1';

export const DEFAULT_SPACED_INTERVALS: SpacedReviewIntervalDays[] = [1, 3, 7, 14];

export interface PersistenceResult<T = void> {
  ok: boolean;
  data?: T;
  savedAt?: string;
  error?: string;
}

export interface StorageBackend {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

// In-memory fallback for Node/test environments when localStorage is unavailable
const memoryFallbackStore = new Map<string, string>();

function getDefaultStorage(): StorageBackend {
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return {
    getItem: (k) => memoryFallbackStore.get(k) ?? null,
    setItem: (k, v) => {
      memoryFallbackStore.set(k, v);
    }
  };
}

export const MISTAKE_ERROR_LABELS: Record<MistakeErrorType, string> = {
  rule: 'خطأ في القاعدة / القانون',
  algebra: 'خطأ جبري أو حسابي',
  sign_unit: 'خطأ إشارة أو وحدة قياس',
  unjustified_step: 'خطوة غير مبررة / إهمال شرط'
};

export function computeNextReviewDate(
  intervalDays: SpacedReviewIntervalDays,
  fromDate: Date = new Date()
): string {
  const next = new Date(fromDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  return next.toISOString();
}

export function getNextIntervalDays(
  current: SpacedReviewIntervalDays,
  wasCorrect: boolean,
  intervals: SpacedReviewIntervalDays[] = DEFAULT_SPACED_INTERVALS
): { nextInterval: SpacedReviewIntervalDays; resolved: boolean } {
  if (!wasCorrect) {
    return { nextInterval: intervals[0] || 1, resolved: false };
  }
  const idx = intervals.indexOf(current);
  if (idx === -1) {
    return { nextInterval: intervals[0] || 1, resolved: false };
  }
  if (idx === intervals.length - 1) {
    return { nextInterval: intervals[idx], resolved: true };
  }
  return { nextInterval: intervals[idx + 1], resolved: false };
}

export class StudyPersistenceService {
  private storage: StorageBackend;

  constructor(storage?: StorageBackend) {
    this.storage = storage || getDefaultStorage();
  }

  public setStorageBackend(storage: StorageBackend): void {
    this.storage = storage;
  }

  private mirrorToSqlite(
    ipcCall: (db: NonNullable<Window['electronAPI']>['studyDb']) => Promise<unknown> | undefined,
    apiPath: string,
    payload: unknown
  ): void {
    if (typeof window === 'undefined') return;
    try {
      const studyDb = window.electronAPI?.studyDb;
      if (studyDb) {
        void ipcCall(studyDb)?.catch(() => {});
        return;
      }
      if (typeof fetch === 'function' && window.location?.protocol?.startsWith('http')) {
        void fetch(apiPath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {});
      }
    } catch {
      // Non-blocking background sync to SQLite
    }
  }

  public getSpacedIntervals(): SpacedReviewIntervalDays[] {
    try {
      const raw = this.storage.getItem(SPACED_INTERVALS_KEY);
      if (!raw) return [...DEFAULT_SPACED_INTERVALS];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 4) {
        return parsed as SpacedReviewIntervalDays[];
      }
    } catch {
      // ignore
    }
    return [...DEFAULT_SPACED_INTERVALS];
  }

  public saveSpacedIntervals(intervals: SpacedReviewIntervalDays[]): PersistenceResult<SpacedReviewIntervalDays[]> {
    try {
      const serialized = JSON.stringify(intervals);
      this.storage.setItem(SPACED_INTERVALS_KEY, serialized);
      // Verify read-back before reporting ok
      const verify = this.storage.getItem(SPACED_INTERVALS_KEY);
      if (verify !== serialized) {
        return { ok: false, error: 'تعذر التحقق من حفظ فترات المراجعة محلياً.' };
      }
      this.mirrorToSqlite(() => undefined, '/api/study/spaced-intervals', { intervals });
      return { ok: true, data: intervals, savedAt: new Date().toISOString() };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'فشل الحفظ المحلي لفترات المراجعة.' };
    }
  }

  public getAttempts(): StudyAttempt[] {
    try {
      const raw = this.storage.getItem(ATTEMPTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Records a student attempt bound strictly to (questionId, questionVersion).
   * Returns ok: true ONLY after read-back verification succeeds.
   */
  public recordAttempt(input: {
    question: PracticeQuestion;
    unitId: string;
    subjectCode: string;
    mode: StudyAttempt['mode'];
    selectedKey: string;
    hintTierUsed?: 0 | 1 | 2 | 3;
  }): PersistenceResult<StudyAttempt> {
    try {
      const isCorrect = input.selectedKey === input.question.correctKey;
      const attempt: StudyAttempt = {
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        questionId: input.question.id,
        questionVersion: input.question.questionVersion,
        unitId: input.unitId,
        subjectCode: input.subjectCode,
        mode: input.mode,
        selectedKey: input.selectedKey,
        isCorrect,
        hintTierUsed: input.hintTierUsed ?? 0,
        timestamp: new Date().toISOString()
      };

      const existing = this.getAttempts();
      const updated = [attempt, ...existing];
      const serialized = JSON.stringify(updated);
      this.storage.setItem(ATTEMPTS_KEY, serialized);

      const readBack = this.storage.getItem(ATTEMPTS_KEY);
      if (readBack !== serialized) {
        return { ok: false, error: 'تعذر التحقق من حفظ المحاولة على القرص المحلي.' };
      }

      this.mirrorToSqlite(
        (db) => db?.recordAttempt(attempt),
        '/api/study/attempts',
        attempt
      );

      return { ok: true, data: attempt, savedAt: attempt.timestamp };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'فشل حفظ المحاولة محلياً.' };
    }
  }

  public getMistakes(): MistakeEntry[] {
    try {
      const raw = this.storage.getItem(MISTAKES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public captureMistake(input: {
    question: PracticeQuestion;
    unitId: string;
    subjectCode: string;
    subjectNameAr: string;
    selectedKey: string;
    errorType: MistakeErrorType;
    studentNote?: string;
    now?: Date;
  }): PersistenceResult<MistakeEntry> {
    try {
      const nowDate = input.now || new Date();
      const nowIso = nowDate.toISOString();
      const intervals = this.getSpacedIntervals();
      const firstInterval = intervals[0] || 1;

      const mistakes = this.getMistakes();
      const existingIndex = mistakes.findIndex(
        (m) =>
          m.questionId === input.question.id &&
          m.questionVersion === input.question.questionVersion
      );

      let savedEntry: MistakeEntry;
      if (existingIndex >= 0) {
        savedEntry = {
          ...mistakes[existingIndex],
          selectedKey: input.selectedKey,
          errorType: input.errorType,
          studentNote: input.studentNote ?? mistakes[existingIndex].studentNote,
          reviewIntervalDays: firstInterval,
          nextReviewAt: computeNextReviewDate(firstInterval, nowDate),
          resolved: false,
          updatedAt: nowIso
        };
        mistakes[existingIndex] = savedEntry;
      } else {
        savedEntry = {
          id: `mst_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          questionId: input.question.id,
          questionVersion: input.question.questionVersion,
          unitId: input.unitId,
          subjectCode: input.subjectCode,
          subjectNameAr: input.subjectNameAr,
          questionText: input.question.questionText,
          selectedKey: input.selectedKey,
          correctKey: input.question.correctKey,
          explanation: input.question.explanation,
          solutionSteps: input.question.solutionSteps,
          errorType: input.errorType,
          studentNote: input.studentNote || '',
          reviewIntervalDays: firstInterval,
          reviewCount: 0,
          nextReviewAt: computeNextReviewDate(firstInterval, nowDate),
          createdAt: nowIso,
          updatedAt: nowIso,
          resolved: false
        };
        mistakes.unshift(savedEntry);
      }

      const serialized = JSON.stringify(mistakes);
      this.storage.setItem(MISTAKES_KEY, serialized);
      const readBack = this.storage.getItem(MISTAKES_KEY);
      if (readBack !== serialized) {
        return { ok: false, error: 'تعذر التحقق من حفظ الخطأ في الدفتر المحلي.' };
      }

      this.mirrorToSqlite(
        (db) => db?.captureMistake(savedEntry),
        '/api/study/mistakes',
        savedEntry
      );

      return { ok: true, data: savedEntry, savedAt: nowIso };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'فشل حفظ الخطأ في الدفتر.' };
    }
  }

  public updateMistakeClassification(
    mistakeId: string,
    errorType: MistakeErrorType,
    studentNote?: string
  ): PersistenceResult<MistakeEntry> {
    try {
      const mistakes = this.getMistakes();
      const idx = mistakes.findIndex((m) => m.id === mistakeId);
      if (idx === -1) {
        return { ok: false, error: 'لم يتم العثور على الخطأ المحدد.' };
      }

      const nowIso = new Date().toISOString();
      mistakes[idx] = {
        ...mistakes[idx],
        errorType,
        studentNote: studentNote !== undefined ? studentNote : mistakes[idx].studentNote,
        updatedAt: nowIso
      };

      const serialized = JSON.stringify(mistakes);
      this.storage.setItem(MISTAKES_KEY, serialized);
      if (this.storage.getItem(MISTAKES_KEY) !== serialized) {
        return { ok: false, error: 'تعذر التحقق من تحديث التصنيف.' };
      }

      return { ok: true, data: mistakes[idx], savedAt: nowIso };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'فشل تحديث دفتر الأخطاء.' };
    }
  }

  public getDueReviews(now: Date = new Date()): MistakeEntry[] {
    const nowMs = now.getTime();
    return this.getMistakes().filter(
      (m) => !m.resolved && new Date(m.nextReviewAt).getTime() <= nowMs
    );
  }

  public recordSpacedReviewOutcome(
    mistakeId: string,
    wasCorrect: boolean,
    now: Date = new Date()
  ): PersistenceResult<MistakeEntry> {
    try {
      const mistakes = this.getMistakes();
      const idx = mistakes.findIndex((m) => m.id === mistakeId);
      if (idx === -1) {
        return { ok: false, error: 'السجل غير موجود في دفتر الأخطاء.' };
      }

      const current = mistakes[idx];
      const intervals = this.getSpacedIntervals();
      const { nextInterval, resolved } = getNextIntervalDays(
        current.reviewIntervalDays,
        wasCorrect,
        intervals
      );
      const nowIso = now.toISOString();

      mistakes[idx] = {
        ...current,
        reviewIntervalDays: nextInterval,
        reviewCount: current.reviewCount + 1,
        nextReviewAt: computeNextReviewDate(nextInterval, now),
        resolved,
        updatedAt: nowIso
      };

      const serialized = JSON.stringify(mistakes);
      this.storage.setItem(MISTAKES_KEY, serialized);
      if (this.storage.getItem(MISTAKES_KEY) !== serialized) {
        return { ok: false, error: 'تعذر التحقق من حفظ نتيجة المراجعة.' };
      }

      this.mirrorToSqlite(
        (db) => db?.recordReview(mistakeId, wasCorrect),
        `/api/study/mistakes/${encodeURIComponent(mistakeId)}/review`,
        { wasCorrect }
      );

      return { ok: true, data: mistakes[idx], savedAt: nowIso };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'فشل حفظ المراجعة المتباعدة.' };
    }
  }

  public saveEssaySelfChecks(problemId: string, checkedStepIndices: number[]): PersistenceResult<number[]> {
    try {
      const raw = this.storage.getItem(ESSAY_CHECKS_KEY);
      const map: Record<string, number[]> = raw ? JSON.parse(raw) : {};
      map[problemId] = checkedStepIndices;
      const serialized = JSON.stringify(map);
      this.storage.setItem(ESSAY_CHECKS_KEY, serialized);
      if (this.storage.getItem(ESSAY_CHECKS_KEY) !== serialized) {
        return { ok: false, error: 'تعذر التحقق من حفظ التقييم الذاتي.' };
      }
      return { ok: true, data: checkedStepIndices, savedAt: new Date().toISOString() };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'فشل حفظ التقييم الذاتي.' };
    }
  }

  public getEssaySelfChecks(problemId: string): number[] {
    try {
      const raw = this.storage.getItem(ESSAY_CHECKS_KEY);
      if (!raw) return [];
      const map: Record<string, number[]> = JSON.parse(raw);
      return Array.isArray(map[problemId]) ? map[problemId] : [];
    } catch {
      return [];
    }
  }
}

export const studyPersistenceService = new StudyPersistenceService();
export default studyPersistenceService;

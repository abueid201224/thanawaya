import type {
  AnyMistakeErrorType,
  CurriculumUnit,
  InterleavedQuestionItem,
  MistakeEntry,
  MistakeErrorType,
  PracticeQuestion,
  SpacedReviewIntervalDays,
  StudyAttempt
} from '../types';
import { offlineStorage } from './offlineStorage';

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
  CONCEPTUAL: 'فهم مفاهيمي / إهمال شرط',
  FORMULA_SELECTION: 'اختيار القانون أو القاعدة',
  ALGEBRAIC_CALC: 'تبسيط جبري أو حسابي',
  MISREAD_GIVENS: 'قراءة المعطيات / إشارة أو وحدة'
};

const LEGACY_TO_CANONICAL_ERROR: Record<string, MistakeErrorType> = {
  CONCEPTUAL: 'CONCEPTUAL',
  FORMULA_SELECTION: 'FORMULA_SELECTION',
  ALGEBRAIC_CALC: 'ALGEBRAIC_CALC',
  MISREAD_GIVENS: 'MISREAD_GIVENS',
  rule: 'FORMULA_SELECTION',
  algebra: 'ALGEBRAIC_CALC',
  sign_unit: 'MISREAD_GIVENS',
  unjustified_step: 'CONCEPTUAL'
};

export function normalizeMistakeErrorType(value: unknown): MistakeErrorType {
  if (typeof value === 'string') {
    const mapped = LEGACY_TO_CANONICAL_ERROR[value.trim()];
    if (mapped) return mapped;
  }
  return 'CONCEPTUAL';
}

export function generateConceptualScaffoldingHint(input: {
  subjectNameAr: string;
  question?: Pick<PracticeQuestion, 'targetedLearningOutcome' | 'hints' | 'correctKey'>;
  explanation?: string;
}): string {
  const outcome = input.question?.targetedLearningOutcome?.trim();
  const firstHint = input.question?.hints?.[0]?.trim();
  if (firstHint && (!input.question?.correctKey || !firstHint.includes(input.question.correctKey))) {
    return `توجيه مفاهيمي (${input.subjectNameAr}): ${firstHint}`;
  }
  if (outcome) {
    return `راجع المفهوم الأساسي لـ «${outcome}» في ${input.subjectNameAr} وتحقق من شروط التطبيق قبل التعويض.`;
  }
  const cleanExp = (input.explanation || '').trim();
  return cleanExp
    ? `فكّر في سبب صحة القاعدة في ${input.subjectNameAr}: ${cleanExp.slice(0, 120)}`
    : `تأكد من التعريف وشروط المبرهنة في ${input.subjectNameAr} قبل بدء الحل الجبري.`;
}

export function generateInterleavedSession(input: {
  reviewedUnits: CurriculumUnit[];
  activeUnitId?: string;
  dueMistakes: MistakeEntry[];
  totalQuestions?: number;
}): InterleavedQuestionItem[] {
  const total = Math.max(1, Math.min(20, Math.floor(input.totalQuestions ?? 10)));
  const reviewedUnits = input.reviewedUnits.filter((u) => u.practiceQuestions.length > 0);
  if (reviewedUnits.length === 0) return [];

  const activeUnit =
    reviewedUnits.find((u) => u.id === input.activeUnitId) || reviewedUnits[0];

  const currentQuota = Math.round(total * 0.5);
  const spacedQuota = Math.round(total * 0.3);
  const cumulativeQuota = Math.max(0, total - currentQuota - spacedQuota);

  const selected: InterleavedQuestionItem[] = [];
  const usedQuestionIds = new Set<string>();

  const questionLookup = new Map<string, { unit: CurriculumUnit; question: PracticeQuestion }>();
  for (const unit of reviewedUnits) {
    for (const q of unit.practiceQuestions) {
      questionLookup.set(q.id, { unit, question: q });
    }
  }

  // 1. 50% Current Unit
  for (const q of activeUnit.practiceQuestions) {
    if (selected.length >= currentQuota) break;
    if (!usedQuestionIds.has(q.id)) {
      usedQuestionIds.add(q.id);
      selected.push({ unit: activeUnit, question: q, interleavingBucket: 'current_unit' });
    }
  }

  // 2. 30% Spaced Due Mistakes
  let spacedAdded = 0;
  for (const mistake of input.dueMistakes) {
    if (spacedAdded >= spacedQuota) break;
    const match = questionLookup.get(mistake.questionId);
    if (match && !usedQuestionIds.has(match.question.id)) {
      usedQuestionIds.add(match.question.id);
      selected.push({
        unit: match.unit,
        question: match.question,
        interleavingBucket: 'spaced_mistake',
        dueMistakeId: mistake.id
      });
      spacedAdded += 1;
    }
  }

  // 3. 20% Cumulative High-Weight Questions from other/previous units (prefer difficulty C, then B, then A)
  const difficultyRank: Record<'A' | 'B' | 'C', number> = { C: 0, B: 1, A: 2 };
  const otherPool = reviewedUnits
    .filter((u) => u.id !== activeUnit.id)
    .flatMap((unit) => unit.practiceQuestions.map((question) => ({ unit, question })))
    .sort((a, b) => difficultyRank[a.question.difficulty] - difficultyRank[b.question.difficulty]);

  let cumulativeAdded = 0;
  for (const item of otherPool) {
    if (cumulativeAdded >= cumulativeQuota) break;
    if (!usedQuestionIds.has(item.question.id)) {
      usedQuestionIds.add(item.question.id);
      selected.push({
        unit: item.unit,
        question: item.question,
        interleavingBucket: 'cumulative_high_weight'
      });
      cumulativeAdded += 1;
    }
  }

  // Deterministic fill if any bucket had fewer items than its target quota
  if (selected.length < total) {
    for (const item of otherPool) {
      if (selected.length >= total) break;
      if (!usedQuestionIds.has(item.question.id)) {
        usedQuestionIds.add(item.question.id);
        selected.push({
          unit: item.unit,
          question: item.question,
          interleavingBucket: 'cumulative_high_weight'
        });
      }
    }
    for (const q of activeUnit.practiceQuestions) {
      if (selected.length >= total) break;
      if (!usedQuestionIds.has(q.id)) {
        usedQuestionIds.add(q.id);
        selected.push({ unit: activeUnit, question: q, interleavingBucket: 'current_unit' });
      }
    }
  }

  return selected;
}

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
  intervals: SpacedReviewIntervalDays[] = DEFAULT_SPACED_INTERVALS,
  errorType?: MistakeErrorType
): { nextInterval: SpacedReviewIntervalDays; resolved: boolean } {
  if (!wasCorrect) {
    return {
      nextInterval: errorType === 'CONCEPTUAL' ? 1 : (intervals[0] || 1),
      resolved: false
    };
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

export interface ElectronStudyDbBridge {
  recordAttempt?: (attempt: unknown) => Promise<{ ok?: boolean; error?: string }>;
  getAttempts?: (limit?: number) => Promise<{ ok?: boolean; attempts?: StudyAttempt[] }>;
  captureMistake?: (mistake: unknown) => Promise<{ ok?: boolean; error?: string }>;
  getMistakes?: () => Promise<{ ok?: boolean; mistakes?: MistakeEntry[] }>;
  recordReview?: (mistakeId: string, wasCorrect: boolean) => Promise<{ ok?: boolean; error?: string }>;
  updateMistake?: (
    mistakeId: string,
    errorType: AnyMistakeErrorType,
    studentNote?: string
  ) => Promise<{ ok?: boolean; error?: string }>;
  getSpacedIntervals?: () => Promise<{ ok?: boolean; intervals?: SpacedReviewIntervalDays[] }>;
  saveSpacedIntervals?: (
    intervals: SpacedReviewIntervalDays[]
  ) => Promise<{ ok?: boolean; error?: string }>;
  saveSchedule?: (slots: unknown[]) => Promise<{ ok?: boolean; error?: string }>;
}

function getElectronStudyDb(): ElectronStudyDbBridge | undefined {
  const g = globalThis as unknown as {
    window?: { electronAPI?: { studyDb?: ElectronStudyDbBridge } };
    electronAPI?: { studyDb?: ElectronStudyDbBridge };
  };
  return g.window?.electronAPI?.studyDb ?? g.electronAPI?.studyDb;
}

async function safeFetchJson<T>(url: string): Promise<T | null> {
  if (typeof fetch !== 'function') return null;
  try {
    const res = await fetch(url);
    const contentType = res.headers?.get?.('content-type') || '';
    if (!res.ok || !contentType.toLowerCase().includes('application/json')) {
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export class StudyPersistenceService {
  private storage: StorageBackend;
  private lastSyncWarning: string | null = null;

  constructor(storage?: StorageBackend) {
    this.storage = storage || getDefaultStorage();
  }

  public setStorageBackend(storage: StorageBackend): void {
    this.storage = storage;
  }

  public getLastSyncWarning(): string | null {
    return this.lastSyncWarning;
  }

  private mirrorToSqlite(
    ipcCall: (db: ElectronStudyDbBridge) => Promise<{ ok?: boolean; error?: string } | undefined> | undefined,
    apiPath: string,
    payload: unknown,
    method: 'POST' | 'PATCH' = 'POST'
  ): void {
    if (typeof window === 'undefined') return;
    try {
      const studyDb = getElectronStudyDb();
      if (studyDb) {
        const promise = ipcCall(studyDb);
        if (promise) {
          void promise
            .then((res) => {
              if (res && res.ok === false) {
                this.lastSyncWarning = res.error || 'تعذر مزامنة التحديث مع قاعدة البيانات المحلية (SQLite).';
              } else {
                this.lastSyncWarning = null;
              }
            })
            .catch(() => {
              this.lastSyncWarning = 'تعذر الاتصال بقاعدة البيانات المحلية (SQLite).';
            });
        }
        return;
      }
      if (typeof fetch === 'function' && window.location?.protocol?.startsWith('http')) {
        void fetch(apiPath, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then((res) => {
            const contentType = res.headers?.get?.('content-type') || '';
            if (!res.ok || !contentType.toLowerCase().includes('application/json')) {
              this.lastSyncWarning = 'تم الحفظ محلياً في المتصفح وتعذّر التأكيد من الخادم المحلي.';
              offlineStorage.queuePendingSync('sqlite_mirror', { apiPath, method, payload });
            } else {
              this.lastSyncWarning = null;
            }
          })
          .catch(() => {
            this.lastSyncWarning = 'تم الحفظ محلياً في وضع عدم الاتصال وستتم المزامنة لاحقاً.';
            offlineStorage.queuePendingSync('sqlite_mirror', { apiPath, method, payload });
          });
      }
    } catch {
      // Non-blocking background sync to SQLite
    }
  }

  public mirrorScheduleToStore(slots: unknown[]): void {
    this.mirrorToSqlite(
      (db) => db.saveSchedule?.(slots),
      '/api/study/schedule',
      { slots }
    );
  }

  public async hydrateFromStore(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    let updated = false;
    try {
      const studyDb = getElectronStudyDb();
      if (studyDb) {
        if (studyDb.getMistakes) {
          const res = await studyDb.getMistakes();
          if (res?.ok && Array.isArray(res.mistakes) && res.mistakes.length > 0) {
            this.mergeMistakesFromStore(res.mistakes);
            updated = true;
          }
        }
        if (studyDb.getAttempts) {
          const res = await studyDb.getAttempts(200);
          if (res?.ok && Array.isArray(res.attempts) && res.attempts.length > 0) {
            this.mergeAttemptsFromStore(res.attempts);
            updated = true;
          }
        }
        if (studyDb.getSpacedIntervals) {
          const res = await studyDb.getSpacedIntervals();
          if (res?.ok && Array.isArray(res.intervals) && res.intervals.length === 4) {
            this.storage.setItem(SPACED_INTERVALS_KEY, JSON.stringify(res.intervals));
            updated = true;
          }
        }
        return updated;
      }

      if (typeof fetch === 'function' && window.location?.protocol?.startsWith('http')) {
        const [mistakesRes, attemptsRes, intervalsRes] = await Promise.all([
          safeFetchJson<{ ok?: boolean; mistakes?: MistakeEntry[] }>('/api/study/mistakes'),
          safeFetchJson<{ ok?: boolean; attempts?: StudyAttempt[] }>('/api/study/attempts?limit=200'),
          safeFetchJson<{ ok?: boolean; intervals?: SpacedReviewIntervalDays[] }>('/api/study/spaced-intervals')
        ]);
        if (mistakesRes && mistakesRes.ok !== false && Array.isArray(mistakesRes.mistakes) && mistakesRes.mistakes.length > 0) {
          this.mergeMistakesFromStore(mistakesRes.mistakes);
          updated = true;
        }
        if (attemptsRes && attemptsRes.ok !== false && Array.isArray(attemptsRes.attempts) && attemptsRes.attempts.length > 0) {
          this.mergeAttemptsFromStore(attemptsRes.attempts);
          updated = true;
        }
        if (intervalsRes && intervalsRes.ok !== false && Array.isArray(intervalsRes.intervals) && intervalsRes.intervals.length === 4) {
          this.storage.setItem(SPACED_INTERVALS_KEY, JSON.stringify(intervalsRes.intervals));
          updated = true;
        }
      }
    } catch {
      // Keep local storage cache intact
    }
    return updated;
  }

  private normalizeStoredMistake(m: MistakeEntry): MistakeEntry {
    return {
      ...m,
      errorType: normalizeMistakeErrorType(m.errorType),
      conceptualHint: m.conceptualHint || ''
    };
  }

  private mergeMistakesFromStore(remoteMistakes: MistakeEntry[]): void {
    const local = this.getMistakes();
    const byKey = new Map<string, MistakeEntry>();
    for (const raw of remoteMistakes) {
      const m = this.normalizeStoredMistake(raw);
      byKey.set(`${m.questionId}::${m.questionVersion}`, m);
    }
    for (const raw of local) {
      const m = this.normalizeStoredMistake(raw);
      const key = `${m.questionId}::${m.questionVersion}`;
      const existing = byKey.get(key);
      if (!existing || new Date(m.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
        byKey.set(key, m);
      }
    }
    const merged = Array.from(byKey.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    this.storage.setItem(MISTAKES_KEY, JSON.stringify(merged));
  }

  private mergeAttemptsFromStore(remoteAttempts: StudyAttempt[]): void {
    const local = this.getAttempts();
    const seen = new Map<string, StudyAttempt>();
    for (const a of [...remoteAttempts, ...local]) {
      if (a && a.id) seen.set(a.id, a);
    }
    const merged = Array.from(seen.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    this.storage.setItem(ATTEMPTS_KEY, JSON.stringify(merged));
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
      const verify = this.storage.getItem(SPACED_INTERVALS_KEY);
      if (verify !== serialized) {
        return { ok: false, error: 'تعذر التحقق من حفظ فترات المراجعة محلياً.' };
      }
      this.mirrorToSqlite(
        (db) => db.saveSpacedIntervals?.(intervals),
        '/api/study/spaced-intervals',
        { intervals }
      );
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
        (db) => db.recordAttempt?.(attempt),
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
      return Array.isArray(parsed)
        ? parsed.map((m) => this.normalizeStoredMistake(m as MistakeEntry))
        : [];
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
    errorType: AnyMistakeErrorType;
    studentNote?: string;
    now?: Date;
  }): PersistenceResult<MistakeEntry> {
    try {
      const nowDate = input.now || new Date();
      const nowIso = nowDate.toISOString();
      const intervals = this.getSpacedIntervals();
      const normalizedErrorType = normalizeMistakeErrorType(input.errorType);
      const firstInterval: SpacedReviewIntervalDays =
        normalizedErrorType === 'CONCEPTUAL' ? 1 : (intervals[0] || 1);
      const conceptualHint =
        normalizedErrorType === 'CONCEPTUAL'
          ? generateConceptualScaffoldingHint({
              subjectNameAr: input.subjectNameAr,
              question: input.question,
              explanation: input.question.explanation
            })
          : '';

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
          errorType: normalizedErrorType,
          conceptualHint: conceptualHint || mistakes[existingIndex].conceptualHint || '',
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
          errorType: normalizedErrorType,
          conceptualHint,
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
        (db) => db.captureMistake?.(savedEntry),
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
    errorType: AnyMistakeErrorType,
    studentNote?: string,
    now: Date = new Date()
  ): PersistenceResult<MistakeEntry> {
    try {
      const mistakes = this.getMistakes();
      const idx = mistakes.findIndex((m) => m.id === mistakeId);
      if (idx === -1) {
        return { ok: false, error: 'لم يتم العثور على الخطأ المحدد.' };
      }

      const normalizedErrorType = normalizeMistakeErrorType(errorType);
      const nowIso = now.toISOString();
      const existing = mistakes[idx];
      const nextHint =
        normalizedErrorType === 'CONCEPTUAL'
          ? (existing.conceptualHint ||
              generateConceptualScaffoldingHint({
                subjectNameAr: existing.subjectNameAr,
                explanation: existing.explanation
              }))
          : existing.conceptualHint || '';

      mistakes[idx] = {
        ...existing,
        errorType: normalizedErrorType,
        conceptualHint: nextHint,
        studentNote: studentNote !== undefined ? studentNote : existing.studentNote,
        reviewIntervalDays:
          normalizedErrorType === 'CONCEPTUAL' ? 1 : existing.reviewIntervalDays,
        nextReviewAt:
          normalizedErrorType === 'CONCEPTUAL'
            ? computeNextReviewDate(1, now)
            : existing.nextReviewAt,
        updatedAt: nowIso
      };

      const serialized = JSON.stringify(mistakes);
      this.storage.setItem(MISTAKES_KEY, serialized);
      if (this.storage.getItem(MISTAKES_KEY) !== serialized) {
        return { ok: false, error: 'تعذر التحقق من تحديث التصنيف.' };
      }

      this.mirrorToSqlite(
        (db) => db.updateMistake?.(mistakeId, normalizedErrorType, studentNote),
        `/api/study/mistakes/${encodeURIComponent(mistakeId)}`,
        { errorType: normalizedErrorType, studentNote },
        'PATCH'
      );

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
        intervals,
        current.errorType
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
        (db) => db.recordReview?.(mistakeId, wasCorrect),
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

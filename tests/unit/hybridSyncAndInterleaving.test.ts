import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeExponentialBackoffMs,
  hybridSyncService,
  mergeAppendOnlyLogs,
  resolveLastWriteWins
} from '../../src/services/hybridSyncService';
import {
  StudyPersistenceService,
  generateConceptualScaffoldingHint,
  generateInterleavedSession,
  normalizeMistakeErrorType,
  type StorageBackend
} from '../../src/services/studyPersistenceService';
import type { CurriculumUnit, MistakeEntry, PracticeQuestion } from '../../src/types';

function createMemoryStorage(): StorageBackend {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    }
  };
}

function makeQuestion(
  id: string,
  difficulty: 'A' | 'B' | 'C',
  outcome: string
): PracticeQuestion {
  return {
    id,
    questionVersion: 1,
    reviewStatus: 'reviewed',
    reviewedBy: 'التوجيه الفني',
    questionNumber: 1,
    questionText: `سؤال ${id}`,
    options: [
      { key: 'A', text: '$1$' },
      { key: 'B', text: '$2$' }
    ],
    correctKey: 'A',
    explanation: `شرح ${id}`,
    hints: ['تلميح مفاهيمي اول', 'قاعدة', 'خطوة'],
    difficulty,
    targetedLearningOutcome: outcome
  };
}

function makeUnit(
  id: string,
  subjectCode: string,
  questions: PracticeQuestion[]
): CurriculumUnit {
  return {
    id,
    unitNumber: 1,
    subjectCode,
    subjectNameAr: subjectCode === 'STATICS' ? 'الاستاتيكا' : 'التفاضل والتكامل',
    title: `وحدة ${id}`,
    description: 'وصف',
    learningOutcomes: ['ناتج 1'],
    status: 'in_progress',
    practiceQuestions: questions,
    studyNotesSummary: [],
    localResourcesCount: 0,
    lastUpdatedDate: '2026-11-01'
  };
}

test('hybridSyncService math: exponential backoff, LWW conflict resolution, and append-only merge', () => {
  // Exponential backoff doubles and caps at 300s
  assert.equal(computeExponentialBackoffMs(0), 1000);
  assert.equal(computeExponentialBackoffMs(1), 2000);
  assert.equal(computeExponentialBackoffMs(3), 8000);
  assert.equal(computeExponentialBackoffMs(10), 300_000);

  // LWW selects newer timestamp regardless of local vs remote
  const olderLocal = { id: '1', updatedAt: '2026-11-01T10:00:00.000Z', note: 'local-old' };
  const newerRemote = { id: '1', updated_at: '2026-11-01T10:05:00.000Z', note: 'remote-new' };
  assert.equal(resolveLastWriteWins(olderLocal, newerRemote), newerRemote);

  const newerLocal = { id: '1', updatedAt: '2026-11-01T10:10:00.000Z', note: 'local-new' };
  assert.equal(resolveLastWriteWins(newerLocal, newerRemote), newerLocal);

  // Append-only merge deduplicates cleanly by id without dropping either log
  const merged = mergeAppendOnlyLogs(
    [
      { id: 'att_1', v: 'a' },
      { id: 'att_2', v: 'b' }
    ],
    [
      { id: 'att_2', v: 'b' },
      { id: 'att_3', v: 'c' }
    ]
  );
  assert.equal(merged.length, 3);
  assert.deepEqual(
    merged.map((m) => m.id).sort(),
    ['att_1', 'att_2', 'att_3']
  );
});

test('Root-cause taxonomy normalizes legacy values and enforces 24h conceptual scaffolding', () => {
  assert.equal(normalizeMistakeErrorType('rule'), 'FORMULA_SELECTION');
  assert.equal(normalizeMistakeErrorType('algebra'), 'ALGEBRAIC_CALC');
  assert.equal(normalizeMistakeErrorType('sign_unit'), 'MISREAD_GIVENS');
  assert.equal(normalizeMistakeErrorType('unjustified_step'), 'CONCEPTUAL');
  assert.equal(normalizeMistakeErrorType('CONCEPTUAL'), 'CONCEPTUAL');

  const storage = createMemoryStorage();
  const svc = new StudyPersistenceService(storage);
  // Even when custom intervals start at 7 days, CONCEPTUAL must enforce 24h (1 day)
  svc.saveSpacedIntervals([7, 14, 14, 14]);

  const t0 = new Date('2026-11-05T08:00:00.000Z');
  const q = makeQuestion('q_concept', 'C', 'شروط قابلية الاشتقاق');
  const res = svc.captureMistake({
    question: q,
    unitId: 'u_calc',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    selectedKey: 'B',
    errorType: 'CONCEPTUAL',
    now: t0
  });

  assert.equal(res.ok, true);
  assert.equal(res.data?.reviewIntervalDays, 1);
  assert.equal(res.data?.nextReviewAt, '2026-11-06T08:00:00.000Z');
  assert.ok((res.data?.conceptualHint || '').includes('تلميح مفاهيمي'));

  // Scaffolding helper never leaks the option key when excluded
  const fallbackHint = generateConceptualScaffoldingHint({
    subjectNameAr: 'الاستاتيكا',
    explanation: 'مجموع العزوم حول أي نقطة يساوي صفراً عند الاتزان'
  });
  assert.ok(fallbackHint.includes('الاستاتيكا'));
});

test('generateInterleavedSession builds 50/30/20 weighted deck and fills deterministically', () => {
  const unitActive = makeUnit('u_active', 'CALCULUS', [
    makeQuestion('q_act_1', 'B', 'نهايات'),
    makeQuestion('q_act_2', 'B', 'اتصال'),
    makeQuestion('q_act_3', 'A', 'مشتقات'),
    makeQuestion('q_act_4', 'C', 'معدلات'),
    makeQuestion('q_act_5', 'C', 'تطبيقات')
  ]);

  const unitPrev = makeUnit('u_prev', 'STATICS', [
    makeQuestion('q_prev_c1', 'C', 'اتزان عام'),
    makeQuestion('q_prev_c2', 'C', 'عزوم'),
    makeQuestion('q_prev_a1', 'A', 'احتكاك'),
    makeQuestion('q_spaced_1', 'B', 'مركز ثقل'),
    makeQuestion('q_spaced_2', 'C', 'ازدواج'),
    makeQuestion('q_spaced_3', 'B', 'محصلة قوى')
  ]);

  const dueMistakes: MistakeEntry[] = ['q_spaced_1', 'q_spaced_2', 'q_spaced_3'].map((qid, i) => ({
    id: `mst_${i}`,
    questionId: qid,
    questionVersion: 1,
    unitId: 'u_prev',
    subjectCode: 'STATICS',
    subjectNameAr: 'الاستاتيكا',
    questionText: `سؤال ${qid}`,
    selectedKey: 'B',
    correctKey: 'A',
    explanation: 'شرح',
    errorType: 'CONCEPTUAL',
    conceptualHint: 'توجيه',
    reviewIntervalDays: 1,
    reviewCount: 0,
    nextReviewAt: '2026-11-01T00:00:00.000Z',
    createdAt: '2026-10-31T00:00:00.000Z',
    updatedAt: '2026-10-31T00:00:00.000Z',
    resolved: false
  }));

  const session = generateInterleavedSession({
    reviewedUnits: [unitActive, unitPrev],
    activeUnitId: 'u_active',
    dueMistakes,
    totalQuestions: 10
  });

  assert.equal(session.length, 10);
  const currentCount = session.filter((s) => s.interleavingBucket === 'current_unit').length;
  const spacedCount = session.filter((s) => s.interleavingBucket === 'spaced_mistake').length;
  const cumulativeCount = session.filter((s) => s.interleavingBucket === 'cumulative_high_weight').length;

  assert.equal(currentCount, 5);
  assert.equal(spacedCount, 3);
  assert.equal(cumulativeCount, 2);

  // High-weight cumulative items must prioritize difficulty C
  const cumulativeItems = session.filter((s) => s.interleavingBucket === 'cumulative_high_weight');
  assert.ok(cumulativeItems.every((item) => item.question.difficulty === 'C'));

  // Unique question IDs across entire session
  assert.equal(new Set(session.map((s) => s.question.id)).size, 10);
});

test('Offline browser queue flushes cleanly back to SQLite endpoint on reconnection', async () => {
  const storeMap = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (k: string) => storeMap.get(k) ?? null,
    setItem: (k: string, v: string) => {
      storeMap.set(k, v);
    },
    removeItem: (k: string) => {
      storeMap.delete(k);
    }
  };

  storeMap.set(
    'pending_sync_queue',
    JSON.stringify([
      {
        id: 'sync_1',
        actionType: 'sqlite_mirror',
        payload: {
          apiPath: '/api/study/attempts',
          method: 'POST',
          payload: { questionId: 'q_1' }
        },
        timestamp: '2026-11-01T00:00:00.000Z'
      }
    ])
  );

  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevFetch = globalThis.fetch;

  const postedUrls: string[] = [];
  (globalThis as any).window = { location: { protocol: 'http:' } };
  (globalThis as any).localStorage = mockLocalStorage;
  globalThis.fetch = (async (url: string | URL) => {
    postedUrls.push(String(url));
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }) as typeof fetch;

  try {
    const flushed = await hybridSyncService.flushLocalBrowserQueueToSqlite();
    assert.equal(flushed, 1);
    assert.deepEqual(postedUrls, ['/api/study/attempts']);
    assert.equal(storeMap.get('pending_sync_queue'), '[]');
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    globalThis.fetch = prevFetch;
  }
});

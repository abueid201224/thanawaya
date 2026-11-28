import test from 'node:test';
import assert from 'node:assert/strict';
import {
  StudyPersistenceService,
  type StorageBackend
} from '../../src/services/studyPersistenceService';
import type { PracticeQuestion } from '../../src/types';

function createMemoryStorage(): StorageBackend {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    }
  };
}

const sampleQuestion: PracticeQuestion = {
  id: 'pq_test_1',
  questionVersion: 2,
  reviewStatus: 'reviewed',
  questionNumber: 1,
  questionText: 'مشتقة $x^2$ عند $x = 3$؟',
  options: [
    { key: 'A', text: '$6$' },
    { key: 'B', text: '$3$' }
  ],
  correctKey: 'A',
  explanation: '$2x = 6$',
  difficulty: 'C',
  targetedLearningOutcome: 'اشتقاق القوى'
};

test('StudyPersistenceService records versioned attempts and spaced-repetition mistake lifecycle', () => {
  const storage = createMemoryStorage();
  const svc = new StudyPersistenceService(storage);

  // 1. Record wrong attempt in practice mode
  const attRes = svc.recordAttempt({
    question: sampleQuestion,
    unitId: 'unit_calc_01',
    subjectCode: 'CALCULUS',
    mode: 'practice',
    selectedKey: 'B',
    hintTierUsed: 1
  });
  assert.equal(attRes.ok, true);
  assert.ok(attRes.savedAt);
  assert.equal(attRes.data?.questionVersion, 2);
  assert.equal(attRes.data?.isCorrect, false);

  // 2. Capture mistake with taxonomy
  const t0 = new Date('2026-10-20T10:00:00.000Z');
  const capRes = svc.captureMistake({
    question: sampleQuestion,
    unitId: 'unit_calc_01',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    selectedKey: 'B',
    errorType: 'algebra',
    studentNote: 'نسيت الضرب في الأس 2',
    now: t0
  });
  assert.equal(capRes.ok, true);
  const mistakeId = capRes.data!.id;
  assert.equal(capRes.data!.reviewIntervalDays, 1);
  assert.equal(capRes.data!.resolved, false);

  // 3. Reclassify mistake and save custom spaced intervals, then verify across reload
  const updRes = svc.updateMistakeClassification(mistakeId, 'rule', 'مراجعة قاعدة القوة');
  assert.equal(updRes.ok, true);
  const intervalSave = svc.saveSpacedIntervals([14, 7, 3, 1]);
  assert.equal(intervalSave.ok, true);

  const reloaded = new StudyPersistenceService(storage);
  assert.equal(reloaded.getMistakes()[0].errorType, 'FORMULA_SELECTION');
  assert.equal(reloaded.getMistakes()[0].studentNote, 'مراجعة قاعدة القوة');
  assert.deepEqual(reloaded.getSpacedIntervals(), [14, 7, 3, 1]);
  svc.saveSpacedIntervals([1, 3, 7, 14]);

  // 4. Not due immediately; due after +1 day
  assert.equal(svc.getDueReviews(t0).length, 0);
  const day1 = new Date('2026-10-21T10:01:00.000Z');
  assert.equal(svc.getDueReviews(day1).length, 1);

  // 5. Progress through [1, 3, 7, 14] -> resolved
  const r1 = svc.recordSpacedReviewOutcome(mistakeId, true, day1);
  assert.equal(r1.ok, true);
  assert.equal(r1.data?.reviewIntervalDays, 3);
  assert.equal(r1.data?.resolved, false);

  const day4 = new Date('2026-10-24T10:02:00.000Z');
  const r2 = svc.recordSpacedReviewOutcome(mistakeId, true, day4);
  assert.equal(r2.data?.reviewIntervalDays, 7);

  const day11 = new Date('2026-10-31T10:02:00.000Z');
  const r3 = svc.recordSpacedReviewOutcome(mistakeId, true, day11);
  assert.equal(r3.data?.reviewIntervalDays, 14);

  const day25 = new Date('2026-11-14T10:02:00.000Z');
  const r4 = svc.recordSpacedReviewOutcome(mistakeId, true, day25);
  assert.equal(r4.data?.resolved, true);
  assert.equal(svc.getDueReviews(day25).length, 0);

  // 6. Wrong review outcome resets back to first interval
  const rFail = svc.recordSpacedReviewOutcome(mistakeId, false, day25);
  assert.equal(rFail.data?.reviewIntervalDays, 1);
  assert.equal(rFail.data?.resolved, false);
});

test('StudyPersistenceService fails closed when storage read-back verification fails or throws', () => {
  const mismatchBackend: StorageBackend = {
    getItem: () => 'corrupted-stale-data',
    setItem: () => {}
  };
  const svcMismatch = new StudyPersistenceService(mismatchBackend);
  const resMismatch = svcMismatch.recordAttempt({
    question: sampleQuestion,
    unitId: 'unit_calc_01',
    subjectCode: 'CALCULUS',
    mode: 'test',
    selectedKey: 'A'
  });
  assert.equal(resMismatch.ok, false);

  const throwingBackend: StorageBackend = {
    getItem: () => null,
    setItem: () => {
      throw new Error('QuotaExceededError');
    }
  };
  const svcThrow = new StudyPersistenceService(throwingBackend);
  const resThrow = svcThrow.saveSpacedIntervals([1, 3, 7, 14]);
  assert.equal(resThrow.ok, false);
});

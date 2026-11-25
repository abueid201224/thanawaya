import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { SqliteStudyStore } from '../server/sqliteStore.ts';
import {
  isTrustedMoeUrl,
  validateContentQuestion,
  validateOfficialSource
} from '../server/contentSchema.ts';

test('MOE schema validation enforces trusted moe.gov.eg URLs and review metadata', () => {
  assert.equal(isTrustedMoeUrl('https://studentbooks.moe.gov.eg/books/Books-sec/'), true);
  assert.equal(isTrustedMoeUrl('https://ellibrary.moe.gov.eg/Books/Books-sec/'), true);
  assert.equal(isTrustedMoeUrl('https://ellibrary.moe.gov.eg/Performance_Assessments'), true);
  assert.equal(isTrustedMoeUrl('http://studentbooks.moe.gov.eg/books/Books-sec/'), false);
  assert.equal(isTrustedMoeUrl('https://evil.com/books'), false);

  const badSource = validateOfficialSource({
    id: 'bad_1',
    titleAr: 'مصدر خارجي',
    portalType: 'student_books',
    url: 'https://untrusted.example.com/book.pdf',
    academicYear: '2026/2027'
  });
  assert.equal(badSource.ok, false);

  const unreviewedWithoutReviewer = validateContentQuestion({
    id: 'q_unrev',
    questionVersion: 1,
    unitId: 'u1',
    subjectCode: 'CALCULUS',
    questionNumber: 1,
    questionText: 'احسب المشتقة الأولى للدالة',
    options: [
      { key: 'A', text: '$2x$' },
      { key: 'B', text: '$x$' }
    ],
    correctKey: 'A',
    explanation: 'مشتقة القوة',
    difficulty: 'C',
    targetedLearningOutcome: 'اشتقاق كثيرات الحدود',
    reviewStatus: 'reviewed'
  });
  assert.equal(unreviewedWithoutReviewer.ok, false);
});

test('SqliteStudyStore seeds official MOE portals, filters unreviewed content, and persists across reopen', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'thanaweya-sqlite-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const dbPath = path.join(dir, 'study.sqlite');

  const store1 = new SqliteStudyStore(dbPath);
  const sources = store1.listOfficialSources();
  assert.equal(sources.length, 3);
  assert.ok(sources.some((s) => s.url === 'https://studentbooks.moe.gov.eg/books/Books-sec/'));
  assert.ok(sources.some((s) => s.url === 'https://ellibrary.moe.gov.eg/Books/Books-sec/'));
  assert.ok(sources.some((s) => s.url === 'https://ellibrary.moe.gov.eg/Performance_Assessments'));

  store1.upsertCurriculumUnit({
    id: 'unit_calc_01',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    unitNumber: 1,
    title: 'الوحدة الأولى: الاشتقاق وتطبيقاته',
    description: 'اشتقاق الدوال المثلثية والمعدلات الزمنية',
    learningOutcomes: ['إتقان قاعدة السلسلة'],
    sourceId: 'moe_studentbooks_sec',
    academicYear: '2026/2027'
  });

  store1.upsertContentQuestion({
    id: 'q_rev_1',
    questionVersion: 1,
    unitId: 'unit_calc_01',
    subjectCode: 'CALCULUS',
    questionNumber: 1,
    questionText: 'مشتقة $\\sin(2x)$ تساوي:',
    options: [
      { key: 'A', text: '$2\\cos(2x)$' },
      { key: 'B', text: '$\\cos(2x)$' }
    ],
    correctKey: 'A',
    explanation: 'قاعدة السلسلة',
    difficulty: 'C',
    targetedLearningOutcome: 'مشتقة الدوال المثلثية',
    sourceId: 'moe_performance_assessments',
    reviewStatus: 'reviewed',
    reviewedBy: 'التوجيه الفني',
    verifiedBySympy: true
  });

  store1.upsertContentQuestion({
    id: 'q_unrev_2',
    questionVersion: 1,
    unitId: 'unit_calc_01',
    subjectCode: 'CALCULUS',
    questionNumber: 2,
    questionText: 'سؤال قيد المراجعة',
    options: [
      { key: 'A', text: '1' },
      { key: 'B', text: '2' }
    ],
    correctKey: 'A',
    explanation: 'قيد المراجعة',
    difficulty: 'B',
    targetedLearningOutcome: 'قيد المراجعة',
    reviewStatus: 'unreviewed'
  });

  // SQL injection string in questionId must be treated safely as literal data
  const injectionId = "q_rev_1'; DROP TABLE study_attempts; --";
  store1.recordAttempt({
    questionId: injectionId,
    questionVersion: 1,
    unitId: 'unit_calc_01',
    subjectCode: 'CALCULUS',
    mode: 'practice',
    selectedKey: 'B',
    isCorrect: false,
    hintTierUsed: 2
  });

  const t0 = new Date('2026-10-20T09:00:00.000Z');
  const mistake = store1.captureMistake({
    questionId: 'q_rev_1',
    questionVersion: 1,
    unitId: 'unit_calc_01',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    questionText: 'مشتقة $\\sin(2x)$',
    selectedKey: 'B',
    correctKey: 'A',
    explanation: 'اضرب في مشتقة الزاوية 2',
    errorType: 'rule',
    studentNote: 'نسيت معامل الزاوية',
    now: t0
  });
  assert.equal(mistake.reviewIntervalDays, 1);
  store1.close();

  // Reopen the SQLite file to verify persistence on disk
  const store2 = new SqliteStudyStore(dbPath);
  t.after(() => store2.close());

  const curriculum = store2.getStudentApprovedCurriculum();
  assert.equal(curriculum.length, 1);
  assert.equal(curriculum[0].questions.length, 1);
  assert.equal(curriculum[0].questions[0].id, 'q_rev_1');

  const attempts = store2.getAttempts();
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0].questionId, injectionId);

  const day1 = new Date('2026-10-21T09:01:00.000Z');
  assert.equal(store2.getDueReviews(day1).length, 1);

  const r1 = store2.recordSpacedReviewOutcome(mistake.id, true, day1);
  assert.equal(r1.reviewIntervalDays, 3);
  const r2 = store2.recordSpacedReviewOutcome(mistake.id, true, new Date('2026-10-24T10:00:00.000Z'));
  assert.equal(r2.reviewIntervalDays, 7);
  const r3 = store2.recordSpacedReviewOutcome(mistake.id, true, new Date('2026-10-31T10:00:00.000Z'));
  assert.equal(r3.reviewIntervalDays, 14);
  const r4 = store2.recordSpacedReviewOutcome(mistake.id, true, new Date('2026-11-14T10:00:00.000Z'));
  assert.equal(r4.resolved, true);
  assert.equal(store2.getDueReviews(new Date('2026-11-14T10:00:00.000Z')).length, 0);
});

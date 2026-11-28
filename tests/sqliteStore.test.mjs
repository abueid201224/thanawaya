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
  try {
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

    // Classification + note update and legacy taxonomy normalization
    const updatedMistake = store2.updateMistakeClassification(
      mistake.id,
      'sign_unit',
      'مراجعة الإشارة السالبة'
    );
    assert.equal(updatedMistake.errorType, 'MISREAD_GIVENS');
    assert.equal(updatedMistake.studentNote, 'مراجعة الإشارة السالبة');

    assert.throws(() => store2.updateMistakeClassification(mistake.id, /** @type {any} */ ('invalid_type')));
    assert.throws(() => store2.updateMistakeClassification('missing_id', 'algebra'));
  } finally {
    store2.close();
  }

  const store3 = new SqliteStudyStore(dbPath);
  t.after(() => store3.close());
  const reloadedMistakes = store3.getMistakes();
  assert.equal(reloadedMistakes.length, 1);
  assert.equal(reloadedMistakes[0].errorType, 'MISREAD_GIVENS');
  assert.equal(reloadedMistakes[0].studentNote, 'مراجعة الإشارة السالبة');
});

test('SqliteStudyStore enforces crash-safe pragmas and atomic transaction rollback for captureMistake & recordAttempt', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'thanaweya-sqlite-tx-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const dbPath = path.join(dir, 'tx.sqlite');

  const store = new SqliteStudyStore(dbPath);
  t.after(() => store.close());
  assert.equal(store.isInTransaction(), false);

  const sqliteMod = /** @type {{ DatabaseSync: new (p: string) => { exec: (sql: string) => void; prepare: (sql: string) => { get: () => Record<string, unknown> }; close: () => void } }} */ (
    process.getBuiltinModule('node:sqlite')
  );
  const inspector = new sqliteMod.DatabaseSync(dbPath);
  t.after(() => inspector.close());

  const journalRow = inspector.prepare('PRAGMA journal_mode;').get();
  assert.equal(String(journalRow.journal_mode).toLowerCase(), 'wal');
  const syncRow = inspector.prepare('PRAGMA synchronous;').get();
  // SQLite synchronous FULL === 2
  assert.equal(Number(syncRow.synchronous), 2);

  // Install AFTER INSERT triggers to simulate an abrupt failure inside an active transaction
  inspector.exec(`
    CREATE TRIGGER test_abort_attempt AFTER INSERT ON study_attempts
    BEGIN
      SELECT RAISE(ABORT, 'simulated abrupt interruption during attempt write');
    END;
    CREATE TRIGGER test_abort_mistake AFTER INSERT ON mistake_notebook
    BEGIN
      SELECT RAISE(ABORT, 'simulated abrupt interruption during mistake write');
    END;
  `);

  assert.throws(() =>
    store.recordAttempt({
      questionId: 'q_tx_1',
      questionVersion: 1,
      unitId: 'u_tx',
      subjectCode: 'CALCULUS',
      mode: 'practice',
      selectedKey: 'B',
      isCorrect: false
    })
  );
  assert.equal(store.isInTransaction(), false);
  assert.equal(store.getAttempts().length, 0);

  assert.throws(() =>
    store.captureMistake({
      questionId: 'q_tx_1',
      questionVersion: 1,
      unitId: 'u_tx',
      subjectCode: 'CALCULUS',
      subjectNameAr: 'التفاضل والتكامل',
      questionText: 'احسب المشتقة',
      selectedKey: 'B',
      correctKey: 'A',
      explanation: 'تطبيق القاعدة',
      errorType: 'rule'
    })
  );
  assert.equal(store.isInTransaction(), false);
  assert.equal(store.getMistakes().length, 0);

  // Validation rejects missing required strings prior to opening transaction
  assert.throws(() =>
    store.recordAttempt({
      questionId: 'q_tx_1',
      questionVersion: 1,
      unitId: 'u_tx',
      subjectCode: 'CALCULUS',
      mode: 'practice',
      selectedKey: '   ',
      isCorrect: true
    })
  );
  assert.throws(() =>
    store.captureMistake({
      questionId: 'q_tx_1',
      questionVersion: 1,
      unitId: 'u_tx',
      subjectCode: 'CALCULUS',
      subjectNameAr: 'التفاضل والتكامل',
      questionText: 'احسب المشتقة',
      selectedKey: ' ',
      correctKey: 'A',
      explanation: 'تطبيق القاعدة',
      errorType: 'rule'
    })
  );

  // Drop triggers and confirm connection cleanly recovers and commits atomically
  inspector.exec(`
    DROP TRIGGER test_abort_attempt;
    DROP TRIGGER test_abort_mistake;
  `);

  const attempt = store.recordAttempt({
    questionId: 'q_tx_1',
    questionVersion: 1,
    unitId: 'u_tx',
    subjectCode: 'CALCULUS',
    mode: 'practice',
    selectedKey: 'B',
    isCorrect: false
  });
  assert.equal(attempt.questionId, 'q_tx_1');
  assert.equal(store.isInTransaction(), false);
  assert.equal(store.getAttempts().length, 1);

  const mistake = store.captureMistake({
    questionId: 'q_tx_1',
    questionVersion: 1,
    unitId: 'u_tx',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    questionText: 'احسب المشتقة',
    selectedKey: 'B',
    correctKey: 'A',
    explanation: 'تطبيق القاعدة',
    errorType: 'rule'
  });
  assert.equal(mistake.questionId, 'q_tx_1');
  assert.equal(store.isInTransaction(), false);
  assert.equal(store.getMistakes().length, 1);
});

test('SqliteStudyStore runs idempotent versioned migrations, creates composite indexes, and rotates 3 backups', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'thanaweya-sqlite-mig-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const dbPath = path.join(dir, 'mig.sqlite');

  const store = new SqliteStudyStore(dbPath);
  assert.ok(store.getSchemaVersion() >= 2);
  const migrations = store.getAppliedMigrations();
  assert.ok(migrations.some((m) => m.version === 1));
  assert.ok(migrations.some((m) => m.version === 2));

  // Seed student data before re-running migrations
  store.recordAttempt({
    questionId: 'q_mig_1',
    questionVersion: 1,
    unitId: 'u_mig_1',
    subjectCode: 'CALCULUS',
    mode: 'practice',
    selectedKey: 'A',
    isCorrect: true
  });

  // Idempotent re-run must apply 0 duplicate migrations and preserve data
  const secondRun = store.runMigrations();
  assert.equal(secondRun.length, 0);
  assert.equal(store.getAttempts().length, 1);

  // Verify composite indexes exist in SQLite schema
  const sqliteMod = /** @type {{ DatabaseSync: new (p: string) => { prepare: (sql: string) => { all: () => Array<{ name: string }> }; close: () => void } }} */ (
    process.getBuiltinModule('node:sqlite')
  );
  const inspector = new sqliteMod.DatabaseSync(dbPath);
  t.after(() => inspector.close());

  const mistakeIndexes = inspector.prepare('PRAGMA index_list(mistake_notebook);').all().map((r) => r.name);
  assert.ok(mistakeIndexes.includes('idx_mistakes_due_branch'));
  const attemptIndexes = inspector.prepare('PRAGMA index_list(study_attempts);').all().map((r) => r.name);
  assert.ok(attemptIndexes.includes('idx_attempts_unit_date'));

  // Create 5 backups and confirm rotation keeps only 3 valid SQLite snapshots inside backups/
  for (let i = 0; i < 5; i += 1) {
    const snap = store.createRotatingBackup(3);
    assert.ok(snap && fs.existsSync(snap));
  }
  store.close();

  const backupsDir = path.join(dir, 'backups');
  const files = fs.readdirSync(backupsDir).filter((f) => f.endsWith('.sqlite'));
  assert.equal(files.length, 3);

  // Open latest backup to verify integrity and preserved student attempt
  const latestBackup = path.join(backupsDir, files[0]);
  const backupInspector = new SqliteStudyStore(latestBackup);
  t.after(() => backupInspector.close());
  assert.equal(backupInspector.getAttempts().length, 1);
});

test('SqliteStudyStore v3 migration upgrades legacy mistake rows, enforces CONCEPTUAL 24h review, and manages sync_outbox & schedules', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'thanaweya-sqlite-v3-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const dbPath = path.join(dir, 'v3.sqlite');

  // Seed a v2-shaped database directly using node:sqlite before opening with SqliteStudyStore
  const sqliteMod = /** @type {{ DatabaseSync: new (p: string) => { exec: (sql: string) => void; prepare: (sql: string) => { run: (...args: any[]) => void }; close: () => void } }} */ (
    process.getBuiltinModule('node:sqlite')
  );
  const legacyDb = new sqliteMod.DatabaseSync(dbPath);
  legacyDb.exec(`
    CREATE TABLE schema_version (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
    INSERT INTO schema_version VALUES (1, 'baseline_moe_study_schema', '2026-10-01T00:00:00.000Z');
    INSERT INTO schema_version VALUES (2, 'composite_query_indexes', '2026-10-01T00:00:00.000Z');
    CREATE TABLE official_sources (
      id TEXT PRIMARY KEY,
      title_ar TEXT NOT NULL,
      portal_type TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      academic_year TEXT NOT NULL,
      verified_domain TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE curriculum_units (
      id TEXT PRIMARY KEY,
      subject_code TEXT NOT NULL,
      subject_name_ar TEXT NOT NULL,
      unit_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      learning_outcomes_json TEXT NOT NULL,
      source_id TEXT,
      academic_year TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE content_questions (
      id TEXT PRIMARY KEY,
      question_version INTEGER NOT NULL DEFAULT 1,
      unit_id TEXT NOT NULL,
      subject_code TEXT NOT NULL,
      question_number INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_key TEXT NOT NULL,
      explanation TEXT NOT NULL,
      solution_steps_json TEXT,
      hints_json TEXT,
      difficulty TEXT NOT NULL,
      targeted_learning_outcome TEXT NOT NULL,
      exam_source TEXT,
      source_id TEXT,
      review_status TEXT NOT NULL DEFAULT 'unreviewed',
      reviewed_by TEXT,
      reviewed_at TEXT,
      verified_sympy INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE study_attempts (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      question_version INTEGER NOT NULL,
      unit_id TEXT NOT NULL,
      subject_code TEXT NOT NULL,
      mode TEXT NOT NULL,
      selected_key TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      hint_tier_used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE mistake_notebook (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      question_version INTEGER NOT NULL,
      unit_id TEXT NOT NULL,
      subject_code TEXT NOT NULL,
      subject_name_ar TEXT NOT NULL,
      question_text TEXT NOT NULL,
      selected_key TEXT NOT NULL,
      correct_key TEXT NOT NULL,
      explanation TEXT NOT NULL,
      solution_steps_json TEXT,
      error_type TEXT NOT NULL CHECK (error_type IN ('rule', 'algebra', 'sign_unit', 'unjustified_step')),
      student_note TEXT NOT NULL DEFAULT '',
      review_interval_days INTEGER NOT NULL DEFAULT 1,
      review_count INTEGER NOT NULL DEFAULT 0,
      next_review_at TEXT NOT NULL,
      resolved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (question_id, question_version)
    );
    CREATE TABLE spaced_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    INSERT INTO mistake_notebook VALUES (
      'mst_legacy_1', 'q_leg_1', 1, 'u_1', 'CALCULUS', 'التفاضل والتكامل',
      'سؤال قديم', 'B', 'A', 'تفسير قديم', NULL,
      'unjustified_step', 'ملاحظة قديمة', 3, 1, '2026-10-10T00:00:00.000Z', 0,
      '2026-10-05T00:00:00.000Z', '2026-10-05T00:00:00.000Z'
    );
  `);
  legacyDb.close();

  const store = new SqliteStudyStore(dbPath);
  t.after(() => store.close());
  assert.equal(store.getSchemaVersion(), 3);

  const migrated = store.getMistakes();
  assert.equal(migrated.length, 1);
  assert.equal(migrated[0].errorType, 'CONCEPTUAL');
  assert.equal(migrated[0].studentNote, 'ملاحظة قديمة');

  // Custom non-1 first interval must still force 24h (1 day) for CONCEPTUAL errors
  store.saveSpacedIntervals([3, 7, 14, 14]);
  const tNow = new Date('2026-11-01T12:00:00.000Z');
  const conceptual = store.captureMistake({
    questionId: 'q_concept_1',
    questionVersion: 1,
    unitId: 'u_calc_1',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    questionText: 'متى تكون الدالة قابلة للاشتقاق؟',
    selectedKey: 'B',
    correctKey: 'A',
    explanation: 'الاتصال شرط ضروري ولكنه غير كافٍ لقابلية الاشتقاق.',
    errorType: 'CONCEPTUAL',
    now: tNow
  });
  assert.equal(conceptual.reviewIntervalDays, 1);
  assert.equal(conceptual.nextReviewAt, '2026-11-02T12:00:00.000Z');
  assert.ok(conceptual.conceptualHint.length > 10);

  // Schedule save & readback + atomic sync_outbox entries
  const savedSchedule = store.saveStudentSchedule(
    [{ id: 'slot_1', topic: 'الاشتقاق الضمني', subjectCode: 'CALCULUS' }],
    tNow
  );
  assert.equal(savedSchedule.slots.length, 1);
  assert.equal(store.getStudentSchedule().slots.length, 1);

  const queryCutoff = new Date(Math.max(Date.now(), tNow.getTime()) + 5000);
  const pending = store.getPendingOutboxEntries(queryCutoff, 50);
  // saveSpacedIntervals + captureMistake + saveStudentSchedule = 3 pending outbox entries
  assert.equal(pending.length, 3);
  assert.ok(pending.some((e) => e.entityType === 'mistake_entry'));
  assert.ok(pending.some((e) => e.entityType === 'student_schedule'));

  // Exponential backoff on fail + ack on sync
  const failInfo = store.markOutboxFailed(pending[0].id, 'Network timeout', tNow);
  assert.equal(failInfo.retryCount, 1);
  assert.equal(failInfo.status, 'pending');
  assert.equal(failInfo.nextRetryAt, '2026-11-01T12:00:01.000Z');

  store.markOutboxSynced(pending[1].id, tNow);
  const stats = store.getOutboxStats();
  assert.equal(stats.syncedCount, 1);
  assert.equal(stats.pendingCount, 2);
});





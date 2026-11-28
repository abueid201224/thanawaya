import * as fs from 'node:fs';
import * as path from 'node:path';
import type { DatabaseSync as NodeDatabaseSync } from 'node:sqlite';
import {
  OFFICIAL_MOE_SOURCES,
  filterApprovedQuestionsForStudent,
  validateContentQuestion,
  validateCurriculumUnit,
  validateOfficialSource,
  type ContentQuestionSchema,
  type CurriculumUnitSchema,
  type OfficialMoeSource
} from './contentSchema.ts';

export type StudyMode = 'practice' | 'test' | 'spaced_review';
export type MistakeErrorType =
  | 'CONCEPTUAL'
  | 'FORMULA_SELECTION'
  | 'ALGEBRAIC_CALC'
  | 'MISREAD_GIVENS';
export type LegacyMistakeErrorType = 'rule' | 'algebra' | 'sign_unit' | 'unjustified_step';
export type AnyMistakeErrorType = MistakeErrorType | LegacyMistakeErrorType;
export type SpacedIntervalDays = 1 | 3 | 7 | 14;
export type SyncEntityType = 'study_attempt' | 'mistake_entry' | 'spaced_intervals' | 'student_schedule';
export type SyncOperation = 'append' | 'upsert';
export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface SqliteSyncOutboxEntry {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  status: SyncStatus;
  retryCount: number;
  nextRetryAt: string;
  lastError: string;
  createdAt: string;
  updatedAt: string;
}

export interface SqliteOutboxStats {
  pendingCount: number;
  syncedCount: number;
  failedCount: number;
}

export interface SqliteStudyAttempt {
  id: string;
  questionId: string;
  questionVersion: number;
  unitId: string;
  subjectCode: string;
  mode: StudyMode;
  selectedKey: string;
  isCorrect: boolean;
  hintTierUsed: 0 | 1 | 2 | 3;
  timestamp: string;
}

export interface SqliteMistakeEntry {
  id: string;
  questionId: string;
  questionVersion: number;
  unitId: string;
  subjectCode: string;
  subjectNameAr: string;
  questionText: string;
  selectedKey: string;
  correctKey: string;
  explanation: string;
  solutionSteps?: string[];
  errorType: MistakeErrorType;
  conceptualHint: string;
  studentNote: string;
  reviewIntervalDays: SpacedIntervalDays;
  reviewCount: number;
  nextReviewAt: string;
  createdAt: string;
  updatedAt: string;
  resolved: boolean;
}

const DEFAULT_SPACED_INTERVALS: SpacedIntervalDays[] = [1, 3, 7, 14];
const VALID_MODES = new Set<StudyMode>(['practice', 'test', 'spaced_review']);
const LEGACY_ERROR_MAP: Record<string, MistakeErrorType> = {
  CONCEPTUAL: 'CONCEPTUAL',
  FORMULA_SELECTION: 'FORMULA_SELECTION',
  ALGEBRAIC_CALC: 'ALGEBRAIC_CALC',
  MISREAD_GIVENS: 'MISREAD_GIVENS',
  rule: 'FORMULA_SELECTION',
  algebra: 'ALGEBRAIC_CALC',
  sign_unit: 'MISREAD_GIVENS',
  unjustified_step: 'CONCEPTUAL'
};
const VALID_INTERVALS = new Set<number>([1, 3, 7, 14]);

export function normalizeMistakeErrorType(value: unknown): MistakeErrorType | null {
  if (typeof value !== 'string') return null;
  return LEGACY_ERROR_MAP[value.trim()] ?? null;
}

export function computeSyncBackoffMs(retryCount: number): number {
  const safeCount = Math.max(0, Math.min(10, Math.floor(retryCount)));
  return Math.min(300_000, 1000 * Math.pow(2, safeCount));
}

function buildConceptualHint(subjectNameAr: string, explanation: string): string {
  const cleanExp = explanation.trim();
  const base = cleanExp
    ? `ركّز على الفكرة الأساسية في (${subjectNameAr}): ${cleanExp.slice(0, 140)}`
    : `راجع التعريف الأساسي وشروط تطبيق المبرهنة في (${subjectNameAr}) قبل التعويض العددي.`;
  return base;
}

function loadSqliteModule(): { DatabaseSync: typeof NodeDatabaseSync } {
  const mod = process.getBuiltinModule('node:sqlite') as
    | { DatabaseSync: typeof NodeDatabaseSync }
    | undefined;
  if (!mod || typeof mod.DatabaseSync !== 'function') {
    throw new Error('Built-in node:sqlite module is not available in this runtime');
  }
  return mod;
}

function addDaysIso(baseDate: Date, days: number): string {
  return new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function isValidSpacedIntervalTuple(value: unknown): value is SpacedIntervalDays[] {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((n) => typeof n === 'number' && VALID_INTERVALS.has(n))
  );
}

/**
 * Local-First SQLite Store backed by Node built-in `node:sqlite` (`DatabaseSync`).
 * All queries use parameterized prepared statements (zero SQL string interpolation).
 */
export class SqliteStudyStore {
  private db: NodeDatabaseSync;
  public readonly dbPath: string;

  private closed = false;
  private transactionDepth = 0;

  constructor(dbPath: string = ':memory:') {
    this.dbPath = dbPath;
    if (dbPath !== ':memory:') {
      const parent = path.dirname(path.resolve(dbPath));
      if (!fs.existsSync(parent)) {
        fs.mkdirSync(parent, { recursive: true });
      }
    }

    const dbExistedBeforeOpen = dbPath !== ':memory:' && fs.existsSync(path.resolve(dbPath));
    const { DatabaseSync } = loadSqliteModule();
    this.db = new DatabaseSync(dbPath);
    this.initializePragmas();
    const appliedNow = this.runMigrations();
    this.seedOfficialMoeSources();

    if (dbPath !== ':memory:' && (dbExistedBeforeOpen || appliedNow.length > 0)) {
      try {
        this.createRotatingBackup(3);
      } catch {
        // Non-fatal if backup directory is temporarily unavailable
      }
    }
  }

  public isInTransaction(): boolean {
    return this.transactionDepth > 0 || Boolean((this.db as unknown as { isTransaction?: boolean }).isTransaction);
  }

  /**
   * Executes a database unit of work inside an atomic SQLite transaction.
   * Uses BEGIN IMMEDIATE for top-level transactions so the write lock is acquired
   * upfront, preventing partial writes or SQLITE_BUSY upgrades on abrupt Windows shutdown.
   */
  private runInTransaction<T>(fn: () => T): T {
    const isOuter = this.transactionDepth === 0;
    this.transactionDepth += 1;
    const savepointName = `sp_tx_${this.transactionDepth}`;

    if (isOuter) {
      this.db.exec('BEGIN IMMEDIATE;');
    } else {
      this.db.exec(`SAVEPOINT ${savepointName};`);
    }

    try {
      const result = fn();
      if (isOuter) {
        this.db.exec('COMMIT;');
      } else {
        this.db.exec(`RELEASE SAVEPOINT ${savepointName};`);
      }
      return result;
    } catch (err) {
      try {
        if (isOuter) {
          this.db.exec('ROLLBACK;');
        } else {
          this.db.exec(`ROLLBACK TO SAVEPOINT ${savepointName};`);
          this.db.exec(`RELEASE SAVEPOINT ${savepointName};`);
        }
      } catch {
        // Ignore rollback failure if database handle is already closing or corrupted
      }
      throw err;
    } finally {
      this.transactionDepth -= 1;
    }
  }

  private initializePragmas(): void {
    this.db.exec('PRAGMA busy_timeout = 5000;');
    if (this.dbPath !== ':memory:') {
      this.db.exec('PRAGMA journal_mode = WAL;');
      this.db.exec('PRAGMA synchronous = FULL;');
    }
    this.db.exec('PRAGMA foreign_keys = ON;');
  }

  /**
   * Idempotent versioned schema migrations tracked in `schema_version`.
   * Preserves all existing student data across upgrades.
   */
  public runMigrations(): number[] {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      );
    `);

    const appliedRows = this.db
      .prepare('SELECT version FROM schema_version ORDER BY version ASC')
      .all() as Array<{ version: number }>;
    const appliedVersions = new Set(appliedRows.map((r) => Number(r.version)));

    const migrations: Array<{ version: number; name: string; up: () => void }> = [
      {
        version: 1,
        name: 'baseline_moe_study_schema',
        up: () => {
          this.db.exec(`
            CREATE TABLE IF NOT EXISTS official_sources (
              id TEXT PRIMARY KEY,
              title_ar TEXT NOT NULL,
              portal_type TEXT NOT NULL CHECK (portal_type IN ('student_books', 'ellibrary_books', 'performance_assessments')),
              url TEXT NOT NULL UNIQUE,
              academic_year TEXT NOT NULL,
              verified_domain TEXT NOT NULL,
              created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS curriculum_units (
              id TEXT PRIMARY KEY,
              subject_code TEXT NOT NULL,
              subject_name_ar TEXT NOT NULL,
              unit_number INTEGER NOT NULL CHECK (unit_number >= 1),
              title TEXT NOT NULL,
              description TEXT NOT NULL,
              learning_outcomes_json TEXT NOT NULL,
              source_id TEXT REFERENCES official_sources(id) ON DELETE SET NULL,
              academic_year TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS content_questions (
              id TEXT PRIMARY KEY,
              question_version INTEGER NOT NULL DEFAULT 1 CHECK (question_version >= 1),
              unit_id TEXT NOT NULL REFERENCES curriculum_units(id) ON DELETE CASCADE,
              subject_code TEXT NOT NULL,
              question_number INTEGER NOT NULL CHECK (question_number >= 1),
              question_text TEXT NOT NULL,
              options_json TEXT NOT NULL,
              correct_key TEXT NOT NULL,
              explanation TEXT NOT NULL,
              solution_steps_json TEXT,
              hints_json TEXT,
              difficulty TEXT NOT NULL CHECK (difficulty IN ('A', 'B', 'C')),
              targeted_learning_outcome TEXT NOT NULL,
              exam_source TEXT,
              source_id TEXT REFERENCES official_sources(id) ON DELETE SET NULL,
              review_status TEXT NOT NULL DEFAULT 'unreviewed' CHECK (review_status IN ('reviewed', 'unreviewed')),
              reviewed_by TEXT,
              reviewed_at TEXT,
              verified_sympy INTEGER NOT NULL DEFAULT 0 CHECK (verified_sympy IN (0, 1))
            );

            CREATE INDEX IF NOT EXISTS idx_content_questions_unit_status
              ON content_questions (unit_id, review_status);

            CREATE TABLE IF NOT EXISTS study_attempts (
              id TEXT PRIMARY KEY,
              question_id TEXT NOT NULL,
              question_version INTEGER NOT NULL CHECK (question_version >= 1),
              unit_id TEXT NOT NULL,
              subject_code TEXT NOT NULL,
              mode TEXT NOT NULL CHECK (mode IN ('practice', 'test', 'spaced_review')),
              selected_key TEXT NOT NULL,
              is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
              hint_tier_used INTEGER NOT NULL DEFAULT 0 CHECK (hint_tier_used BETWEEN 0 AND 3),
              created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_study_attempts_question
              ON study_attempts (question_id, question_version, created_at);

            CREATE TABLE IF NOT EXISTS mistake_notebook (
              id TEXT PRIMARY KEY,
              question_id TEXT NOT NULL,
              question_version INTEGER NOT NULL CHECK (question_version >= 1),
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
              review_interval_days INTEGER NOT NULL DEFAULT 1 CHECK (review_interval_days IN (1, 3, 7, 14)),
              review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
              next_review_at TEXT NOT NULL,
              resolved INTEGER NOT NULL DEFAULT 0 CHECK (resolved IN (0, 1)),
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              UNIQUE (question_id, question_version)
            );

            CREATE INDEX IF NOT EXISTS idx_mistake_notebook_due
              ON mistake_notebook (resolved, next_review_at);

            CREATE TABLE IF NOT EXISTS spaced_settings (
              key TEXT PRIMARY KEY,
              value_json TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );
          `);
        }
      },
      {
        version: 2,
        name: 'composite_query_indexes',
        up: () => {
          this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_mistakes_due_branch
              ON mistake_notebook (resolved, next_review_at, subject_code);

            CREATE INDEX IF NOT EXISTS idx_attempts_unit_date
              ON study_attempts (unit_id, created_at);
          `);
        }
      },
      {
        version: 3,
        name: 'sync_outbox_schedules_and_root_cause_taxonomy',
        up: () => {
          this.db.exec(`
            ALTER TABLE mistake_notebook RENAME TO mistake_notebook_v2;

            CREATE TABLE mistake_notebook (
              id TEXT PRIMARY KEY,
              question_id TEXT NOT NULL,
              question_version INTEGER NOT NULL CHECK (question_version >= 1),
              unit_id TEXT NOT NULL,
              subject_code TEXT NOT NULL,
              subject_name_ar TEXT NOT NULL,
              question_text TEXT NOT NULL,
              selected_key TEXT NOT NULL,
              correct_key TEXT NOT NULL,
              explanation TEXT NOT NULL,
              solution_steps_json TEXT,
              error_type TEXT NOT NULL CHECK (error_type IN ('CONCEPTUAL', 'FORMULA_SELECTION', 'ALGEBRAIC_CALC', 'MISREAD_GIVENS')),
              conceptual_hint TEXT NOT NULL DEFAULT '',
              student_note TEXT NOT NULL DEFAULT '',
              review_interval_days INTEGER NOT NULL DEFAULT 1 CHECK (review_interval_days IN (1, 3, 7, 14)),
              review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
              next_review_at TEXT NOT NULL,
              resolved INTEGER NOT NULL DEFAULT 0 CHECK (resolved IN (0, 1)),
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              UNIQUE (question_id, question_version)
            );

            INSERT INTO mistake_notebook (
              id, question_id, question_version, unit_id, subject_code, subject_name_ar,
              question_text, selected_key, correct_key, explanation, solution_steps_json,
              error_type, conceptual_hint, student_note, review_interval_days, review_count,
              next_review_at, resolved, created_at, updated_at
            )
            SELECT
              id, question_id, question_version, unit_id, subject_code, subject_name_ar,
              question_text, selected_key, correct_key, explanation, solution_steps_json,
              CASE error_type
                WHEN 'rule' THEN 'FORMULA_SELECTION'
                WHEN 'algebra' THEN 'ALGEBRAIC_CALC'
                WHEN 'sign_unit' THEN 'MISREAD_GIVENS'
                WHEN 'unjustified_step' THEN 'CONCEPTUAL'
                WHEN 'CONCEPTUAL' THEN 'CONCEPTUAL'
                WHEN 'FORMULA_SELECTION' THEN 'FORMULA_SELECTION'
                WHEN 'ALGEBRAIC_CALC' THEN 'ALGEBRAIC_CALC'
                WHEN 'MISREAD_GIVENS' THEN 'MISREAD_GIVENS'
                ELSE 'CONCEPTUAL'
              END,
              '',
              student_note, review_interval_days, review_count,
              next_review_at, resolved, created_at, updated_at
            FROM mistake_notebook_v2;

            DROP TABLE mistake_notebook_v2;

            CREATE INDEX IF NOT EXISTS idx_mistake_notebook_due
              ON mistake_notebook (resolved, next_review_at);
            CREATE INDEX IF NOT EXISTS idx_mistakes_due_branch
              ON mistake_notebook (resolved, next_review_at, subject_code);

            CREATE TABLE IF NOT EXISTS sync_outbox (
              id TEXT PRIMARY KEY,
              entity_type TEXT NOT NULL CHECK (entity_type IN ('study_attempt', 'mistake_entry', 'spaced_intervals', 'student_schedule')),
              entity_id TEXT NOT NULL,
              operation TEXT NOT NULL CHECK (operation IN ('append', 'upsert')),
              payload_json TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'failed')),
              retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
              next_retry_at TEXT NOT NULL,
              last_error TEXT NOT NULL DEFAULT '',
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_sync_outbox_pending
              ON sync_outbox (status, next_retry_at);

            CREATE TABLE IF NOT EXISTS student_schedules (
              id TEXT PRIMARY KEY,
              payload_json TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );
          `);
        }
      }
    ];

    const newlyApplied: number[] = [];
    for (const migration of migrations) {
      if (appliedVersions.has(migration.version)) {
        continue;
      }
      this.runInTransaction(() => {
        migration.up();
        this.db
          .prepare('INSERT INTO schema_version (version, name, applied_at) VALUES (?, ?, ?)')
          .run(migration.version, migration.name, new Date().toISOString());
      });
      newlyApplied.push(migration.version);
    }

    return newlyApplied;
  }

  public getSchemaVersion(): number {
    const row = this.db
      .prepare('SELECT COALESCE(MAX(version), 0) AS max_version FROM schema_version')
      .get() as { max_version?: number } | undefined;
    return Number(row?.max_version ?? 0);
  }

  public getAppliedMigrations(): Array<{ version: number; name: string; appliedAt: string }> {
    const rows = this.db
      .prepare('SELECT version, name, applied_at FROM schema_version ORDER BY version ASC')
      .all() as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      version: Number(r.version),
      name: String(r.name),
      appliedAt: String(r.applied_at)
    }));
  }

  /**
   * Creates an atomic SQLite snapshot inside `<dbParentDir>/backups/` and retains
   * only the latest `maxKeep` (default 3) snapshots.
   */
  public createRotatingBackup(maxKeep: number = 3): string | null {
    if (this.closed || this.dbPath === ':memory:') return null;

    const keepCount = Math.max(1, Math.min(20, Math.floor(maxKeep)));
    const dbParent = fs.realpathSync(path.dirname(path.resolve(this.dbPath)));
    const backupsDir = path.join(dbParent, 'backups');

    // Enforce path confinement strictly inside dbParent
    const relDir = path.relative(dbParent, backupsDir);
    if (!relDir || relDir.startsWith('..') || path.isAbsolute(relDir)) {
      throw new Error('Unsafe backup directory path');
    }

    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    } else {
      const stat = fs.lstatSync(backupsDir);
      if (stat.isSymbolicLink() || !stat.isDirectory()) {
        throw new Error('Backup target must be a real directory');
      }
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rand = Math.random().toString(36).slice(2, 6);
    const filename = `thanaweya_backup_${stamp}_${rand}.sqlite`;
    if (!/^thanaweya_backup_[A-Za-z0-9_-]+\.sqlite$/.test(filename)) {
      throw new Error('Invalid generated backup filename');
    }
    const targetPath = path.join(backupsDir, filename);
    const escapedTarget = targetPath.replace(/'/g, "''");

    this.db.exec(`VACUUM INTO '${escapedTarget}';`);

    // Prune older snapshots, retaining only the latest `keepCount`
    const entries = fs
      .readdirSync(backupsDir, { withFileTypes: true })
      .filter((e) => e.isFile() && /^thanaweya_backup_.*\.sqlite$/.test(e.name))
      .map((e) => {
        const full = path.join(backupsDir, e.name);
        const st = fs.statSync(full);
        return { name: e.name, full, mtimeMs: st.mtimeMs };
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs || b.name.localeCompare(a.name));

    for (const stale of entries.slice(keepCount)) {
      try {
        fs.unlinkSync(stale.full);
      } catch {
        // ignore stale file cleanup error
      }
    }

    return targetPath;
  }

  private seedOfficialMoeSources(): void {
    const now = new Date().toISOString();
    this.runInTransaction(() => {
      const stmt = this.db.prepare(`
        INSERT INTO official_sources (id, title_ar, portal_type, url, academic_year, verified_domain, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title_ar = excluded.title_ar,
          portal_type = excluded.portal_type,
          url = excluded.url,
          academic_year = excluded.academic_year,
          verified_domain = excluded.verified_domain
      `);

      for (const src of OFFICIAL_MOE_SOURCES) {
        stmt.run(
          src.id,
          src.titleAr,
          src.portalType,
          src.url,
          src.academicYear,
          src.verifiedDomain,
          now
        );
      }
    });
  }

  public close(): void {
    if (this.closed) return;
    this.closed = true;
    if (this.dbPath !== ':memory:') {
      try {
        this.db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
      } catch {
        // ignore checkpoint failure if database is already closing
      }
    }
    try {
      this.db.close();
    } catch {
      // already closed
    }
  }

  // ==========================================
  // 1. Official MOE Sources & Content Schema
  // ==========================================

  public listOfficialSources(): OfficialMoeSource[] {
    const rows = this.db
      .prepare('SELECT id, title_ar, portal_type, url, academic_year, verified_domain FROM official_sources ORDER BY id ASC')
      .all() as Array<Record<string, unknown>>;

    return rows.map((r) => ({
      id: String(r.id),
      titleAr: String(r.title_ar),
      portalType: String(r.portal_type) as OfficialMoeSource['portalType'],
      url: String(r.url),
      academicYear: String(r.academic_year),
      verifiedDomain: String(r.verified_domain)
    }));
  }

  public upsertOfficialSource(raw: unknown): OfficialMoeSource {
    const validated = validateOfficialSource(raw);
    if (!validated.ok) {
      throw new Error(validated.error);
    }
    const src = validated.value;
    const now = new Date().toISOString();
    return this.runInTransaction(() => {
      this.db
        .prepare(`
          INSERT INTO official_sources (id, title_ar, portal_type, url, academic_year, verified_domain, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title_ar = excluded.title_ar,
            portal_type = excluded.portal_type,
            url = excluded.url,
            academic_year = excluded.academic_year,
            verified_domain = excluded.verified_domain
        `)
        .run(src.id, src.titleAr, src.portalType, src.url, src.academicYear, src.verifiedDomain, now);
      return src;
    });
  }

  public upsertCurriculumUnit(raw: unknown): CurriculumUnitSchema {
    const validated = validateCurriculumUnit(raw);
    if (!validated.ok) {
      throw new Error(validated.error);
    }
    const unit = validated.value;
    const now = new Date().toISOString();
    return this.runInTransaction(() => {
      this.db
        .prepare(`
          INSERT INTO curriculum_units (
            id, subject_code, subject_name_ar, unit_number, title, description,
            learning_outcomes_json, source_id, academic_year, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            subject_code = excluded.subject_code,
            subject_name_ar = excluded.subject_name_ar,
            unit_number = excluded.unit_number,
            title = excluded.title,
            description = excluded.description,
            learning_outcomes_json = excluded.learning_outcomes_json,
            source_id = excluded.source_id,
            academic_year = excluded.academic_year,
            updated_at = excluded.updated_at
        `)
        .run(
          unit.id,
          unit.subjectCode,
          unit.subjectNameAr,
          unit.unitNumber,
          unit.title,
          unit.description,
          JSON.stringify(unit.learningOutcomes),
          unit.sourceId ?? null,
          unit.academicYear,
          now
        );
      return unit;
    });
  }

  public upsertContentQuestion(raw: unknown): ContentQuestionSchema {
    const validated = validateContentQuestion(raw);
    if (!validated.ok) {
      throw new Error(validated.error);
    }
    const q = validated.value;
    return this.runInTransaction(() => {
      this.db
        .prepare(`
          INSERT INTO content_questions (
            id, question_version, unit_id, subject_code, question_number, question_text,
            options_json, correct_key, explanation, solution_steps_json, hints_json,
            difficulty, targeted_learning_outcome, exam_source, source_id,
            review_status, reviewed_by, reviewed_at, verified_sympy
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            question_version = excluded.question_version,
            unit_id = excluded.unit_id,
            subject_code = excluded.subject_code,
            question_number = excluded.question_number,
            question_text = excluded.question_text,
            options_json = excluded.options_json,
            correct_key = excluded.correct_key,
            explanation = excluded.explanation,
            solution_steps_json = excluded.solution_steps_json,
            hints_json = excluded.hints_json,
            difficulty = excluded.difficulty,
            targeted_learning_outcome = excluded.targeted_learning_outcome,
            exam_source = excluded.exam_source,
            source_id = excluded.source_id,
            review_status = excluded.review_status,
            reviewed_by = excluded.reviewed_by,
            reviewed_at = excluded.reviewed_at,
            verified_sympy = excluded.verified_sympy
        `)
        .run(
          q.id,
          q.questionVersion,
          q.unitId,
          q.subjectCode,
          q.questionNumber,
          q.questionText,
          JSON.stringify(q.options),
          q.correctKey,
          q.explanation,
          q.solutionSteps ? JSON.stringify(q.solutionSteps) : null,
          q.hints ? JSON.stringify(q.hints) : null,
          q.difficulty,
          q.targetedLearningOutcome,
          q.examSource ?? null,
          q.sourceId ?? null,
          q.reviewStatus,
          q.reviewedBy ?? null,
          q.reviewedAt ?? null,
          q.verifiedBySympy ? 1 : 0
        );
      return q;
    });
  }

  public getStudentApprovedCurriculum(): Array<CurriculumUnitSchema & { questions: ContentQuestionSchema[] }> {
    const unitRows = this.db
      .prepare(`
        SELECT id, subject_code, subject_name_ar, unit_number, title, description,
               learning_outcomes_json, source_id, academic_year
        FROM curriculum_units
        ORDER BY subject_code ASC, unit_number ASC
      `)
      .all() as Array<Record<string, unknown>>;

    const questionRows = this.db
      .prepare(`
        SELECT id, question_version, unit_id, subject_code, question_number, question_text,
               options_json, correct_key, explanation, solution_steps_json, hints_json,
               difficulty, targeted_learning_outcome, exam_source, source_id,
               review_status, reviewed_by, reviewed_at, verified_sympy
        FROM content_questions
        WHERE review_status = 'reviewed' AND question_version >= 1
        ORDER BY question_number ASC
      `)
      .all() as Array<Record<string, unknown>>;

    const mappedQuestions = filterApprovedQuestionsForStudent(
      questionRows.map((r) => ({
        id: String(r.id),
        questionVersion: Number(r.question_version),
        unitId: String(r.unit_id),
        subjectCode: String(r.subject_code),
        questionNumber: Number(r.question_number),
        questionText: String(r.question_text),
        options: JSON.parse(String(r.options_json)),
        correctKey: String(r.correct_key),
        explanation: String(r.explanation),
        solutionSteps: r.solution_steps_json ? JSON.parse(String(r.solution_steps_json)) : undefined,
        hints: r.hints_json ? JSON.parse(String(r.hints_json)) : undefined,
        difficulty: String(r.difficulty) as 'A' | 'B' | 'C',
        targetedLearningOutcome: String(r.targeted_learning_outcome),
        examSource: r.exam_source ? String(r.exam_source) : undefined,
        sourceId: r.source_id ? String(r.source_id) : undefined,
        reviewStatus: String(r.review_status) as 'reviewed' | 'unreviewed',
        reviewedBy: r.reviewed_by ? String(r.reviewed_by) : undefined,
        reviewedAt: r.reviewed_at ? String(r.reviewed_at) : undefined,
        verifiedBySympy: Number(r.verified_sympy) === 1
      }))
    );

    const byUnit = new Map<string, ContentQuestionSchema[]>();
    for (const q of mappedQuestions) {
      const list = byUnit.get(q.unitId) || [];
      list.push(q);
      byUnit.set(q.unitId, list);
    }

    return unitRows.map((u) => ({
      id: String(u.id),
      subjectCode: String(u.subject_code),
      subjectNameAr: String(u.subject_name_ar),
      unitNumber: Number(u.unit_number),
      title: String(u.title),
      description: String(u.description),
      learningOutcomes: JSON.parse(String(u.learning_outcomes_json)),
      sourceId: u.source_id ? String(u.source_id) : undefined,
      academicYear: String(u.academic_year),
      questions: byUnit.get(String(u.id)) || []
    }));
  }

  // ==========================================
  // 2. Study Attempts (Version-Bound)
  // ==========================================

  public recordAttempt(input: {
    id?: string;
    questionId: string;
    questionVersion: number;
    unitId: string;
    subjectCode: string;
    mode: StudyMode;
    selectedKey: string;
    isCorrect: boolean;
    hintTierUsed?: 0 | 1 | 2 | 3;
    timestamp?: string;
  }): SqliteStudyAttempt {
    if (!input.questionId || typeof input.questionId !== 'string') {
      throw new Error('questionId is required');
    }
    if (!input.unitId || typeof input.unitId !== 'string') {
      throw new Error('unitId is required');
    }
    if (!input.subjectCode || typeof input.subjectCode !== 'string') {
      throw new Error('subjectCode is required');
    }
    if (typeof input.selectedKey !== 'string' || !input.selectedKey.trim()) {
      throw new Error('selectedKey is required');
    }
    if (!Number.isInteger(input.questionVersion) || input.questionVersion < 1) {
      throw new Error('questionVersion must be >= 1');
    }
    if (!VALID_MODES.has(input.mode)) {
      throw new Error('Invalid study mode');
    }
    const hintTier = (input.hintTierUsed ?? 0) as 0 | 1 | 2 | 3;
    if (![0, 1, 2, 3].includes(hintTier)) {
      throw new Error('hintTierUsed must be between 0 and 3');
    }

    const id = input.id || `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const timestamp = input.timestamp || new Date().toISOString();

    return this.runInTransaction(() => {
      this.db
        .prepare(`
          INSERT INTO study_attempts (
            id, question_id, question_version, unit_id, subject_code,
            mode, selected_key, is_correct, hint_tier_used, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          id,
          input.questionId,
          input.questionVersion,
          input.unitId,
          input.subjectCode,
          input.mode,
          input.selectedKey,
          input.isCorrect ? 1 : 0,
          hintTier,
          timestamp
        );

      // Read-back verification inside the same atomic transaction
      const row = this.db
        .prepare('SELECT * FROM study_attempts WHERE id = ?')
        .get(id) as Record<string, unknown> | undefined;
      if (!row) {
        throw new Error('Failed to verify SQLite write for study attempt');
      }

      const attempt: SqliteStudyAttempt = {
        id: String(row.id),
        questionId: String(row.question_id),
        questionVersion: Number(row.question_version),
        unitId: String(row.unit_id),
        subjectCode: String(row.subject_code),
        mode: String(row.mode) as StudyMode,
        selectedKey: String(row.selected_key),
        isCorrect: Number(row.is_correct) === 1,
        hintTierUsed: Number(row.hint_tier_used) as 0 | 1 | 2 | 3,
        timestamp: String(row.created_at)
      };

      this.enqueueOutboxInsideTx('study_attempt', attempt.id, 'append', attempt, timestamp);
      return attempt;
    });
  }

  public getAttempts(limit: number = 200): SqliteStudyAttempt[] {
    const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit)));
    const rows = this.db
      .prepare('SELECT * FROM study_attempts ORDER BY created_at DESC LIMIT ?')
      .all(safeLimit) as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      id: String(row.id),
      questionId: String(row.question_id),
      questionVersion: Number(row.question_version),
      unitId: String(row.unit_id),
      subjectCode: String(row.subject_code),
      mode: String(row.mode) as StudyMode,
      selectedKey: String(row.selected_key),
      isCorrect: Number(row.is_correct) === 1,
      hintTierUsed: Number(row.hint_tier_used) as 0 | 1 | 2 | 3,
      timestamp: String(row.created_at)
    }));
  }

  // ==========================================
  // 3. Mistake Notebook & Spaced Repetition
  // ==========================================

  public getSpacedIntervals(): SpacedIntervalDays[] {
    const row = this.db
      .prepare('SELECT value_json FROM spaced_settings WHERE key = ?')
      .get('spaced_intervals') as { value_json?: string } | undefined;
    if (!row?.value_json) return [...DEFAULT_SPACED_INTERVALS];
    try {
      const parsed = JSON.parse(row.value_json);
      if (isValidSpacedIntervalTuple(parsed)) return parsed;
    } catch {
      // ignore corrupt setting
    }
    return [...DEFAULT_SPACED_INTERVALS];
  }

  public saveSpacedIntervals(intervals: SpacedIntervalDays[]): SpacedIntervalDays[] {
    if (!isValidSpacedIntervalTuple(intervals)) {
      throw new Error('spaced intervals must be a 4-element tuple from [1, 3, 7, 14]');
    }
    const now = new Date().toISOString();
    return this.runInTransaction(() => {
      this.db
        .prepare(`
          INSERT INTO spaced_settings (key, value_json, updated_at)
          VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET
            value_json = excluded.value_json,
            updated_at = excluded.updated_at
        `)
        .run('spaced_intervals', JSON.stringify(intervals), now);
      const saved = this.getSpacedIntervals();
      this.enqueueOutboxInsideTx('spaced_intervals', 'spaced_intervals', 'upsert', {
        intervals: saved,
        updatedAt: now
      }, now);
      return saved;
    });
  }

  public captureMistake(input: {
    id?: string;
    questionId: string;
    questionVersion: number;
    unitId: string;
    subjectCode: string;
    subjectNameAr: string;
    questionText: string;
    selectedKey: string;
    correctKey: string;
    explanation: string;
    solutionSteps?: string[];
    errorType: AnyMistakeErrorType;
    conceptualHint?: string;
    studentNote?: string;
    now?: Date;
  }): SqliteMistakeEntry {
    if (!input.questionId || typeof input.questionId !== 'string') {
      throw new Error('questionId is required');
    }
    if (!input.unitId || typeof input.unitId !== 'string') {
      throw new Error('unitId is required');
    }
    if (!input.subjectCode || typeof input.subjectCode !== 'string') {
      throw new Error('subjectCode is required');
    }
    if (!input.subjectNameAr || typeof input.subjectNameAr !== 'string') {
      throw new Error('subjectNameAr is required');
    }
    if (!input.questionText || typeof input.questionText !== 'string') {
      throw new Error('questionText is required');
    }
    if (typeof input.selectedKey !== 'string' || !input.selectedKey.trim()) {
      throw new Error('selectedKey is required');
    }
    if (typeof input.correctKey !== 'string' || !input.correctKey.trim()) {
      throw new Error('correctKey is required');
    }
    if (typeof input.explanation !== 'string') {
      throw new Error('explanation is required');
    }
    const normalizedErrorType = normalizeMistakeErrorType(input.errorType);
    if (!normalizedErrorType) {
      throw new Error('Invalid errorType');
    }
    if (!Number.isInteger(input.questionVersion) || input.questionVersion < 1) {
      throw new Error('questionVersion must be >= 1');
    }

    const nowDate = input.now || new Date();
    const nowIso = nowDate.toISOString();
    const id = input.id || `mst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return this.runInTransaction(() => {
      const intervals = this.getSpacedIntervals();
      // CONCEPTUAL root-cause errors always enforce a 24h (1-day) spaced review + conceptual scaffolding hint
      const firstInterval: SpacedIntervalDays =
        normalizedErrorType === 'CONCEPTUAL' ? 1 : (intervals[0] || 1);
      const nextReviewAt = addDaysIso(nowDate, firstInterval);
      const conceptualHint =
        normalizedErrorType === 'CONCEPTUAL'
          ? (input.conceptualHint?.trim() || buildConceptualHint(input.subjectNameAr, input.explanation))
          : (input.conceptualHint?.trim() || '');

      this.db
        .prepare(`
          INSERT INTO mistake_notebook (
            id, question_id, question_version, unit_id, subject_code, subject_name_ar,
            question_text, selected_key, correct_key, explanation, solution_steps_json,
            error_type, conceptual_hint, student_note, review_interval_days, review_count, next_review_at,
            resolved, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?, ?)
          ON CONFLICT(question_id, question_version) DO UPDATE SET
            selected_key = excluded.selected_key,
            error_type = excluded.error_type,
            conceptual_hint = CASE
              WHEN excluded.conceptual_hint <> '' THEN excluded.conceptual_hint
              ELSE mistake_notebook.conceptual_hint
            END,
            student_note = CASE
              WHEN excluded.student_note <> '' THEN excluded.student_note
              ELSE mistake_notebook.student_note
            END,
            review_interval_days = excluded.review_interval_days,
            next_review_at = excluded.next_review_at,
            resolved = 0,
            updated_at = excluded.updated_at
        `)
        .run(
          id,
          input.questionId,
          input.questionVersion,
          input.unitId,
          input.subjectCode,
          input.subjectNameAr,
          input.questionText,
          input.selectedKey,
          input.correctKey,
          input.explanation,
          input.solutionSteps ? JSON.stringify(input.solutionSteps) : null,
          normalizedErrorType,
          conceptualHint,
          input.studentNote || '',
          firstInterval,
          nextReviewAt,
          nowIso,
          nowIso
        );

      const row = this.db
        .prepare('SELECT * FROM mistake_notebook WHERE question_id = ? AND question_version = ?')
        .get(input.questionId, input.questionVersion) as Record<string, unknown> | undefined;
      if (!row) {
        throw new Error('Failed to verify SQLite write for mistake entry');
      }
      const mapped = this.mapMistakeRow(row);
      this.enqueueOutboxInsideTx('mistake_entry', mapped.id, 'upsert', mapped, nowIso);
      return mapped;
    });
  }

  public getMistakes(): SqliteMistakeEntry[] {
    const rows = this.db
      .prepare('SELECT * FROM mistake_notebook ORDER BY updated_at DESC')
      .all() as Array<Record<string, unknown>>;
    return rows.map((r) => this.mapMistakeRow(r));
  }

  public getDueReviews(now: Date = new Date()): SqliteMistakeEntry[] {
    const rows = this.db
      .prepare(
        'SELECT * FROM mistake_notebook WHERE resolved = 0 AND next_review_at <= ? ORDER BY next_review_at ASC'
      )
      .all(now.toISOString()) as Array<Record<string, unknown>>;
    return rows.map((r) => this.mapMistakeRow(r));
  }

  public recordSpacedReviewOutcome(
    mistakeId: string,
    wasCorrect: boolean,
    now: Date = new Date()
  ): SqliteMistakeEntry {
    return this.runInTransaction(() => {
      const existing = this.db
        .prepare('SELECT * FROM mistake_notebook WHERE id = ?')
        .get(mistakeId) as Record<string, unknown> | undefined;
      if (!existing) {
        throw new Error('Mistake entry not found');
      }

      const intervals = this.getSpacedIntervals();
      const currentInterval = Number(existing.review_interval_days) as SpacedIntervalDays;
      let nextInterval: SpacedIntervalDays = intervals[0] || 1;
      let resolved = false;

      if (wasCorrect) {
        const idx = intervals.indexOf(currentInterval);
        if (idx === -1) {
          nextInterval = intervals[0] || 1;
        } else if (idx === intervals.length - 1) {
          nextInterval = intervals[idx];
          resolved = true;
        } else {
          nextInterval = intervals[idx + 1];
        }
      } else if (existing.error_type === 'CONCEPTUAL') {
        nextInterval = 1;
      }

      const nextReviewAt = addDaysIso(now, nextInterval);
      const updatedAt = now.toISOString();

      this.db
        .prepare(`
          UPDATE mistake_notebook
          SET review_interval_days = ?,
              review_count = review_count + 1,
              next_review_at = ?,
              resolved = ?,
              updated_at = ?
          WHERE id = ?
        `)
        .run(nextInterval, nextReviewAt, resolved ? 1 : 0, updatedAt, mistakeId);

      const updated = this.db
        .prepare('SELECT * FROM mistake_notebook WHERE id = ?')
        .get(mistakeId) as Record<string, unknown>;
      const mapped = this.mapMistakeRow(updated);
      this.enqueueOutboxInsideTx('mistake_entry', mapped.id, 'upsert', mapped, updatedAt);
      return mapped;
    });
  }

  public updateMistakeClassification(
    mistakeId: string,
    errorType: AnyMistakeErrorType,
    studentNote?: string,
    now: Date = new Date()
  ): SqliteMistakeEntry {
    const normalizedErrorType = normalizeMistakeErrorType(errorType);
    if (!normalizedErrorType) {
      throw new Error('Invalid errorType');
    }
    return this.runInTransaction(() => {
      const existing = this.db
        .prepare('SELECT * FROM mistake_notebook WHERE id = ?')
        .get(mistakeId) as Record<string, unknown> | undefined;
      if (!existing) {
        throw new Error('Mistake entry not found');
      }

      const updatedAt = now.toISOString();
      const nextNote = studentNote !== undefined ? studentNote : String(existing.student_note || '');
      const existingHint = String(existing.conceptual_hint || '');
      const nextHint =
        normalizedErrorType === 'CONCEPTUAL'
          ? (existingHint || buildConceptualHint(String(existing.subject_name_ar || ''), String(existing.explanation || '')))
          : existingHint;
      const nextIntervalDays =
        normalizedErrorType === 'CONCEPTUAL'
          ? 1
          : Number(existing.review_interval_days);
      const nextReviewAt =
        normalizedErrorType === 'CONCEPTUAL'
          ? addDaysIso(now, 1)
          : String(existing.next_review_at);

      this.db
        .prepare(`
          UPDATE mistake_notebook
          SET error_type = ?,
              conceptual_hint = ?,
              student_note = ?,
              review_interval_days = ?,
              next_review_at = ?,
              updated_at = ?
          WHERE id = ?
        `)
        .run(normalizedErrorType, nextHint, nextNote, nextIntervalDays, nextReviewAt, updatedAt, mistakeId);

      const updated = this.db
        .prepare('SELECT * FROM mistake_notebook WHERE id = ?')
        .get(mistakeId) as Record<string, unknown>;
      const mapped = this.mapMistakeRow(updated);
      this.enqueueOutboxInsideTx('mistake_entry', mapped.id, 'upsert', mapped, updatedAt);
      return mapped;
    });
  }

  // ==========================================
  // 4. Hybrid Sync Outbox & Student Schedule
  // ==========================================

  private enqueueOutboxInsideTx(
    entityType: SyncEntityType,
    entityId: string,
    operation: SyncOperation,
    payload: unknown,
    nowIso: string
  ): void {
    const outboxId = `out_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.db
      .prepare(`
        INSERT INTO sync_outbox (
          id, entity_type, entity_id, operation, payload_json,
          status, retry_count, next_retry_at, last_error, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, '', ?, ?)
      `)
      .run(outboxId, entityType, entityId, operation, JSON.stringify(payload), nowIso, nowIso, nowIso);
  }

  public getPendingOutboxEntries(now: Date = new Date(), limit: number = 50): SqliteSyncOutboxEntry[] {
    const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
    const rows = this.db
      .prepare(`
        SELECT * FROM sync_outbox
        WHERE status = 'pending' AND next_retry_at <= ?
        ORDER BY created_at ASC
        LIMIT ?
      `)
      .all(now.toISOString(), safeLimit) as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      id: String(row.id),
      entityType: String(row.entity_type) as SyncEntityType,
      entityId: String(row.entity_id),
      operation: String(row.operation) as SyncOperation,
      payload: JSON.parse(String(row.payload_json)),
      status: String(row.status) as SyncStatus,
      retryCount: Number(row.retry_count),
      nextRetryAt: String(row.next_retry_at),
      lastError: String(row.last_error || ''),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at)
    }));
  }

  public getOutboxStats(): SqliteOutboxStats {
    const rows = this.db
      .prepare('SELECT status, COUNT(*) AS cnt FROM sync_outbox GROUP BY status')
      .all() as Array<{ status: string; cnt: number }>;
    let pendingCount = 0;
    let syncedCount = 0;
    let failedCount = 0;
    for (const r of rows) {
      if (r.status === 'pending') pendingCount = Number(r.cnt);
      else if (r.status === 'synced') syncedCount = Number(r.cnt);
      else if (r.status === 'failed') failedCount = Number(r.cnt);
    }
    return { pendingCount, syncedCount, failedCount };
  }

  public markOutboxSynced(outboxId: string, now: Date = new Date()): void {
    const nowIso = now.toISOString();
    this.runInTransaction(() => {
      this.db
        .prepare(`
          UPDATE sync_outbox
          SET status = 'synced', updated_at = ?
          WHERE id = ?
        `)
        .run(nowIso, outboxId);
    });
  }

  public markOutboxFailed(outboxId: string, errorMessage: string, now: Date = new Date()): {
    retryCount: number;
    nextRetryAt: string;
    status: SyncStatus;
  } {
    return this.runInTransaction(() => {
      const row = this.db
        .prepare('SELECT retry_count FROM sync_outbox WHERE id = ?')
        .get(outboxId) as { retry_count?: number } | undefined;
      if (!row) {
        throw new Error('Outbox entry not found');
      }
      const nextRetryCount = Number(row.retry_count ?? 0) + 1;
      const delayMs = computeSyncBackoffMs(nextRetryCount - 1);
      const nextRetryAt = new Date(now.getTime() + delayMs).toISOString();
      const status: SyncStatus = nextRetryCount >= 8 ? 'failed' : 'pending';
      const updatedAt = now.toISOString();

      this.db
        .prepare(`
          UPDATE sync_outbox
          SET status = ?,
              retry_count = ?,
              next_retry_at = ?,
              last_error = ?,
              updated_at = ?
          WHERE id = ?
        `)
        .run(status, nextRetryCount, nextRetryAt, errorMessage.slice(0, 400), updatedAt, outboxId);

      return { retryCount: nextRetryCount, nextRetryAt, status };
    });
  }

  public saveStudentSchedule(scheduleSlots: unknown[], now: Date = new Date()): {
    slots: unknown[];
    updatedAt: string;
  } {
    if (!Array.isArray(scheduleSlots)) {
      throw new Error('scheduleSlots must be an array');
    }
    const updatedAt = now.toISOString();
    return this.runInTransaction(() => {
      this.db
        .prepare(`
          INSERT INTO student_schedules (id, payload_json, updated_at)
          VALUES ('primary', ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            payload_json = excluded.payload_json,
            updated_at = excluded.updated_at
        `)
        .run(JSON.stringify(scheduleSlots), updatedAt);

      this.enqueueOutboxInsideTx('student_schedule', 'primary', 'upsert', {
        schedule: scheduleSlots,
        updatedAt
      }, updatedAt);

      return { slots: scheduleSlots, updatedAt };
    });
  }

  public getStudentSchedule(): { slots: unknown[]; updatedAt: string | null } {
    const row = this.db
      .prepare("SELECT payload_json, updated_at FROM student_schedules WHERE id = 'primary'")
      .get() as { payload_json?: string; updated_at?: string } | undefined;
    if (!row?.payload_json) {
      return { slots: [], updatedAt: null };
    }
    try {
      const parsed = JSON.parse(row.payload_json);
      return {
        slots: Array.isArray(parsed) ? parsed : [],
        updatedAt: row.updated_at ? String(row.updated_at) : null
      };
    } catch {
      return { slots: [], updatedAt: null };
    }
  }

  private mapMistakeRow(row: Record<string, unknown>): SqliteMistakeEntry {
    const normalizedType = normalizeMistakeErrorType(row.error_type) || 'CONCEPTUAL';
    return {
      id: String(row.id),
      questionId: String(row.question_id),
      questionVersion: Number(row.question_version),
      unitId: String(row.unit_id),
      subjectCode: String(row.subject_code),
      subjectNameAr: String(row.subject_name_ar),
      questionText: String(row.question_text),
      selectedKey: String(row.selected_key),
      correctKey: String(row.correct_key),
      explanation: String(row.explanation),
      solutionSteps: row.solution_steps_json ? JSON.parse(String(row.solution_steps_json)) : undefined,
      errorType: normalizedType,
      conceptualHint: String(row.conceptual_hint || ''),
      studentNote: String(row.student_note || ''),
      reviewIntervalDays: Number(row.review_interval_days) as SpacedIntervalDays,
      reviewCount: Number(row.review_count),
      nextReviewAt: String(row.next_review_at),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      resolved: Number(row.resolved) === 1
    };
  }
}

/**
 * Official Egyptian Ministry of Education (MOE) Curriculum & Performance Assessments Schema
 * Grounded in the official portals:
 *  - https://studentbooks.moe.gov.eg/books/Books-sec/
 *  - https://ellibrary.moe.gov.eg/Books/Books-sec/
 *  - https://ellibrary.moe.gov.eg/Performance_Assessments
 */

export type OfficialPortalType =
  | 'student_books'
  | 'ellibrary_books'
  | 'performance_assessments';

export interface OfficialMoeSource {
  id: string;
  titleAr: string;
  portalType: OfficialPortalType;
  url: string;
  academicYear: string;
  verifiedDomain: string;
}

export interface ContentOptionSchema {
  key: string;
  text: string;
}

export interface ContentQuestionSchema {
  id: string;
  questionVersion: number;
  unitId: string;
  subjectCode: string;
  questionNumber: number;
  questionText: string;
  options: ContentOptionSchema[];
  correctKey: string;
  explanation: string;
  solutionSteps?: string[];
  hints?: [string, string, string];
  difficulty: 'A' | 'B' | 'C';
  targetedLearningOutcome: string;
  examSource?: string;
  sourceId?: string;
  reviewStatus: 'reviewed' | 'unreviewed';
  reviewedBy?: string;
  reviewedAt?: string;
  verifiedBySympy: boolean;
}

export interface CurriculumUnitSchema {
  id: string;
  subjectCode: string;
  subjectNameAr: string;
  unitNumber: number;
  title: string;
  description: string;
  learningOutcomes: string[];
  sourceId?: string;
  academicYear: string;
}

export const OFFICIAL_MOE_SOURCES: OfficialMoeSource[] = [
  {
    id: 'moe_studentbooks_sec',
    titleAr: 'بوابة الكتب الدراسية للمرحلة الثانوية — وزارة التربية والتعليم',
    portalType: 'student_books',
    url: 'https://studentbooks.moe.gov.eg/books/Books-sec/',
    academicYear: '2026/2027',
    verifiedDomain: 'studentbooks.moe.gov.eg'
  },
  {
    id: 'moe_ellibrary_books_sec',
    titleAr: 'المكتبة الإلكترونية لكتب المرحلة الثانوية — وزارة التربية والتعليم',
    portalType: 'ellibrary_books',
    url: 'https://ellibrary.moe.gov.eg/Books/Books-sec/',
    academicYear: '2026/2027',
    verifiedDomain: 'ellibrary.moe.gov.eg'
  },
  {
    id: 'moe_performance_assessments',
    titleAr: 'الأداءات والتقييمات الأسبوعية والشهرية الرسمية — وزارة التربية والتعليم',
    portalType: 'performance_assessments',
    url: 'https://ellibrary.moe.gov.eg/Performance_Assessments',
    academicYear: '2026/2027',
    verifiedDomain: 'ellibrary.moe.gov.eg'
  }
];

const ALLOWED_MOE_HOST_SUFFIXES = ['.moe.gov.eg', '.ekb.eg'];

export function isTrustedMoeUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_MOE_HOST_SUFFIXES.some(
      (suffix) => host === suffix.slice(1) || host.endsWith(suffix)
    );
  } catch {
    return false;
  }
}

export function validateOfficialSource(source: unknown): { ok: true; value: OfficialMoeSource } | { ok: false; error: string } {
  if (!source || typeof source !== 'object') {
    return { ok: false, error: 'Source payload must be an object' };
  }
  const s = source as Record<string, unknown>;
  if (typeof s.id !== 'string' || !/^[a-zA-Z0-9_-]{2,80}$/.test(s.id)) {
    return { ok: false, error: 'Invalid source id' };
  }
  if (typeof s.titleAr !== 'string' || s.titleAr.trim().length < 3) {
    return { ok: false, error: 'Invalid source titleAr' };
  }
  if (
    s.portalType !== 'student_books' &&
    s.portalType !== 'ellibrary_books' &&
    s.portalType !== 'performance_assessments'
  ) {
    return { ok: false, error: 'Invalid portalType' };
  }
  if (typeof s.url !== 'string' || !isTrustedMoeUrl(s.url)) {
    return { ok: false, error: 'Source URL must be an https://*.moe.gov.eg or *.ekb.eg URL' };
  }
  if (typeof s.academicYear !== 'string' || !/^\d{4}\/\d{4}$/.test(s.academicYear)) {
    return { ok: false, error: 'academicYear must match YYYY/YYYY format' };
  }
  const parsed = new URL(s.url);
  return {
    ok: true,
    value: {
      id: s.id,
      titleAr: s.titleAr.trim(),
      portalType: s.portalType,
      url: s.url,
      academicYear: s.academicYear,
      verifiedDomain: parsed.hostname.toLowerCase()
    }
  };
}

export function validateCurriculumUnit(unit: unknown): { ok: true; value: CurriculumUnitSchema } | { ok: false; error: string } {
  if (!unit || typeof unit !== 'object') {
    return { ok: false, error: 'Unit payload must be an object' };
  }
  const u = unit as Record<string, unknown>;
  if (typeof u.id !== 'string' || !/^[a-zA-Z0-9_-]{2,80}$/.test(u.id)) {
    return { ok: false, error: 'Invalid unit id' };
  }
  if (typeof u.subjectCode !== 'string' || !/^[A-Z0-9_]{2,40}$/.test(u.subjectCode)) {
    return { ok: false, error: 'Invalid subjectCode' };
  }
  if (typeof u.subjectNameAr !== 'string' || u.subjectNameAr.trim().length < 2) {
    return { ok: false, error: 'Invalid subjectNameAr' };
  }
  if (typeof u.unitNumber !== 'number' || !Number.isInteger(u.unitNumber) || u.unitNumber < 1) {
    return { ok: false, error: 'unitNumber must be a positive integer' };
  }
  if (typeof u.title !== 'string' || u.title.trim().length < 3) {
    return { ok: false, error: 'Invalid unit title' };
  }
  if (typeof u.description !== 'string' || u.description.trim().length < 3) {
    return { ok: false, error: 'Invalid unit description' };
  }
  if (!Array.isArray(u.learningOutcomes) || u.learningOutcomes.some((item) => typeof item !== 'string')) {
    return { ok: false, error: 'learningOutcomes must be a string array' };
  }
  const academicYear = typeof u.academicYear === 'string' && /^\d{4}\/\d{4}$/.test(u.academicYear)
    ? u.academicYear
    : '2026/2027';

  return {
    ok: true,
    value: {
      id: u.id,
      subjectCode: u.subjectCode,
      subjectNameAr: u.subjectNameAr.trim(),
      unitNumber: u.unitNumber,
      title: u.title.trim(),
      description: u.description.trim(),
      learningOutcomes: u.learningOutcomes.map((s) => s.trim()).filter(Boolean),
      sourceId: typeof u.sourceId === 'string' && u.sourceId.trim() ? u.sourceId.trim() : undefined,
      academicYear
    }
  };
}

export function validateContentQuestion(q: unknown): { ok: true; value: ContentQuestionSchema } | { ok: false; error: string } {
  if (!q || typeof q !== 'object') {
    return { ok: false, error: 'Question payload must be an object' };
  }
  const item = q as Record<string, unknown>;
  if (typeof item.id !== 'string' || !/^[a-zA-Z0-9_-]{2,80}$/.test(item.id)) {
    return { ok: false, error: 'Invalid question id' };
  }
  const questionVersion = typeof item.questionVersion === 'number' ? item.questionVersion : 1;
  if (!Number.isInteger(questionVersion) || questionVersion < 1) {
    return { ok: false, error: 'questionVersion must be an integer >= 1' };
  }
  if (typeof item.unitId !== 'string' || !/^[a-zA-Z0-9_-]{2,80}$/.test(item.unitId)) {
    return { ok: false, error: 'Invalid unitId' };
  }
  if (typeof item.subjectCode !== 'string' || !/^[A-Z0-9_]{2,40}$/.test(item.subjectCode)) {
    return { ok: false, error: 'Invalid subjectCode' };
  }
  if (typeof item.questionNumber !== 'number' || !Number.isInteger(item.questionNumber) || item.questionNumber < 1) {
    return { ok: false, error: 'questionNumber must be a positive integer' };
  }
  if (typeof item.questionText !== 'string' || item.questionText.trim().length < 3) {
    return { ok: false, error: 'Invalid questionText' };
  }
  if (!Array.isArray(item.options) || item.options.length < 2) {
    return { ok: false, error: 'options must contain at least 2 choices' };
  }
  const validOptions: ContentOptionSchema[] = [];
  for (const opt of item.options) {
    if (!opt || typeof opt !== 'object') return { ok: false, error: 'Invalid option entry' };
    const o = opt as Record<string, unknown>;
    if (typeof o.key !== 'string' || !o.key.trim() || typeof o.text !== 'string' || !o.text.trim()) {
      return { ok: false, error: 'Each option requires non-empty key and text' };
    }
    validOptions.push({ key: o.key.trim(), text: o.text.trim() });
  }
  if (typeof item.correctKey !== 'string' || !validOptions.some((o) => o.key === item.correctKey)) {
    return { ok: false, error: 'correctKey must match one of the provided option keys' };
  }
  if (typeof item.explanation !== 'string' || item.explanation.trim().length < 2) {
    return { ok: false, error: 'Invalid explanation' };
  }
  if (item.difficulty !== 'A' && item.difficulty !== 'B' && item.difficulty !== 'C') {
    return { ok: false, error: 'difficulty must be A, B, or C' };
  }
  if (typeof item.targetedLearningOutcome !== 'string' || item.targetedLearningOutcome.trim().length < 2) {
    return { ok: false, error: 'targetedLearningOutcome is required' };
  }
  const reviewStatus = item.reviewStatus === 'reviewed' ? 'reviewed' : 'unreviewed';
  if (reviewStatus === 'reviewed' && (typeof item.reviewedBy !== 'string' || !item.reviewedBy.trim())) {
    return { ok: false, error: 'reviewedBy is required when reviewStatus is reviewed' };
  }

  let hints: [string, string, string] | undefined;
  if (Array.isArray(item.hints) && item.hints.length === 3 && item.hints.every((h) => typeof h === 'string')) {
    hints = [item.hints[0].trim(), item.hints[1].trim(), item.hints[2].trim()];
  }

  const solutionSteps = Array.isArray(item.solutionSteps)
    ? item.solutionSteps.filter((s): s is string => typeof s === 'string').map((s) => s.trim())
    : undefined;

  return {
    ok: true,
    value: {
      id: item.id,
      questionVersion,
      unitId: item.unitId,
      subjectCode: item.subjectCode,
      questionNumber: item.questionNumber,
      questionText: item.questionText.trim(),
      options: validOptions,
      correctKey: item.correctKey,
      explanation: item.explanation.trim(),
      solutionSteps,
      hints,
      difficulty: item.difficulty,
      targetedLearningOutcome: item.targetedLearningOutcome.trim(),
      examSource: typeof item.examSource === 'string' ? item.examSource.trim() : undefined,
      sourceId: typeof item.sourceId === 'string' && item.sourceId.trim() ? item.sourceId.trim() : undefined,
      reviewStatus,
      reviewedBy: typeof item.reviewedBy === 'string' ? item.reviewedBy.trim() : undefined,
      reviewedAt: typeof item.reviewedAt === 'string' ? item.reviewedAt.trim() : undefined,
      verifiedBySympy: Boolean(item.verifiedBySympy)
    }
  };
}

export function filterApprovedQuestionsForStudent<T extends { reviewStatus: string; questionVersion: number }>(
  questions: T[]
): T[] {
  return questions.filter((q) => q.reviewStatus === 'reviewed' && q.questionVersion >= 1);
}

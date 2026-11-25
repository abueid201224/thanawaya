import type { CurriculumUnit, MonthlyExam, PracticeQuestion } from '../types';

/**
 * Strict Student Content Gate:
 * Ensures ONLY questions with reviewStatus === 'reviewed' are ever shown
 * to students in Practice, Test, Skip Exam, or Spaced Review modes.
 */
export function isQuestionApprovedForStudents(question: PracticeQuestion): boolean {
  return question.reviewStatus === 'reviewed' && question.questionVersion >= 1;
}

export function getReviewedQuestionsForStudent(questions: PracticeQuestion[]): PracticeQuestion[] {
  return questions.filter(isQuestionApprovedForStudents);
}

export function getReviewedUnitsForStudent(units: CurriculumUnit[]): CurriculumUnit[] {
  return units.map((unit) => ({
    ...unit,
    practiceQuestions: getReviewedQuestionsForStudent(unit.practiceQuestions)
  }));
}

export function getReviewedExamsForStudent(exams: MonthlyExam[]): MonthlyExam[] {
  return exams.map((exam) => ({
    ...exam,
    questions: getReviewedQuestionsForStudent(exam.questions)
  }));
}

export function getUnreviewedQuestionCount(units: CurriculumUnit[], exams: MonthlyExam[] = []): number {
  const unitUnreviewed = units.reduce(
    (sum, u) => sum + u.practiceQuestions.filter((q) => !isQuestionApprovedForStudents(q)).length,
    0
  );
  const examUnreviewed = exams.reduce(
    (sum, e) => sum + e.questions.filter((q) => !isQuestionApprovedForStudents(q)).length,
    0
  );
  return unitUnreviewed + examUnreviewed;
}

/**
 * Deterministic Hint Answer-Leak Filter (Tiered Hint Ladder):
 * Guarantees that no hint text (Tier 1: Idea, Tier 2: Rule, Tier 3: First Step)
 * accidentally leaks the final answer option text or explicit answer key.
 */
export function sanitizeHintWithoutAnswerLeak(
  hintText: string,
  question: PracticeQuestion
): string {
  const cleanHint = (hintText || '').trim();
  if (!cleanHint) return '';

  const correctOpt = question.options.find((o) => o.key === question.correctKey);
  const correctText = (correctOpt?.text || '').trim();

  // Check if hint explicitly names the correct option letter pattern e.g. "(A)" or "الإجابة A"
  const keyLeakRegex = new RegExp(
    `(الإجابة\\s*(الصحيحة)?\\s*[:=]?\\s*${question.correctKey}\\b|\\(${question.correctKey}\\))`,
    'i'
  );
  if (keyLeakRegex.test(cleanHint)) {
    return 'ركّز على تطبيق القاعدة الأساسية أولاً ثم قارن ناتجك بالاختيارات.';
  }

  // Check if the full exact answer expression (length >= 4) appears verbatim in the hint
  if (correctText.length >= 4 && cleanHint.includes(correctText)) {
    return 'طبّق خطوة التعويض أو الاشتقاق الأساسية للوصول إلى الصورة النهائية بنفسك.';
  }

  return cleanHint;
}

export function getSafeHintLadder(question: PracticeQuestion): [string, string, string] {
  const raw: [string, string, string] = question.hints || [
    `حدّد المعطيات والمطلوب بدقة في موضوع (${question.targetedLearningOutcome}).`,
    'استحضر القاعدة الأساسية أو القانون الرياضي الرابط بين المعطيات.',
    'ابدأ بكتابة الخطوة الأولى للتعويض أو الاشتقاق قبل النظر للحل الكامل.'
  ];
  return [
    sanitizeHintWithoutAnswerLeak(raw[0], question),
    sanitizeHintWithoutAnswerLeak(raw[1], question),
    sanitizeHintWithoutAnswerLeak(raw[2], question)
  ];
}

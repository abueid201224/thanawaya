import type { PracticeQuestion, SubjectProgress } from '../types';

const UNIT_SKIP_PASS_PERCENTAGE = 80;

/**
 * Calculate a proportional score for equal-weight questions.
 * Returns null when there are no questions so an empty exam is never scored as zero/full.
 */
export function calculateProportionalScore(
  correctAnswers: number,
  questionCount: number,
  totalMarks: number
): number | null {
  if (!Number.isInteger(correctAnswers) || correctAnswers < 0) {
    throw new RangeError('correctAnswers must be a non-negative integer');
  }
  if (!Number.isInteger(questionCount) || questionCount < 0 || correctAnswers > questionCount) {
    throw new RangeError('questionCount must be an integer greater than or equal to correctAnswers');
  }
  if (!Number.isFinite(totalMarks) || totalMarks < 0) {
    throw new RangeError('totalMarks must be a finite non-negative number');
  }
  if (questionCount === 0) return null;
  return Math.round((correctAnswers / questionCount) * totalMarks);
}

/**
 * A passing score alone must not automatically skip a curriculum unit.
 * The assessment blueprint must be explicitly reviewed and marked ready first.
 */
export function canApproveUnitSkip(assessmentReady: boolean, percentage: number): boolean {
  return assessmentReady && Number.isFinite(percentage) && percentage >= UNIT_SKIP_PASS_PERCENTAGE;
}

/**
 * Skip approval requires every question to be reviewed and mapped exactly to a unit outcome.
 * Strict matching intentionally keeps paraphrased or unmapped seed content diagnostic-only.
 */
export function hasReviewedOutcomeCoverage(
  learningOutcomes: readonly string[],
  questions: readonly Pick<PracticeQuestion, 'targetedLearningOutcome' | 'reviewStatus'>[]
): boolean {
  if (learningOutcomes.length === 0 || questions.length === 0) return false;

  const normalize = (value: string) => value.trim().replace(/\s+/g, ' ');
  const outcomeSet = new Set(learningOutcomes.map(normalize).filter(Boolean));
  if (outcomeSet.size !== learningOutcomes.length) return false;
  if (questions.some((question) => question.reviewStatus !== 'reviewed')) return false;

  const questionOutcomes = questions.map((question) => normalize(question.targetedLearningOutcome));
  if (questionOutcomes.some((outcome) => !outcome || !outcomeSet.has(outcome))) return false;

  const coveredOutcomes = new Set(questionOutcomes);
  return learningOutcomes.every((outcome) => coveredOutcomes.has(normalize(outcome)));
}

/**
 * A passed skip assessment can complete a chapter, but does not itself prove mastery
 * of each learning outcome. Outcome counts stay unchanged until outcome-level evidence exists.
 */
export function recordSkippedUnitProgress(progress: SubjectProgress): SubjectProgress {
  const completedChapters = Math.min(progress.totalChapters, progress.completedChapters + 1);

  return {
    ...progress,
    completedChapters,
    masteryPercentage: progress.totalChapters > 0
      ? Math.round((completedChapters / progress.totalChapters) * 100)
      : 0
  };
}

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

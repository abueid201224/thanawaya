import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateProportionalScore, canApproveUnitSkip } from '../../src/lib/assessmentScoring.ts';
import { initialUser, initialDailySchedule, initialSubjectProgress, initialDisciplineMetrics, initialMultimediaLibrary, initialScoutedResources, initialExamEssentials, curriculumSourceReferences } from '../../src/data/curriculumData.ts';
import { initialCurriculumUnits, initialMonthlyExams } from '../../src/data/fullCurriculumData.ts';

test('preserves a genuine zero score', () => {
  assert.equal(calculateProportionalScore(0, 2, 20), 0);
});

test('calculates an equal-weight score on the exam scale', () => {
  assert.equal(calculateProportionalScore(1, 2, 20), 10);
  assert.equal(calculateProportionalScore(2, 2, 20), 20);
});

test('does not assign a score to an exam with no questions', () => {
  assert.equal(calculateProportionalScore(0, 0, 20), null);
});

test('rejects impossible counts and invalid total marks', () => {
  assert.throws(() => calculateProportionalScore(2, 1, 20), RangeError);
  assert.throws(() => calculateProportionalScore(-1, 2, 20), RangeError);
  assert.throws(() => calculateProportionalScore(1, 2, Number.NaN), RangeError);
});

test('requires a reviewed assessment blueprint before approving unit skip', () => {
  assert.equal(canApproveUnitSkip(false, 100), false);
  assert.equal(canApproveUnitSkip(true, 79), false);
  assert.equal(canApproveUnitSkip(true, 80), true);
  assert.equal(canApproveUnitSkip(true, Number.NaN), false);
});

test('new local profile has no privileged role or invented personal scores', () => {
  assert.equal(initialUser.role, 'student');
  assert.equal(initialUser.email, '');
  assert.equal(initialUser.dailyStreak, 0);
  assert.equal(initialUser.disciplineScore, 0);
});

test('fresh learning state contains no pre-completed sessions, units, or exams', () => {
  assert.ok(initialDailySchedule.every((slot) => !slot.isCompleted));
  assert.ok(initialCurriculumUnits.every((unit) => unit.status === 'not_started'));
  assert.ok(initialMonthlyExams.every((exam) => !exam.isCompleted && exam.scoreAwarded === undefined));
  assert.ok(initialSubjectProgress.every((subject) =>
    subject.completedChapters === 0 &&
    subject.quizzesTaken === 0 &&
    subject.averageScore === 0 &&
    subject.masteryPercentage === 0 &&
    subject.learningOutcomesMastered === 0
  ));
  assert.equal(initialDisciplineMetrics.totalStudyMinutesToday, 0);
  assert.equal(initialDisciplineMetrics.currentStreakDays, 0);
  assert.equal(initialDisciplineMetrics.badgesEarned.length, 0);
});

test('training library seeds do not imply official approval or exam-frequency evidence', () => {
  assert.equal(initialScoutedResources.length, 0);
  assert.ok(initialMultimediaLibrary.every((item) =>
    item.sourceStatus === 'unverified' &&
    item.url === '' &&
    item.rating === undefined
  ));
  assert.ok(initialExamEssentials.every((essential) =>
    essential.importanceRating === 0 &&
    essential.pastExamOccurrences.length === 0
  ));
});

test('curriculum source links are real ministry portals and disclose their year/content limits', () => {
  assert.ok(curriculumSourceReferences.length >= 2);
  assert.ok(curriculumSourceReferences.some((reference) => reference.url === 'https://moe.gov.eg/ar/learning-outcomes/'));
  assert.ok(curriculumSourceReferences.some((reference) => reference.url === 'https://ellibrary.moe.gov.eg/books/Books-sec/'));
  assert.ok(curriculumSourceReferences.every((reference) => {
    const host = new URL(reference.url).hostname;
    return (host === 'moe.gov.eg' || host.endsWith('.moe.gov.eg')) &&
      reference.limitation.length > 20 &&
      /سنة|2026|تحقّق/.test(reference.yearScope + reference.limitation);
  }));
});

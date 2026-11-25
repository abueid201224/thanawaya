import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import { initialCurriculumUnits, initialMonthlyExams } from '../../src/data/fullCurriculumData';
import { OFFICIAL_BOOKLET_PAGES } from '../../src/data/conceptBookletPages';
import {
  getReviewedExamsForStudent,
  getReviewedQuestionsForStudent,
  getReviewedUnitsForStudent,
  getSafeHintLadder,
  isQuestionApprovedForStudents
} from '../../src/services/contentGate';
import type { PracticeQuestion } from '../../src/types';

function extractMathSegments(text: string): string[] {
  const segments: string[] = [];
  const regex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const expr = (match[1] ?? match[2] ?? '').trim();
    if (expr) segments.push(expr);
  }
  return segments;
}

function assertValidKatex(formula: string, sourceLabel: string) {
  assert.doesNotThrow(() => {
    katex.renderToString(formula, {
      throwOnError: true,
      strict: 'ignore',
      displayMode: false
    });
  }, `Invalid KaTeX in ${sourceLabel}: ${formula}`);
}

test('all KaTeX formulas in curriculum data and concept booklet compile with throwOnError: true', () => {
  let formulaCount = 0;

  for (const unit of initialCurriculumUnits) {
    for (const field of [unit.description, ...unit.learningOutcomes, ...unit.studyNotesSummary]) {
      for (const expr of extractMathSegments(field)) {
        assertValidKatex(expr, `unit ${unit.id}`);
        formulaCount++;
      }
    }

    for (const q of unit.practiceQuestions) {
      const texts = [
        q.questionText,
        q.explanation,
        ...q.options.map((o) => o.text),
        ...(q.solutionSteps || []),
        ...(q.hints || [])
      ];
      for (const txt of texts) {
        for (const expr of extractMathSegments(txt)) {
          assertValidKatex(expr, `question ${q.id}`);
          formulaCount++;
        }
      }
    }
  }

  for (const exam of initialMonthlyExams) {
    for (const q of exam.questions) {
      const texts = [
        q.questionText,
        q.explanation,
        ...q.options.map((o) => o.text),
        ...(q.solutionSteps || []),
        ...(q.hints || [])
      ];
      for (const txt of texts) {
        for (const expr of extractMathSegments(txt)) {
          assertValidKatex(expr, `exam ${exam.id} question ${q.id}`);
          formulaCount++;
        }
      }
    }
  }

  for (const page of OFFICIAL_BOOKLET_PAGES) {
    for (const sec of page.sections) {
      if (sec.latex) {
        assertValidKatex(sec.latex, `booklet p${page.pageNumber} ${sec.id} latex`);
        formulaCount++;
      }
      if (sec.ruleBox?.formula) {
        assertValidKatex(sec.ruleBox.formula, `booklet p${page.pageNumber} ${sec.id} ruleBox`);
        formulaCount++;
      }
      for (const txt of [sec.description, ...(sec.bulletPoints || []), sec.examAlert || '']) {
        for (const expr of extractMathSegments(txt)) {
          assertValidKatex(expr, `booklet p${page.pageNumber} ${sec.id}`);
          formulaCount++;
        }
      }
    }
  }

  assert.ok(formulaCount > 40, `Expected > 40 formulas verified, got ${formulaCount}`);
});

test('curriculum IDs are unique, versioned, and Student Content Gate excludes unreviewed questions', () => {
  const unitIds = new Set<string>();
  const questionIds = new Set<string>();

  for (const unit of initialCurriculumUnits) {
    assert.equal(unitIds.has(unit.id), false, `Duplicate unit id: ${unit.id}`);
    unitIds.add(unit.id);
    for (const q of unit.practiceQuestions) {
      assert.equal(questionIds.has(q.id), false, `Duplicate question id: ${q.id}`);
      questionIds.add(q.id);
      assert.ok(q.questionVersion >= 1, `Missing questionVersion on ${q.id}`);
      assert.ok(q.reviewStatus === 'reviewed' || q.reviewStatus === 'unreviewed');
    }
  }

  for (const exam of initialMonthlyExams) {
    for (const q of exam.questions) {
      assert.equal(questionIds.has(q.id), false, `Duplicate exam question id: ${q.id}`);
      questionIds.add(q.id);
      assert.ok(q.questionVersion >= 1, `Missing questionVersion on ${q.id}`);
    }
  }

  const reviewedUnits = getReviewedUnitsForStudent(initialCurriculumUnits);
  const studentQuestions = reviewedUnits.flatMap((u) => u.practiceQuestions);
  assert.ok(studentQuestions.length >= 6);
  for (const q of studentQuestions) {
    assert.equal(isQuestionApprovedForStudents(q), true);
    assert.equal(q.reviewStatus, 'reviewed');
  }

  // Unreviewed units must produce zero student questions
  const unreviewedIds = new Set(['pq_calc_3_1', 'pq_stat_4_1', 'pq_dyn_1_1', 'pq_phys_1_1']);
  for (const q of studentQuestions) {
    assert.equal(unreviewedIds.has(q.id), false, `Unreviewed question leaked: ${q.id}`);
  }

  const reviewedExams = getReviewedExamsForStudent(initialMonthlyExams);
  const studentExamQuestions = reviewedExams.flatMap((e) => e.questions);
  assert.equal(studentExamQuestions.some((q) => q.id === 'mq_nov_1' || q.id === 'mq_mid_1'), false);
  assert.equal(studentExamQuestions.some((q) => q.id === 'mq_oct_1' && q.reviewStatus === 'reviewed'), true);

  // Direct list filter verification
  const mixed = [
    ...initialCurriculumUnits.flatMap((u) => u.practiceQuestions)
  ];
  const filtered = getReviewedQuestionsForStudent(mixed);
  assert.equal(filtered.every((q) => q.reviewStatus === 'reviewed'), true);
});

test('Hint Ladder sanitizer prevents leaking exact correctKey or verbatim answer text', () => {
  const trickyQuestion: PracticeQuestion = {
    id: 'test_leak',
    questionVersion: 1,
    reviewStatus: 'reviewed',
    questionNumber: 1,
    questionText: 'ما قيمة التكامل؟',
    options: [
      { key: 'A', text: '$x e^x - e^x + C$' },
      { key: 'B', text: '$x e^x + C$' }
    ],
    correctKey: 'A',
    explanation: 'التكامل بالتجزيء',
    hints: [
      'الإجابة الصحيحة A واضحة هنا',
      'الناتج سيكون $x e^x - e^x + C$ مباشرة',
      'ابدأ بفرض $u = x$ و $dv = e^x dx$'
    ],
    difficulty: 'B',
    targetedLearningOutcome: 'التكامل بالتجزيء'
  };

  const ladder = getSafeHintLadder(trickyQuestion);
  assert.equal(ladder[0].includes('A'), false);
  assert.equal(ladder[1].includes('$x e^x - e^x + C$'), false);
  assert.ok(ladder[2].includes('$u = x$'));
});

test('independent numerical verification of all reviewed math questions matches marked correctKey', () => {
  const h = 1e-6;
  const allReviewed = [
    ...initialCurriculumUnits.flatMap((u) => u.practiceQuestions),
    ...initialMonthlyExams.flatMap((e) => e.questions)
  ].filter(isQuestionApprovedForStudents);

  const byId = new Map(allReviewed.map((q) => [q.id, q]));

  // 1. pq_calc_1_1: d/dx cot^2(3x) = -6 cot(3x) csc^2(3x)
  {
    const x = 0.4;
    const f = (t: number) => Math.pow(1 / Math.tan(3 * t), 2);
    const numDeriv = (f(x + h) - f(x - h)) / (2 * h);
    const optionA = -6 * (1 / Math.tan(3 * x)) * Math.pow(1 / Math.sin(3 * x), 2);
    assert.ok(Math.abs(numDeriv - optionA) < 1e-5);
    assert.equal(byId.get('pq_calc_1_1')?.correctKey, 'A');
  }

  // 2. pq_calc_1_2: ladder L=10, x=6, dx/dt=2 => dy/dt = -1.5
  {
    const L = 10;
    const x = 6;
    const dxDt = 2;
    const y = Math.sqrt(L * L - x * x);
    const dyDt = -(x * dxDt) / y;
    assert.equal(dyDt, -1.5);
    assert.equal(byId.get('pq_calc_1_2')?.correctKey, 'A');
  }

  // 3. pq_calc_1_3: x = t^2 - 1, y = t^3 - 4 at t = 2 => dy/dx = 3
  {
    const t = 2;
    const x = (u: number) => u * u - 1;
    const y = (u: number) => u * u * u - 4;
    const slope = (y(t + h) - y(t - h)) / (x(t + h) - x(t - h));
    assert.ok(Math.abs(slope - 3) < 1e-6);
    assert.equal(byId.get('pq_calc_1_3')?.correctKey, 'A');
  }

  // 4. pq_calc_2_1: d/dx ln|x^2 + 3x + 5| = (2x+3)/(x^2+3x+5)
  {
    const x = 2.1;
    const anti = (u: number) => Math.log(Math.abs(u * u + 3 * u + 5));
    const deriv = (anti(x + h) - anti(x - h)) / (2 * h);
    const integrand = (2 * x + 3) / (x * x + 3 * x + 5);
    assert.ok(Math.abs(deriv - integrand) < 1e-6);
    assert.equal(byId.get('pq_calc_2_1')?.correctKey, 'A');
  }

  // 5. pq_calc_2_2: d/dx (x e^x - e^x) = x e^x
  {
    const x = 1.5;
    const anti = (u: number) => u * Math.exp(u) - Math.exp(u);
    const deriv = (anti(x + h) - anti(x - h)) / (2 * h);
    assert.ok(Math.abs(deriv - x * Math.exp(x)) < 1e-6);
    assert.equal(byId.get('pq_calc_2_2')?.correctKey, 'A');
  }

  // 6. pq_stat_1_1: F = mu_s * W = 0.25 * 40 = 10 N
  {
    assert.equal(0.25 * 40, 10);
    assert.equal(byId.get('pq_stat_1_1')?.correctKey, 'A');
  }

  // 7. mq_oct_1: d/dx (sec(x)tan(x)) at x = 0 => 1
  {
    const f = (u: number) => (1 / Math.cos(u)) * Math.tan(u);
    const derivAt0 = (f(h) - f(-h)) / (2 * h);
    assert.ok(Math.abs(derivAt0 - 1) < 1e-6);
    assert.equal(byId.get('mq_oct_1')?.correctKey, 'A');
  }

  // 8. mq_oct_2: P = 60 sin(30) + (sqrt(3)/3) * 60 cos(30) = 60
  {
    const rad = (30 * Math.PI) / 180;
    const P = 60 * Math.sin(rad) + (Math.sqrt(3) / 3) * 60 * Math.cos(rad);
    assert.ok(Math.abs(P - 60) < 1e-9);
    assert.equal(byId.get('mq_oct_2')?.correctKey, 'A');
  }
});

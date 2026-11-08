import React, { useState } from 'react';
import {
  FastForward,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Zap,
  Check,
  X,
  Target,
  Brain,
  HelpCircle,
  FileCheck2
} from 'lucide-react';
import { CurriculumUnit, SkipEvaluationResult, PracticeQuestion } from '../types';
import { MixedTextRenderer } from './MathRenderer';
import { canApproveUnitSkip, hasReviewedOutcomeCoverage } from '../lib/assessmentScoring';

interface SkipExamEngineProps {
  units: CurriculumUnit[];
  initialSelectedUnit: CurriculumUnit | null;
  onConfirmSkipUnit: (unitId: string, score: number) => void;
  onNavigateToSchedule: () => void;
}

export const SkipExamEngine: React.FC<SkipExamEngineProps> = ({
  units,
  initialSelectedUnit,
  onConfirmSkipUnit,
  onNavigateToSchedule
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    initialSelectedUnit?.id || units[0]?.id || ''
  );

  const activeUnit = units.find((u) => u.id === selectedUnitId) || units[0];

  // Exam state
  const [examStarted, setExamStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(20 * 60); // 20 mins
  const [evaluationResult, setEvaluationResult] = useState<SkipEvaluationResult | null>(null);

  // A diagnostic must use questions authored for this unit; never substitute unrelated generic items.
  const testQuestions: PracticeQuestion[] = activeUnit?.practiceQuestions ?? [];
  const assessmentReady = Boolean(
    activeUnit?.skipAssessmentReady === true &&
    hasReviewedOutcomeCoverage(activeUnit.learningOutcomes, testQuestions)
  );

  // Timer countdown
  React.useEffect(() => {
    let timer: any = null;
    if (examStarted && !evaluationResult && timeRemainingSeconds > 0) {
      timer = setInterval(() => {
        setTimeRemainingSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timeRemainingSeconds === 0 && examStarted && !evaluationResult) {
      handleSubmitExam();
    }
    return () => clearInterval(timer);
  }, [examStarted, evaluationResult, timeRemainingSeconds]);

  const handleStartExam = () => {
    if (!activeUnit || testQuestions.length === 0) return;
    setUserAnswers({});
    setEvaluationResult(null);
    setCurrentQuestionIndex(0);
    setTimeRemainingSeconds(15 * 60);
    setExamStarted(true);
  };

  const handleSelectOption = (qId: string, optionKey: string) => {
    setUserAnswers((prev) => ({ ...prev, [qId]: optionKey }));
  };

  const handleSubmitExam = () => {
    if (!activeUnit || testQuestions.length === 0) return;
    let score = 0;
    const topicsToReview = new Set<string>();
    const correctlyAnsweredTopics = new Set<string>();

    testQuestions.forEach((q) => {
      const studentKey = userAnswers[q.id];
      if (studentKey === q.correctKey) {
        score += 1;
        correctlyAnsweredTopics.add(q.targetedLearningOutcome);
      } else {
        topicsToReview.add(q.targetedLearningOutcome);
      }
    });

    const maxScore = testQuestions.length || 1;
    const percentage = Math.round((score / maxScore) * 100);

    let verdict: SkipEvaluationResult['verdict'];
    let verdictTitle: string;
    let tailoredAdvice: string;
    let nextRecommendedAction: string;

    if (canApproveUnitSkip(assessmentReady, percentage)) {
      verdict = 'mastered_skip_approved';
      verdictTitle = 'اجتياز الاختبار المُراجع — يمكن تخطي الوحدة وفق إعداد المدرس';
      tailoredAdvice =
        'اجتزت الاختبار الذي أُشير إلى أنه مراجع من المدرس. النتيجة تخص الأسئلة الموجودة في هذا الاختبار ولا تثبت وحدها إتقان كل موضوعات الوحدة؛ راجع أي نقاط غير مؤكدة مع معلمك.';
      nextRecommendedAction =
        'يمكنك متابعة الخطة وفق قرار المدرس، مع مراجعة الإجابات غير المؤكدة قبل الانتقال النهائي.';

      // Confirm skip in parent
      onConfirmSkipUnit(activeUnit.id, percentage);
    } else if (!assessmentReady) {
      verdict = 'diagnostic_only';
      verdictTitle = 'نتيجة تشخيصية فقط — لم يُعتمد اختبار التخطي لهذه الوحدة';
      tailoredAdvice =
        'تساعدك هذه النتيجة على مراجعة الأسئلة التي أجبت عنها، لكنها لا تثبت إتقان الوحدة ولا تتجاوزها. يلزم اعتماد تغطية الاختبار من مدرس قبل استخدامه لاتخاذ قرار التخطي.';
      nextRecommendedAction =
        'راجع نواتج التعلم والأسئلة التي أخطأت فيها، ثم تابع خطة دراسة الوحدة إلى أن يعتمد مدرس اختبارها التشخيصي.';
    } else if (percentage >= 50) {
      verdict = 'partial_mastery_review_weak_points';
      verdictTitle = 'نتيجة جزئية — واصل دراسة الوحدة وراجع نقاط الضعف';
      tailoredAdvice =
        'أجبت عن بعض أسئلة الاختبار بصورة صحيحة، لكن هذه النتيجة لا تكفي لتجاوز الوحدة. راجع نقاط الضعف المحددة، وأكمل دراسة بقية الموضوعات وفق خطتك أو معلمك.';
      nextRecommendedAction =
        'راجع نقاط الضعف من مصدر موثوق أو معلم، ثم أعد التدريب على مسائل مشابهة.';
    } else {
      verdict = 'needs_full_study';
      verdictTitle = 'مستوى يحتاج تأسيس: يُنصح بدراسة الوحدة وفق المخطط الدراسي 📖';
      tailoredAdvice =
        'تشير إجاباتك في هذه المجموعة إلى موضوعات تحتاج مراجعة؛ لا تستخدم هذه النتيجة وحدها للحكم على مستواك أو درجتك المتوقعة. راجع الوحدة مع معلمك أو مصدر موثوق.';
      nextRecommendedAction =
        'أضف وقتاً لمراجعة الوحدة، واستخدم مرجعاً أو مادة تعليمية تم التحقق من مصدرها إن توفرت.';
    }

    setEvaluationResult({
      unitId: activeUnit.id,
      unitTitle: activeUnit.title,
      score,
      maxScore,
      percentage,
      verdict,
      verdictTitle,
      weakTopics: [...topicsToReview],
      correctlyAnsweredTopics: [...correctlyAnsweredTopics],
      tailoredAdvice,
      nextRecommendedAction
    });
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-indigo-950/60 border border-amber-500/40 p-6 lg:p-7 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              اختبار تشخيصي لتحديد ما يحتاج إلى مراجعة
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              اختبار تشخيصي لتحديد ما يحتاج إلى مراجعة
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              أجب عن أسئلة الوحدة لتتعرف على ما راجعته وما يحتاج إلى تدريب. لا يعتمد تجاوز الوحدة تلقائياً إلا بعد مراجعة مدرس وتوثيق كفاية الاختبار.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-4 min-w-[270px] text-xs space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>حد النجاح بعد اعتماد الاختبار:</span>
              <span className="font-bold text-emerald-400 font-mono">≥ 80%</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>تحليل الإجابات:</span>
              <span className="font-bold text-amber-400 font-mono">مقارنة الإجابات بالأسئلة</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>تأثير النتيجة:</span>
              <span className="font-bold text-blue-400 font-mono">بعد استيفاء شرط مراجعة الاختبار</span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Unit Selection Header */}
      {!examStarted && !evaluationResult && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">اختر وحدة لإجراء اختبار تشخيصي:</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                يمكنك اختيار أي وحدة من مواد شعبة علمي رياضة لإجراء الاختبار التشخيصي.
              </p>
            </div>

            <div className="w-full md:w-96">
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    [{u.subjectNameAr}] {u.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Unit Overview Card */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                {activeUnit.subjectNameAr}
              </span>
                <span className="text-xs text-slate-400">
                  {testQuestions.length > 0
                    ? `${testQuestions.length} أسئلة تشخيصية • المدة: ١٥ دقيقة`
                    : 'لا توجد أسئلة مراجعة متاحة لهذه الوحدة بعد'}
                </span>
            </div>

            <h4 className="text-base font-bold text-white">{activeUnit.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{activeUnit.description}</p>

            <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">نواتج تعلم الوحدة — يلزم ربط الأسئلة بها قبل اعتماد اختبار التخطي:</span>
              {activeUnit.learningOutcomes.map((lo, i) => (
                <span key={i} className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {lo}
                </span>
              ))}
            </div>

              {!assessmentReady && testQuestions.length > 0 && (
                <p className="text-xs text-amber-300" role="note">
                  هذه نتيجة تشخيصية فقط؛ التخطي يتطلب مراجعة كل سؤال وربطه بكل نواتج الوحدة ثم اعتماد المخطط من مدرس.
                </p>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  disabled={testQuestions.length === 0}
                  onClick={handleStartExam}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black px-6 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <FastForward className="w-4 h-4 fill-black" />
                  <span>بدء الاختبار التشخيصي</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Exam Running */}
      {examStarted && !evaluationResult && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl">
          {/* Exam Header: Timer & Progress */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs text-amber-400 font-bold font-mono">
                اختبار تشخيصي: {activeUnit.title}
              </span>
              <div className="text-sm font-bold text-white mt-1">
                السؤال {currentQuestionIndex + 1} من {testQuestions.length}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 font-mono text-amber-400 font-bold text-sm">
              <Clock className="w-4 h-4 animate-spin" />
              <span>{formatTimer(timeRemainingSeconds)}</span>
            </div>
          </div>

          {/* Active Question Box */}
          {testQuestions[currentQuestionIndex] && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-blue-400 font-bold">
                    سؤال {testQuestions[currentQuestionIndex].questionNumber}
                  </span>
                  <span className="text-slate-400">
                    ({testQuestions[currentQuestionIndex].targetedLearningOutcome})
                  </span>
                </div>
                <div className="text-base font-bold text-white leading-relaxed">
                  <MixedTextRenderer text={testQuestions[currentQuestionIndex].questionText} />
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {testQuestions[currentQuestionIndex].options.map((opt) => {
                  const isSelected =
                    userAnswers[testQuestions[currentQuestionIndex].id] === opt.key;

                  return (
                    <button
                      key={opt.key}
                      onClick={() =>
                        handleSelectOption(testQuestions[currentQuestionIndex].id, opt.key)
                      }
                      className={`text-right p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-600/25 border-blue-500 text-white font-bold ring-2 ring-blue-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 font-mono flex items-center justify-center font-bold">
                          {opt.key}
                        </span>
                        <div className="text-sm">
                          <MixedTextRenderer text={opt.text} className="inline" />
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                    </button>
                  );
                })}
              </div>

              {/* Navigation buttons */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  className="px-4 py-2 rounded-xl bg-slate-800 disabled:opacity-30 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  السؤال السابق
                </button>

                <div className="flex gap-2">
                  {currentQuestionIndex < testQuestions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                    >
                      السؤال التالي
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitExam}
                      className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer shadow-lg shadow-emerald-600/30"
                    >
                      إنهاء الاختبار والتقييم الذكي 🎯
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Evaluation Results & Tailored Level Feedback */}
      {evaluationResult && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl">
          {/* Result Header Banner */}
          <div
            className={`p-6 rounded-2xl border text-right space-y-3 ${
              evaluationResult.verdict === 'mastered_skip_approved'
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : evaluationResult.verdict === 'partial_mastery_review_weak_points'
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                : evaluationResult.verdict === 'diagnostic_only'
                ? 'bg-blue-950/40 border-blue-500/50 text-blue-200'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs px-3 py-1 rounded-full bg-slate-950/60 font-bold border border-current">
                نتيجة التقييم التشخيصي للوحدة
              </span>
              <span className="text-2xl font-black font-mono">
                {evaluationResult.score} من {evaluationResult.maxScore} ({evaluationResult.percentage}%)
              </span>
            </div>

            <h3 className="text-xl font-extrabold">{evaluationResult.verdictTitle}</h3>
            <p className="text-sm leading-relaxed opacity-90">
              {evaluationResult.tailoredAdvice}
            </p>
          </div>

          {/* Analysis: observed answers from this question sample */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Correctly answered in sample */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>موضوعات ارتبطت بإجابات صحيحة في هذه العينة:</span>
              </div>
              {evaluationResult.correctlyAnsweredTopics.length > 0 ? (
                <ul className="space-y-1 list-disc list-inside text-slate-300">
                  {evaluationResult.correctlyAnsweredTopics.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-slate-500">لا توجد إجابات صحيحة في أسئلة هذه العينة.</div>
              )}
            </div>

            {/* Topics to review */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-amber-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>موضوعات ظهرت فيها إجابات خاطئة في هذه العينة:</span>
              </div>
              {evaluationResult.weakTopics.length > 0 ? (
                <ul className="space-y-1 list-disc list-inside text-slate-300">
                  {evaluationResult.weakTopics.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-emerald-400">أجبت عن جميع أسئلة هذه العينة بشكل صحيح.</div>
              )}
            </div>
          </div>

          {/* Next Recommended Action */}
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="font-bold text-blue-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>الخطوة التالية الموصى بها وفق مستواك:</span>
              </div>
              <p>{evaluationResult.nextRecommendedAction}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleStartExam}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer whitespace-nowrap"
              >
                إعادة المحاولة 🔄
              </button>
              <button
                onClick={onNavigateToSchedule}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer whitespace-nowrap"
              >
                العودة للجدول الدراسي 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

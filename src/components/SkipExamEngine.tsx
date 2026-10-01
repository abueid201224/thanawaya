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

  // Generate 4-5 test questions for the placement test
  const testQuestions: PracticeQuestion[] = activeUnit?.practiceQuestions?.length
    ? activeUnit.practiceQuestions
    : [
        {
          id: 'sq_1',
          questionNumber: 1,
          questionText: 'إذا كانت ص = ظا(٢س)، فإن د²ص / دس² تساوي:',
          options: [
            { key: 'A', text: '٨ قا²(٢س) ظا(٢س)' },
            { key: 'B', text: '٤ قا²(٢س) ظا(٢س)' },
            { key: 'C', text: '٨ قا⁴(٢س)' },
            { key: 'D', text: '٢ قا²(٢س)' }
          ],
          correctKey: 'A',
          explanation: 'دص/دس = ٢ قا²(٢س). بالاشتقاق مرة أخرى: د²ص/دس² = ٢ × ٢ قا(٢س) × [قا(٢س) ظا(٢س) × ٢] = ٨ قا²(٢س) ظا(٢س).',
          difficulty: 'B',
          targetedLearningOutcome: 'إيجاد المشتقات العليا للدوال المثلثية'
        },
        {
          id: 'sq_2',
          questionNumber: 2,
          questionText: 'قضيب منتظم يرتكز على أرض خشنة (م_س = ٠٫٥)، إذا كان القضيب على وشك الانزلاق عندما كانت زاوية ميله هـ، فإن ظا(هـ) تساوي:',
          options: [
            { key: 'A', text: '١' },
            { key: 'B', text: '٢' },
            { key: 'C', text: '٠٫٥' },
            { key: 'D', text: '٠٫٢٥' }
          ],
          correctKey: 'A',
          explanation: 'في حالة السلم المرتكز على أرض خشنة وحائط أملس على وشك الانزلاق: ظا(هـ) = ١ / (٢ م_س) = ١ / (٢ × ٠٫٥) = ١.',
          difficulty: 'A',
          targetedLearningOutcome: 'شروط انزلاق السلالم المنتظمة'
        }
      ];

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
    let score = 0;
    const weakPoints: string[] = [];
    const masteredPoints: string[] = [];

    testQuestions.forEach((q) => {
      const studentKey = userAnswers[q.id];
      if (studentKey === q.correctKey) {
        score += 1;
        masteredPoints.push(q.targetedLearningOutcome);
      } else {
        weakPoints.push(q.targetedLearningOutcome);
      }
    });

    const maxScore = testQuestions.length || 1;
    const percentage = Math.round((score / maxScore) * 100);

    let verdict: 'mastered_skip_approved' | 'partial_mastery_review_weak_points' | 'needs_full_study';
    let verdictTitle: string;
    let tailoredAdvice: string;
    let nextRecommendedAction: string;

    if (percentage >= 80) {
      verdict = 'mastered_skip_approved';
      verdictTitle = 'مستوى متميز: تم إثبات الإتقان وتخطي دراسة الوحدة بنجاح! 🏆';
      tailoredAdvice =
        'مبارك يا بطل! إجاباتك تبرهن على فهم متين وعميق لنواتج التعلم الوزارية. تم تخطي هذه الوحدة من جدولك الدراسي اليومي وإضافتها لسجل إنجازاتك كـ "متقنة مسبقاً"، ويمكنك استثمار هذا الوقت في المواد الأكثر احتياجاً.';
      nextRecommendedAction =
        'التوجه للوحدة التالية مباشرة أو حل نماذج الامتحانات الشاملة للمحافظة على هذا المستوى المتقدم.';

      // Confirm skip in parent
      onConfirmSkipUnit(activeUnit.id, percentage);
    } else if (percentage >= 50) {
      verdict = 'partial_mastery_review_weak_points';
      verdictTitle = 'مستوى متوسط: إتقان جزئي جيد (لا داعي لدراسة الوحدة كاملة) ⚡';
      tailoredAdvice =
        'لديك أساسيات جيدة جداً في أغلب نواتج التعلم، ولكن ظهرت بعض الثغرات الدقيقة في الأفكار المركبة. لتوفير وقتك: لن تحتاج لدراسة الوحدة بالكامل من البداية، بل خصص 30 دقيقة فقط لمراجعة نقاط الضعف المحددة بالأسفل.';
      nextRecommendedAction =
        'مراجعة كبسولة القوانين الخاصة بنقاط الضعف، ثم إعادة حل المسائل المشابهة لها.';
    } else {
      verdict = 'needs_full_study';
      verdictTitle = 'مستوى يحتاج تأسيس: يُنصح بدراسة الوحدة وفق المخطط الدراسي 📖';
      tailoredAdvice =
        'اختبار التخطي كشف عن فجوات مفاهيمية في القواعد الأساسية لهذه الوحدة. تخطي هذه الوحدة الآن يشكل خطورة على درجاتك في امتحان نهاية العام. ننصحك بالبدء في دراستها خطوة بخطوة مع المعلم الذكي.';
      nextRecommendedAction =
        'جدولة هذه الوحدة في خطتك اليومية ومشاهدة فيديو الشرح المعتمد من المكتبة.';
    }

    setEvaluationResult({
      unitId: activeUnit.id,
      unitTitle: activeUnit.title,
      score,
      maxScore,
      percentage,
      verdict,
      verdictTitle,
      weakTopics: weakPoints,
      masteredTopics: masteredPoints,
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
              محرك التخطي الذكي والإتقان المسبق (Fast-Track Diagnostic Engine)
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              تخطي ما درسته مسبقاً باختبار إتقان تقييمي
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              إذا كنت قد ذاكرت أي وحدة أو درس سابقاً في دروسك الخاصة أو المدرسة، لا تضيع وقتك! خض هذا الاختبار التقييمي القصير؛ وإذا حققت ٨٠٪ فأكثر، سيتم تخطي الوحدة رسمياً واعتمادها كمنجزة، مع تقديم نصائح ذكية مفصلة حسب مستواك.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-4 min-w-[270px] text-xs space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>شرط الاعتماد والتخطي:</span>
              <span className="font-bold text-emerald-400 font-mono">≥ 80%</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>التشخيص الذكي:</span>
              <span className="font-bold text-amber-400 font-mono">تحليل نقاط الضعف والقوة</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>التأثير على الخطة:</span>
              <span className="font-bold text-blue-400 font-mono">تحديث آلي لنسبة الإنجاز</span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Unit Selection Header */}
      {!examStarted && !evaluationResult && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">اختر الوحدة التي تريد إثبات إتقانها وتخطيها:</h3>
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
                {testQuestions.length} أسئلة قياس نواتج تعلم • المدة: ١٥ دقيقة
              </span>
            </div>

            <h4 className="text-base font-bold text-white">{activeUnit.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{activeUnit.description}</p>

            <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">نواتج التعلم التي سيتم اختبارك فيها:</span>
              {activeUnit.learningOutcomes.map((lo, i) => (
                <span key={i} className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {lo}
                </span>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleStartExam}
                className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <FastForward className="w-4 h-4 fill-black" />
                <span>بدء اختبار التخطي والإتقان الآن ⚡</span>
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
                اختبار تخطي: {activeUnit.title}
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

          {/* Analysis: Mastered vs Weak Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Mastered */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>نقاط القوة ونواتج التعلم المتقنة:</span>
              </div>
              {evaluationResult.masteredTopics.length > 0 ? (
                <ul className="space-y-1 list-disc list-inside text-slate-300">
                  {evaluationResult.masteredTopics.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-slate-500">لم يتم إتقان أي ناتج تعلم بنجاح كافٍ.</div>
              )}
            </div>

            {/* Weak points */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-amber-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>نقاط الضعف التي تحتاج لتركيز خاص:</span>
              </div>
              {evaluationResult.weakTopics.length > 0 ? (
                <ul className="space-y-1 list-disc list-inside text-slate-300">
                  {evaluationResult.weakTopics.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-emerald-400">لا توجد أي نقاط ضعف! إتقان مثالي ١٠٠٪.</div>
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

import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight
} from 'lucide-react';
import { MonthlyExam, PracticeQuestion } from '../types';
import { MixedTextRenderer } from './MathRenderer';
import { getReviewedQuestionsForStudent } from '../services/contentGate';
import { studyPersistenceService } from '../services/studyPersistenceService';

interface MonthlyExamsViewProps {
  exams: MonthlyExam[];
  onCompleteExam: (examId: string, score: number) => void;
}

export const MonthlyExamsView: React.FC<MonthlyExamsViewProps> = ({
  exams,
  onCompleteExam
}) => {
  const [activeExam, setActiveExam] = useState<MonthlyExam | null>(null);
  const [activeReviewedQuestions, setActiveReviewedQuestions] = useState<PracticeQuestion[]>([]);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [scoreResult, setScoreResult] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [timerLiveMsg, setTimerLiveMsg] = useState<string>('');
  const [persistNotice, setPersistNotice] = useState<string>('');

  const handleStartExam = (exam: MonthlyExam) => {
    const reviewedQs = getReviewedQuestionsForStudent(exam.questions);
    if (reviewedQs.length === 0) return;
    setActiveExam(exam);
    setActiveReviewedQuestions(reviewedQs);
    setAnswers({});
    setExamSubmitted(false);
    setConfirmDialogOpen(false);
    setScoreResult(null);
    setPersistNotice('');
    setSecondsRemaining(exam.durationMinutes * 60);
    setTimerLiveMsg('');
  };

  const handleSelectAnswer = (qId: string, optKey: string) => {
    if (examSubmitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: optKey }));
  };

  const finalizeSubmit = () => {
    if (!activeExam) return;

    let total = 0;
    let allSaved = true;
    activeReviewedQuestions.forEach((q) => {
      const chosen = answers[q.id] || '';
      if (chosen === q.correctKey) {
        total += 1;
      }
      const res = studyPersistenceService.recordAttempt({
        question: q,
        unitId: activeExam.id,
        subjectCode: activeExam.subjectCode,
        mode: 'test',
        selectedKey: chosen
      });
      if (!res.ok) allSaved = false;
    });

    const scoreAwarded = Math.round(
      (total / (activeReviewedQuestions.length || 1)) * activeExam.totalMarks
    );
    setScoreResult(scoreAwarded);
    setExamSubmitted(true);
    setConfirmDialogOpen(false);
    setPersistNotice(allSaved ? 'تم الحفظ' : 'تعذر التحقق من حفظ بعض المحاولات محلياً');
    onCompleteExam(activeExam.id, scoreAwarded);
  };

  useEffect(() => {
    if (!activeExam || examSubmitted) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finalizeSubmit();
          return 0;
        }
        const next = prev - 1;
        if (next === 10 * 60) {
          setTimerLiveMsg('تبقى 10 دقائق على انتهاء الاختبار.');
        } else if (next === 5 * 60) {
          setTimerLiveMsg('تبقى 5 دقائق على انتهاء الاختبار.');
        } else if (next === 60) {
          setTimerLiveMsg('تبقى دقيقة واحدة على انتهاء الاختبار.');
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeExam, examSubmitted]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60).toString().padStart(2, '0');
    const rem = (secs % 60).toString().padStart(2, '0');
    return `${mins}:${rem}`;
  };

  const unansweredCount = activeReviewedQuestions.filter((q) => !answers[q.id]).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-blue-950/60 border border-purple-800/40 p-6 lg:p-7 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-semibold text-purple-300 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-purple-400" />
              <span>الاختبارات التقييمية الشهرية</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              اختبارات تقييمية وفق نواتج التعلم المراجَعة
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              في وضع الاختبار لا تظهر أي تلميحات أو تصحيح فوري أثناء الحل؛ تُعرض النتيجة والحلول بعد تسليم الورقة فقط.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-4 min-w-[260px] text-xs space-y-2 tabular-nums">
            <div className="flex justify-between text-slate-300">
              <span>الاختبارات المتاحة:</span>
              <span className="font-bold text-white font-mono">{exams.length}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>المعتمدة بأسئلة مراجَعة:</span>
              <span className="font-bold text-emerald-400 font-mono">
                {exams.filter((e) => getReviewedQuestionsForStudent(e.questions).length > 0).length}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>الاختبارات المكتملة:</span>
              <span className="font-bold text-blue-400 font-mono">
                {exams.filter((e) => e.isCompleted).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div aria-live="polite" className="sr-only">
        {timerLiveMsg}
      </div>

      {/* List of Monthly Exams or Active Exam */}
      {!activeExam ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((exam) => {
            const reviewedCount = getReviewedQuestionsForStudent(exam.questions).length;
            const isAvailable = reviewedCount > 0;

            return (
              <div
                key={exam.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-300 font-bold">{exam.monthName}</span>
                    <span className="text-slate-400 font-mono tabular-nums">
                      {exam.durationMinutes} دقيقة
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white leading-snug">{exam.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isAvailable
                      ? `يحتوي على ${reviewedCount} أسئلة مراجَعة ومعتمدة.`
                      : 'هذا الاختبار قيد المراجعة الفنية حالياً ولا يظهر للطلاب قبل اعتماده.'}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-xs tabular-nums">
                    <span className="text-slate-400">الدرجة الكلية:</span>
                    <span className="font-bold text-amber-400 font-mono">{exam.totalMarks} درجة</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  {exam.isCompleted ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold tabular-nums">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تم التسليم ({exam.scoreAwarded ?? 0}/{exam.totalMarks})</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">
                      {isAvailable ? 'جاهز للتأدية' : 'قيد المراجعة'}
                    </span>
                  )}

                  <button
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => handleStartExam(exam)}
                    className="min-h-[40px] bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{exam.isCompleted ? 'إعادة الاختبار' : 'بدء الامتحان'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Active Monthly Exam Interface */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <button
                type="button"
                onClick={() => setActiveExam(null)}
                className="min-h-[40px] text-xs text-blue-400 hover:underline flex items-center gap-1 mb-1 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة لقائمة الامتحانات الشهرية</span>
              </button>
              <h3 className="text-lg font-bold text-white">{activeExam.title}</h3>
            </div>

            <div className="flex items-center gap-3 font-mono tabular-nums">
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-amber-300 text-sm font-bold">
                <Clock className="w-4 h-4" />
                <span>{formatTimer(secondsRemaining)}</span>
              </div>
              <div className="text-sm font-bold text-slate-300">{activeExam.totalMarks} درجة</div>
            </div>
          </div>

          {/* Exam Questions (Zero feedback until submission) */}
          <div className="space-y-6">
            {activeReviewedQuestions.map((q, idx) => {
              const selectedOpt = answers[q.id];

              return (
                <div key={q.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold text-blue-400">سؤال {idx + 1}</span>
                    <span>{q.targetedLearningOutcome}</span>
                  </div>

                  <div className="text-sm font-semibold text-white leading-relaxed">
                    <MixedTextRenderer text={q.questionText} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {q.options.map((opt) => {
                      const isChosen = selectedOpt === opt.key;
                      const isCorrect = q.correctKey === opt.key;

                      let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300';
                      if (examSubmitted) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-950/50 border-emerald-500 text-emerald-200 font-bold';
                        } else if (isChosen && !isCorrect) {
                          btnStyle = 'bg-rose-950/50 border-rose-500 text-rose-200';
                        }
                      } else if (isChosen) {
                        btnStyle = 'bg-blue-600/30 border-blue-500 text-white font-bold';
                      }

                      return (
                        <button
                          key={opt.key}
                          type="button"
                          disabled={examSubmitted}
                          onClick={() => handleSelectAnswer(q.id, opt.key)}
                          className={`min-h-[44px] text-right p-3 rounded-xl border transition-all text-xs flex items-center justify-between cursor-pointer ${btnStyle}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">({opt.key})</span>
                            <MixedTextRenderer text={opt.text} className="inline" />
                          </div>
                          {examSubmitted && isCorrect && (
                            <span className="inline-flex items-center gap-1 text-emerald-400 shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>صحيح</span>
                            </span>
                          )}
                          {examSubmitted && isChosen && !isCorrect && (
                            <span className="inline-flex items-center gap-1 text-rose-400 shrink-0">
                              <AlertCircle className="w-4 h-4" />
                              <span>خطأ</span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {examSubmitted && (
                    <div className="p-3 bg-blue-950/20 border border-blue-800/30 rounded-xl text-xs text-blue-200 space-y-1">
                      <div className="font-bold text-blue-300">خطوات الحل:</div>
                      <MixedTextRenderer text={q.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Exam Controls & Unanswered Confirmation Dialog */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            {!examSubmitted && confirmDialogOpen && (
              <div
                role="dialog"
                aria-label="تأكيد تسليم الامتحان"
                className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 text-xs text-amber-100 space-y-3"
              >
                <div className="font-bold text-sm text-amber-300">تأكيد تسليم ورقة الامتحان</div>
                <p className="tabular-nums">
                  {unansweredCount > 0
                    ? `يوجد لديك ${unansweredCount} سؤال غير مجاب من أصل ${activeReviewedQuestions.length}. هل أنت متأكد من التسليم الآن؟`
                    : `أجبت عن جميع الأسئلة (${activeReviewedQuestions.length}). هل تريد تسليم الامتحان الآن؟`}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={finalizeSubmit}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                  >
                    تأكيد التسليم النهائي
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDialogOpen(false)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
                  >
                    الرجوع للمراجعة
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              {examSubmitted && scoreResult !== null ? (
                <div className="flex items-center gap-3 text-sm font-bold text-emerald-400 tabular-nums">
                  <span>
                    نتيجتك: {scoreResult} من {activeExam.totalMarks} درجة (
                    {Math.round((scoreResult / activeExam.totalMarks) * 100)}%)
                  </span>
                  {persistNotice && (
                    <span className="text-xs text-slate-300">• {persistNotice}</span>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400 tabular-nums">
                  الأسئلة المجابة: {activeReviewedQuestions.length - unansweredCount} من{' '}
                  {activeReviewedQuestions.length}
                </div>
              )}

              {!examSubmitted ? (
                <button
                  type="button"
                  onClick={() => setConfirmDialogOpen(true)}
                  className="min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer whitespace-nowrap"
                >
                  تسليم ورقة الامتحان
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveExam(null)}
                  className="min-h-[44px] bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  العودة لقائمة الامتحانات
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

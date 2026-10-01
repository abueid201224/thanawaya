import React, { useState } from 'react';
import {
  FileCheck2,
  Clock,
  Award,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Play,
  Check,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Printer
} from 'lucide-react';
import { MonthlyExam, PracticeQuestion } from '../types';
import { MixedTextRenderer } from './MathRenderer';

interface MonthlyExamsViewProps {
  exams: MonthlyExam[];
  onCompleteExam: (examId: string, score: number) => void;
}

export const MonthlyExamsView: React.FC<MonthlyExamsViewProps> = ({
  exams,
  onCompleteExam
}) => {
  const [activeExam, setActiveExam] = useState<MonthlyExam | null>(null);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [scoreResult, setScoreResult] = useState<number | null>(null);

  const handleStartExam = (exam: MonthlyExam) => {
    setActiveExam(exam);
    setAnswers({});
    setExamSubmitted(false);
    setScoreResult(null);
  };

  const handleSelectAnswer = (qId: string, optKey: string) => {
    if (examSubmitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: optKey }));
  };

  const handleSubmit = () => {
    if (!activeExam) return;

    let total = 0;
    activeExam.questions.forEach((q) => {
      if (answers[q.id] === q.correctKey) {
        total += 1;
      }
    });

    const scoreAwarded = Math.round((total / (activeExam.questions.length || 1)) * activeExam.totalMarks);
    setScoreResult(scoreAwarded);
    setExamSubmitted(true);
    onCompleteExam(activeExam.id, scoreAwarded);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-blue-950/60 border border-purple-800/40 p-6 lg:p-7 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30">
              <FileCheck2 className="w-3.5 h-3.5 text-purple-400" />
              الامتحانات الشهرية والمحاكاة الشاملة لنصف ونهاية العام
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              اختبارات تقييمية شهرية وفق مواصفات الورقة الامتحانية الوزارية
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              تقييمات دورية شاملة تغطي مقررات كل شهر من أكتوبر ٢٠٢٦ حتى يوليو ٢٠٢٧. تدرب على التوقيت الزمني الحقيقي وإدارة ورقة البابل شيت لضمان أعلى الدرجات.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-4 min-w-[260px] text-xs space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>الامتحانات المتاحة:</span>
              <span className="font-bold text-white font-mono">{exams.length} امتحانات</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>الامتحانات المكتملة:</span>
              <span className="font-bold text-emerald-400 font-mono">
                {exams.filter((e) => e.isCompleted).length} منجزة
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>النماذج:</span>
              <span className="font-bold text-purple-400 font-mono">بابل شيت + مقالي</span>
            </div>
          </div>
        </div>
      </div>

      {/* List of Monthly Exams or Active Exam */}
      {!activeExam ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
                    {exam.monthName}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{exam.durationMinutes} دقيقة</span>
                </div>

                <h4 className="text-base font-bold text-white leading-snug">{exam.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  يحتوي على {exam.questions.length} أسئلة استرشادية تقيس نواتج التعلم لنهاية الشهر.
                </p>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-400">الدرجة الكلية:</span>
                  <span className="font-bold text-amber-400 font-mono">{exam.totalMarks} درجة</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                {exam.isCompleted ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تم الاجتياز ({exam.scoreAwarded || exam.totalMarks}/{exam.totalMarks})</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">لم يؤدَ بعد</span>
                )}

                <button
                  onClick={() => handleStartExam(exam)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-blue-600/20"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{exam.isCompleted ? 'إعادة الاختبار' : 'بدء الامتحان'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Active Monthly Exam Interface */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <button
                onClick={() => setActiveExam(null)}
                className="text-xs text-blue-400 hover:underline flex items-center gap-1 mb-1 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة لقائمة الامتحانات الشهرية</span>
              </button>
              <h3 className="text-lg font-bold text-white">{activeExam.title}</h3>
            </div>

            <div className="text-left font-mono">
              <div className="text-xs text-slate-400">الزمن المحدد: {activeExam.durationMinutes} دقيقة</div>
              <div className="text-sm font-bold text-amber-400">{activeExam.totalMarks} درجة</div>
            </div>
          </div>

          {/* Exam Questions */}
          <div className="space-y-6">
            {activeExam.questions.map((q, idx) => {
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt) => {
                      const isChosen = selectedOpt === opt.key;
                      const isCorrect = q.correctKey === opt.key;

                      let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300';
                      if (examSubmitted) {
                        if (isCorrect) btnStyle = 'bg-emerald-950/50 border-emerald-500 text-emerald-200 font-bold';
                        else if (isChosen && !isCorrect) btnStyle = 'bg-rose-950/50 border-rose-500 text-rose-200';
                      } else if (isChosen) {
                        btnStyle = 'bg-blue-600/30 border-blue-500 text-white font-bold';
                      }

                      return (
                        <button
                          key={opt.key}
                          disabled={examSubmitted}
                          onClick={() => handleSelectAnswer(q.id, opt.key)}
                          className={`text-right p-3 rounded-xl border transition-all text-xs flex items-center justify-between ${btnStyle}`}
                        >
                          <div>
                            <span className="font-mono font-bold ml-2">({opt.key})</span>
                            <MixedTextRenderer text={opt.text} className="inline" />
                          </div>
                          {examSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>

                  {examSubmitted && (
                    <div className="p-3 bg-blue-950/20 border border-blue-800/30 rounded-xl text-xs text-blue-200 space-y-1">
                      <div className="font-bold text-blue-300">نموذج الحل والتعليل:</div>
                      <MixedTextRenderer text={q.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Exam Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {examSubmitted && scoreResult !== null ? (
              <div className="text-sm font-bold text-emerald-400">
                درجتك في الامتحان: {scoreResult} من {activeExam.totalMarks} درجة (
                {Math.round((scoreResult / activeExam.totalMarks) * 100)}%)
              </div>
            ) : (
              <div className="text-xs text-slate-400">تأكد من إجابة كافة الأسئلة قبل التسليم.</div>
            )}

            {!examSubmitted ? (
              <button
                onClick={handleSubmit}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer shadow-lg shadow-emerald-600/30"
              >
                تسليم ورقة الامتحان والتصحيح الآلي 📝
              </button>
            ) : (
              <button
                onClick={() => setActiveExam(null)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                العودة للجدول الدراسي
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

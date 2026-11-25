import React, { useMemo, useState } from 'react';
import {
  Award,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { SubjectProgress, DisciplineMetrics } from '../types';
import { studyPersistenceService } from '../services/studyPersistenceService';

interface ProgressDisciplineViewProps {
  progressList: SubjectProgress[];
  metrics: DisciplineMetrics;
  onUpdateSubjectProgress: (subjectCode: string, chaptersCompleted: number, score: number) => void;
}

export const ProgressDisciplineView: React.FC<ProgressDisciplineViewProps> = ({
  progressList,
  onUpdateSubjectProgress
}) => {
  const [selectedSubjectToUpdate, setSelectedSubjectToUpdate] = useState<SubjectProgress | null>(null);
  const [newChaptersCount, setNewChaptersCount] = useState<number>(0);
  const [newQuizScore, setNewQuizScore] = useState<number>(0);

  const attempts = useMemo(() => studyPersistenceService.getAttempts(), []);
  const mistakes = useMemo(() => studyPersistenceService.getMistakes(), []);

  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.isCorrect).length;
  const resolvedMistakes = mistakes.filter((m) => m.resolved).length;
  const pendingMistakes = mistakes.filter((m) => !m.resolved).length;

  const handleOpenUpdate = (subject: SubjectProgress) => {
    setSelectedSubjectToUpdate(subject);
    setNewChaptersCount(subject.completedChapters);
    setNewQuizScore(subject.averageScore);
  };

  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectToUpdate) return;

    onUpdateSubjectProgress(
      selectedSubjectToUpdate.subjectCode,
      newChaptersCount,
      newQuizScore
    );
    setSelectedSubjectToUpdate(null);
  };

  return (
    <div className="space-y-6">
      {/* Honest Real-Progress Summary Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="text-xs font-bold text-emerald-800 flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>سجل التقدم الفعلي</span>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-slate-900">
              متابعة المحاولات المسجلة والوحدات المكتملة بهدوء
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              يعرض هذا السجل عدد محاولاتك الحقيقية في التدريب والاختبارات ومراجعات دفتر الأخطاء دون أي عدادات يومية متتالية أو درجات افتراضية.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 tabular-nums text-center">
            <div className="p-2 rounded-lg bg-white border border-slate-200">
              <div className="text-[11px] text-slate-600">إجمالي المحاولات</div>
              <div className="text-xl font-bold text-slate-900 font-mono">{totalAttempts}</div>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200">
              <div className="text-[11px] text-slate-600">محاولات صحيحة</div>
              <div className="text-xl font-bold text-emerald-700 font-mono">{correctAttempts}</div>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200">
              <div className="text-[11px] text-slate-600">أخطاء تمت مراجعتها</div>
              <div className="text-xl font-bold text-blue-700 font-mono">
                {resolvedMistakes}/{resolvedMistakes + pendingMistakes}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subject by Subject Progress Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-700" />
            <h3 className="text-lg font-bold text-slate-900">تقدم المواد المسجل</h3>
          </div>
          <span className="text-xs text-slate-600">
            حدّث عدد الفصول المنجزة لكل مادة حسب دراستك الفعلية
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {progressList.map((subject) => {
            const chapterPercent = Math.round(
              (subject.completedChapters / (subject.totalChapters || 1)) * 100
            );
            const subjectAttempts = attempts.filter(
              (a) => a.subjectCode === subject.subjectCode
            );
            const subjectCorrect = subjectAttempts.filter((a) => a.isCorrect).length;

            return (
              <div
                key={subject.subjectCode}
                className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">{subject.category}</div>
                    <h4 className="text-base font-bold text-slate-900">{subject.nameAr}</h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenUpdate(subject)}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-800 hover:text-white border border-blue-200 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    تحديث التقدم
                  </button>
                </div>

                {/* Chapters Progress Bar */}
                <div className="space-y-1.5 tabular-nums">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">الفصول المنجزة:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {subject.completedChapters} من {subject.totalChapters} ({chapterPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${chapterPercent}%` }}
                    />
                  </div>
                </div>

                {/* Real Recorded Attempt Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs tabular-nums">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      محاولات صحيحة: {subjectCorrect}/{subjectAttempts.length}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1.5 text-slate-700">
                    <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>آخر تحديث: {subject.lastStudiedDate}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Update Progress Dialog Modal */}
      {selectedSubjectToUpdate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <TrendingUp className="w-5 h-5 text-blue-700" />
              <span>تسجيل تقدم لمادة: {selectedSubjectToUpdate.nameAr}</span>
            </h3>

            <form onSubmit={handleSaveProgress} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  عدد الفصول المكتملة (من إجمالي {selectedSubjectToUpdate.totalChapters})
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedSubjectToUpdate.totalChapters}
                  value={newChaptersCount}
                  onChange={(e) => setNewChaptersCount(Number(e.target.value))}
                  className="w-full min-h-[40px] bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  تقييمك الشخصي لدرجة الفهم (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newQuizScore}
                  onChange={(e) => setNewQuizScore(Number(e.target.value))}
                  className="w-full min-h-[40px] bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedSubjectToUpdate(null)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  حفظ التقدم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

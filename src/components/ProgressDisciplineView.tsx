import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Flame,
  Clock,
  BookOpen,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Calendar,
  Plus,
  Target,
  Check,
  Zap
} from 'lucide-react';
import { SubjectProgress, DisciplineMetrics } from '../types';

interface ProgressDisciplineViewProps {
  progressList: SubjectProgress[];
  metrics: DisciplineMetrics;
  onUpdateSubjectProgress: (subjectCode: string, chaptersCompleted: number, score: number) => void;
}

export const ProgressDisciplineView: React.FC<ProgressDisciplineViewProps> = ({
  progressList,
  metrics,
  onUpdateSubjectProgress
}) => {
  const [selectedSubjectToUpdate, setSelectedSubjectToUpdate] = useState<SubjectProgress | null>(null);
  const [newChaptersCount, setNewChaptersCount] = useState<number>(0);
  const [newQuizScore, setNewQuizScore] = useState<number>(85);

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
      {/* Top Discipline & Commitment Gauge Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-blue-950/60 border border-emerald-800/40 p-6 lg:p-7 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              مؤشرات الانضباط والالتزام والتقدم الأكاديمي
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              تقييم الحضور، الالتزام بالواجبات، وإتقان نواتج التعلم
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              تحليل دقيق لمعدل مذاكرتك اليومية، استمرارية الستريك، ونسبة تغطية وحدات المنهج الرسمية تمهيداً لامتحانات يوليو 2027.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-900/90 border border-slate-700/70 rounded-2xl p-4 shadow-xl">
            {/* Discipline Score */}
            <div className="text-center p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400">معدل الانضباط</div>
              <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                {metrics.disciplineScore}%
              </div>
              <div className="text-[10px] text-emerald-300 font-medium">ممتاز جداً 🌟</div>
            </div>

            {/* Daily Streak */}
            <div className="text-center p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400">الستريك المتواصل</div>
              <div className="text-2xl font-extrabold text-orange-400 font-mono flex items-center justify-center gap-1">
                <span>{metrics.currentStreakDays}</span>
                <Flame className="w-5 h-5 fill-orange-500 animate-pulse" />
              </div>
              <div className="text-[10px] text-slate-400">أيام متتالية</div>
            </div>

            {/* Homework Rate */}
            <div className="text-center p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
              <div className="text-[11px] text-slate-400">تسليم الواجبات</div>
              <div className="text-2xl font-extrabold text-blue-400 font-mono">
                {metrics.homeworkCompleted}/{metrics.homeworkTotal}
              </div>
              <div className="text-[10px] text-blue-300 font-medium">
                {Math.round((metrics.homeworkCompleted / metrics.homeworkTotal) * 100)}% منجز
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges of Excellence & Consistency */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          شارات الانضباط والتميز المكتسبة (Badges)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {metrics.badgesEarned.map((badge, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3"
            >
              <div className="text-2xl p-2 rounded-xl bg-slate-900 border border-slate-800">
                {badge.icon}
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-white">{badge.title}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{badge.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subject by Subject Progress Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">
              نسبة التقدم وإتقان نواتج التعلم لكل مادة
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            انقر على أي مادة لتحديث الفصول المنجزة
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {progressList.map((subject) => {
            const chapterPercent = Math.round(
              (subject.completedChapters / subject.totalChapters) * 100
            );

            return (
              <div
                key={subject.subjectCode}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 hover:border-slate-700 transition-all shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {subject.category}
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">
                      {subject.nameAr}
                    </h4>
                  </div>

                  <button
                    onClick={() => handleOpenUpdate(subject)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold transition-all cursor-pointer"
                  >
                    تحديث التقدم
                  </button>
                </div>

                {/* Chapters Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">الفصول والأبواب المنجزة:</span>
                    <span className="font-bold text-white font-mono">
                      {subject.completedChapters} من {subject.totalChapters} فصول ({chapterPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${chapterPercent}%` }}
                    />
                  </div>
                </div>

                {/* Learning outcomes & test stats */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">نواتج التعلم</div>
                    <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                      {subject.learningOutcomesMastered}/{subject.learningOutcomesTotal}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">الاختبارات</div>
                    <div className="text-xs font-bold text-purple-400 font-mono mt-0.5">
                      {subject.quizzesTaken} اختبار
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">متوسط الدرجات</div>
                    <div className="text-xs font-bold text-amber-400 font-mono mt-0.5">
                      {subject.averageScore}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Update Progress Dialog Modal */}
      {selectedSubjectToUpdate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span>تسجيل تقدم لمادة: {selectedSubjectToUpdate.nameAr}</span>
            </h3>

            <form onSubmit={handleSaveProgress} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">
                  عدد الفصول المكتملة (من إجمالي {selectedSubjectToUpdate.totalChapters})
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedSubjectToUpdate.totalChapters}
                  value={newChaptersCount}
                  onChange={(e) => setNewChaptersCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  متوسط درجات الاختبارات الأخيرة (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newQuizScore}
                  onChange={(e) => setNewQuizScore(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedSubjectToUpdate(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
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

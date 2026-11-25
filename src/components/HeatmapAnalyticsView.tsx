import React, { useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';
import { CurriculumUnit, MonthlyExam } from '../types';
import { MISTAKE_ERROR_LABELS, studyPersistenceService } from '../services/studyPersistenceService';

interface HeatmapAnalyticsViewProps {
  curriculumUnits: CurriculumUnit[];
  monthlyExams: MonthlyExam[];
  onTargetTopicForStudy: (topicName: string, subjectCode: string) => void;
}

export const HeatmapAnalyticsView: React.FC<HeatmapAnalyticsViewProps> = ({
  curriculumUnits,
  onTargetTopicForStudy
}) => {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');

  const attempts = useMemo(() => studyPersistenceService.getAttempts(), []);
  const mistakes = useMemo(() => studyPersistenceService.getMistakes(), []);

  const unitSummaries = useMemo(() => {
    return curriculumUnits
      .filter((u) => selectedSubjectFilter === 'ALL' || u.subjectCode === selectedSubjectFilter)
      .map((unit) => {
        const unitAttempts = attempts.filter((a) => a.unitId === unit.id);
        const correctCount = unitAttempts.filter((a) => a.isCorrect).length;
        const unitMistakes = mistakes.filter((m) => m.unitId === unit.id && !m.resolved);
        const accuracyPercent =
          unitAttempts.length > 0 ? Math.round((correctCount / unitAttempts.length) * 100) : null;

        return {
          unit,
          attemptCount: unitAttempts.length,
          correctCount,
          unresolvedMistakeCount: unitMistakes.length,
          accuracyPercent
        };
      });
  }, [curriculumUnits, attempts, mistakes, selectedSubjectFilter]);

  const errorBreakdown = useMemo(() => {
    const counts: Record<string, number> = {
      rule: 0,
      algebra: 0,
      sign_unit: 0,
      unjustified_step: 0
    };
    mistakes.forEach((m) => {
      if (!m.resolved && counts[m.errorType] !== undefined) {
        counts[m.errorType] += 1;
      }
    });
    return counts;
  }, [mistakes]);

  const totalAttempts = attempts.length;
  const totalCorrect = attempts.filter((a) => a.isCorrect).length;
  const overallAccuracy =
    totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-bold text-cyan-800 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>تحليل المحاولات المسجلة وأنماط الأخطاء</span>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-slate-900">
              مؤشرات واقعية مبنية على محاولاتك ودفتر الأخطاء فقط
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              تُحسب هذه الإحصاءات مباشرة من المحاولات المسجلة على جهازك دون أي درجات متوقعة أو افتراضية.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-w-[260px] space-y-1 text-center tabular-nums">
            <div className="text-xs text-slate-600 font-semibold">نسبة الدقة في المحاولات المسجلة</div>
            <div className="text-3xl font-bold text-slate-900 font-mono">
              {overallAccuracy !== null ? `${overallAccuracy}%` : '—'}
            </div>
            <div className="text-xs text-slate-600">
              {totalAttempts > 0
                ? `${totalCorrect} إجابة صحيحة من ${totalAttempts} محاولة`
                : 'لم تبدأ محاولات مسجلة بعد'}
            </div>
          </div>
        </div>
      </div>

      {/* Empty State Notice */}
      {totalAttempts === 0 && mistakes.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center space-y-2">
          <BookOpen className="w-7 h-7 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">لم تبدأ محاولات مسجلة بعد</h3>
          <p className="text-xs text-slate-600 max-w-lg mx-auto">
            ابدأ بحل الأسئلة المراجَعة في حلقة التدريب أو وضع الاختبار ليظهر هنا توزيع محاولاتك وأنواع الأخطاء بدقة.
          </p>
        </div>
      )}

      {/* Error Type Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(MISTAKE_ERROR_LABELS).map(([key, label]) => (
          <div
            key={key}
            className="p-4 rounded-xl bg-white border border-slate-200 space-y-1 tabular-nums"
          >
            <div className="text-xs font-bold text-slate-700">{label}</div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {errorBreakdown[key] || 0}
            </div>
            <div className="text-[11px] text-slate-500">أخطاء نشطة في الدفتر</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-700 font-bold shrink-0">تصفية المادة:</span>
        {[
          { code: 'ALL', label: 'جميع المواد' },
          { code: 'CALCULUS', label: 'التفاضل والتكامل' },
          { code: 'STATICS', label: 'الاستاتيكا' },
          { code: 'DYNAMICS', label: 'الديناميكا' },
          { code: 'PHYSICS', label: 'الفيزياء' }
        ].map((tab) => (
          <button
            key={tab.code}
            type="button"
            onClick={() => setSelectedSubjectFilter(tab.code)}
            className={`min-h-[40px] px-4 py-2 rounded-xl border whitespace-nowrap font-bold cursor-pointer ${
              selectedSubjectFilter === tab.code
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Per-Unit Recorded Attempts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {unitSummaries.map(({ unit, attemptCount, correctCount, unresolvedMistakeCount, accuracyPercent }) => (
          <div
            key={unit.id}
            className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs font-bold text-blue-700">{unit.subjectNameAr}</div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">{unit.title}</h4>
              </div>
              <div className="text-sm font-mono font-bold text-slate-900 tabular-nums shrink-0">
                {accuracyPercent !== null ? `${accuracyPercent}%` : 'بدون محاولات'}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-600 tabular-nums">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>محاولات صحيحة: {correctCount}/{attemptCount}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>أخطاء للمراجعة: {unresolvedMistakeCount}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => onTargetTopicForStudy(unit.title, unit.subjectCode)}
              className="min-h-[40px] w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>تخصيص جلسة مراجعة لهذا الموضوع</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

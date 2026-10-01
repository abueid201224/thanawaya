import React, { useState } from 'react';
import {
  BookOpen,
  FastForward,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  Sparkles,
  Download,
  Plus,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  Check,
  X,
  Target
} from 'lucide-react';
import { CurriculumUnit, PracticeQuestion } from '../types';
import { MixedTextRenderer } from './MathRenderer';

interface FullCurriculumExplorerProps {
  units: CurriculumUnit[];
  onOpenSkipExam: (unit: CurriculumUnit) => void;
  onUpdateUnitResources: (unitId: string) => void;
}

export const FullCurriculumExplorer: React.FC<FullCurriculumExplorerProps> = ({
  units,
  onOpenSkipExam,
  onUpdateUnitResources
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(units[0]?.id || null);
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const subjects = [
    { code: 'ALL', name: 'جميع المواد' },
    { code: 'CALCULUS', name: 'التفاضل والتكامل' },
    { code: 'STATICS', name: 'الاستاتيكا' },
    { code: 'DYNAMICS', name: 'الديناميكا' },
    { code: 'PHYSICS', name: 'الفيزياء' }
  ];

  const filteredUnits = units.filter((u) => {
    const matchesSubject = selectedSubject === 'ALL' || u.subjectCode === selectedSubject;
    const matchesSearch =
      u.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const toggleSolution = (qId: string) => {
    setRevealedSolutions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleSyncWithScout = (unitId: string, unitTitle: string) => {
    onUpdateUnitResources(unitId);
    setSyncFeedback(`تم فحص وتحديث الروابط والمذكرات المحلية لوحدة: "${unitTitle}" بنجاح.`);
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/60 border border-blue-800/40 p-6 lg:p-7 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              مكتبة المناهج والتدريبات المحلية الشاملة
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              فهرس الوحدات وتدريبات نواتج التعلم وخاصية التخطي
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              مكتبة محلية متكاملة لجميع فروع الرياضيات والعلوم. يمكنك دراسة كل درس وحل تدريباته، أو تأكيد دراستك السابقة وتخطي الوحدة فوراً عبر اجتياز اختبار الإتقان الذكي!
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-4 min-w-[270px] text-xs space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>الوحدات الدراسية المسجلة:</span>
              <span className="font-bold text-white font-mono">{units.length} وحدات</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>الوحدات المكتملة أو المتخطاة:</span>
              <span className="font-bold text-emerald-400 font-mono">
                {units.filter((u) => u.status === 'completed' || u.status === 'skipped_by_exam').length} وحدة
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>التحديث التلقائي:</span>
              <span className="font-bold text-blue-400 font-mono">متصل بكشاف الوزارة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Alert Banner if triggered */}
      {syncFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{syncFeedback}</span>
          </div>
          <button onClick={() => setSyncFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Subject Filter & Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto text-xs pb-1 md:pb-0">
          {subjects.map((s) => (
            <button
              key={s.code}
              onClick={() => setSelectedSubject(s.code)}
              className={`px-3.5 py-2 rounded-xl border whitespace-nowrap transition-all cursor-pointer font-bold ${
                selectedSubject === s.code
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في الوحدات والدروس ونواتج التعلم..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Units List */}
      <div className="space-y-4">
        {filteredUnits.map((unit) => {
          const isExpanded = expandedUnitId === unit.id;
          const isSkipped = unit.status === 'skipped_by_exam';
          const isCompleted = unit.status === 'completed';

          return (
            <div
              key={unit.id}
              className={`rounded-2xl border transition-all overflow-hidden shadow-lg ${
                isSkipped
                  ? 'bg-amber-950/15 border-amber-500/40 ring-1 ring-amber-500/20'
                  : isCompleted
                  ? 'bg-slate-900/60 border-emerald-800/40'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Unit Card Header */}
              <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                      {unit.subjectNameAr}
                    </span>

                    {/* Status Badge */}
                    {isSkipped && (
                      <span className="text-xs px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                        <FastForward className="w-3 h-3" />
                        تم التخطي باجتياز اختبار الإتقان ({unit.skipExamScore || 90}%)
                      </span>
                    )}

                    {isCompleted && !isSkipped && (
                      <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        مكتملة ومتقنة
                      </span>
                    )}

                    {unit.status === 'in_progress' && (
                      <span className="text-xs px-2.5 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        قيد المذاكرة حالياً
                      </span>
                    )}

                    {unit.status === 'not_started' && (
                      <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 font-bold">
                        لم تبدأ بعد
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400">
                      {unit.localResourcesCount} موارد ومذكرات محلية
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white leading-snug">
                    {unit.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {unit.description}
                  </p>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center flex-wrap gap-2.5">
                  {/* Skip by Exam Button */}
                  {!isSkipped && (
                    <button
                      onClick={() => onOpenSkipExam(unit)}
                      className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/10"
                      title="خض اختبار التخطي إذا كنت قد ذاكرت هذه الوحدة مسبقاً لاعتمادها فورياً"
                    >
                      <FastForward className="w-3.5 h-3.5" />
                      <span>تخطي باختبار إتقان ⚡</span>
                    </button>
                  )}

                  {/* Sync Local Resources from Scout */}
                  <button
                    onClick={() => handleSyncWithScout(unit.id, unit.title)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                    title="تحديث الروابط والمذكرات المحلية من كشاف المساعد الذكي"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  {/* Accordion toggle */}
                  <button
                    onClick={() => setExpandedUnitId(isExpanded ? null : unit.id)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>{isExpanded ? 'إخفاء التفاصيل' : 'عرض التدريبات والمفاهيم'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Area: Study Notes & Practice Questions */}
              {isExpanded && (
                <div className="border-t border-slate-800 bg-slate-950/80 p-5 lg:p-6 space-y-6">
                  {/* Learning Outcomes & High Yield Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" />
                        نواتج التعلم الوزارية المستهدفة:
                      </div>
                      <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
                        {unit.learningOutcomes.map((lo, idx) => (
                          <li key={idx}>{lo}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        ملخص القوانين والكبسولة الذهبية:
                      </div>
                      <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
                        {unit.studyNotesSummary.map((note, idx) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Interactive Practice Questions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <span>تدريبات نواتج التعلم وأسئلة الامتحانات السابقة ({unit.practiceQuestions.length} تدريبات)</span>
                      </h4>
                      <span className="text-xs text-slate-400">
                        حل المسألة ثم اعرض الحل المفصل للمقارنة
                      </span>
                    </div>

                    <div className="space-y-3">
                      {unit.practiceQuestions.map((q) => {
                        const isRevealed = revealedSolutions[q.id];

                        return (
                          <div
                            key={q.id}
                            className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="font-bold text-blue-400 font-mono">
                                    تدريب {q.questionNumber}
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                                    مستوى {q.difficulty}
                                  </span>
                                  {q.examSource && (
                                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] font-bold">
                                      {q.examSource}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm font-semibold text-white leading-relaxed">
                                  <MixedTextRenderer text={q.questionText} />
                                </div>
                              </div>

                              <button
                                onClick={() => toggleSolution(q.id)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium whitespace-nowrap transition-all cursor-pointer"
                              >
                                {isRevealed ? 'إخفاء الحل' : 'إظهار الحل والخطوات'}
                              </button>
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {q.options.map((opt) => (
                                <div
                                  key={opt.key}
                                  className={`p-2.5 rounded-lg border ${
                                    isRevealed && opt.key === q.correctKey
                                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-bold'
                                      : 'bg-slate-950 border-slate-800 text-slate-300'
                                  }`}
                                >
                                  <span className="font-bold font-mono ml-2">({opt.key})</span>
                                  <MixedTextRenderer text={opt.text} className="inline" />
                                </div>
                              ))}
                            </div>

                            {/* Solution & Detailed Explanation */}
                            {isRevealed && (
                              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200 space-y-1.5 leading-relaxed">
                                <div className="font-bold text-blue-300 flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>خطوات الحل المعتمدة من مستشار المادة:</span>
                                </div>
                                <MixedTextRenderer text={q.explanation} />
                                <div className="text-[11px] text-slate-400 pt-1">
                                  الناتج التعليمي المستهدف: {q.targetedLearningOutcome}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

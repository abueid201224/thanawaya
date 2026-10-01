import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  TrendingUp,
  Brain,
  Filter,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  Target,
  Layers,
  ChevronDown
} from 'lucide-react';
import { TopicHeatmapData, CurriculumUnit, MonthlyExam } from '../types';
import { MathRenderer } from './MathRenderer';

interface HeatmapAnalyticsViewProps {
  curriculumUnits: CurriculumUnit[];
  monthlyExams: MonthlyExam[];
  onTargetTopicForStudy: (topicName: string, subjectCode: string) => void;
}

export const HeatmapAnalyticsView: React.FC<HeatmapAnalyticsViewProps> = ({
  curriculumUnits,
  monthlyExams,
  onTargetTopicForStudy
}) => {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');

  // Comprehensive Heatmap Data for Thanaweya Amma (Math Section)
  const initialHeatmapData: TopicHeatmapData[] = [
    {
      topicId: 'thm_1',
      topicName: 'تطبيقات القيم العظمى والصغرى المحلية والمطلقة',
      subjectCode: 'CALCULUS',
      subjectNameAr: 'التفاضل والتكامل',
      masteryScore: 52,
      difficultyLevel: 'C',
      errorFrequency: 14,
      predictedExamWeight: 14, // 14% of pure math paper
      weaknessStatus: 'danger',
      historicalExamAppearances: ['2021 دور أول', '2023 دور أول', '2024 دور أول', '2025 تجريبي'],
      remedialConcept: 'التدرب على تكوين "الدالة الهدف" من العلاقات الهندسية قبل الاشتقاق.'
    },
    {
      topicId: 'thm_2',
      topicName: 'المعدلات الزمنية المرتبطة في السوائل والسلالم',
      subjectCode: 'CALCULUS',
      subjectNameAr: 'التفاضل والتكامل',
      masteryScore: 68,
      difficultyLevel: 'B',
      errorFrequency: 9,
      predictedExamWeight: 10,
      weaknessStatus: 'warning',
      historicalExamAppearances: ['2022 دور أول', '2023 دور ثان', '2025 دور أول'],
      remedialConcept: 'التركيز على إشارة معدل التغير (الموجب للزيادة والسالب للنقصان) ولحظة التقييم.'
    },
    {
      topicId: 'thm_3',
      topicName: 'حجوم ومساحات المجسمات الدورانية بالتكامل المحدد',
      subjectCode: 'CALCULUS',
      subjectNameAr: 'التفاضل والتكامل',
      masteryScore: 92,
      difficultyLevel: 'A',
      errorFrequency: 2,
      predictedExamWeight: 8,
      weaknessStatus: 'mastered',
      historicalExamAppearances: ['2021 دور ثان', '2024 تجريبي'],
      remedialConcept: 'متقن تماماً، يُكتفى بمراجعة دورية كل 3 أسابيع.'
    },
    {
      topicId: 'thm_4',
      topicName: 'قوى الاحتكاك والاتزان على مستوى مائل خشن',
      subjectCode: 'STATICS',
      subjectNameAr: 'الاستاتيكا',
      masteryScore: 58,
      difficultyLevel: 'C',
      errorFrequency: 11,
      predictedExamWeight: 12,
      weaknessStatus: 'danger',
      historicalExamAppearances: ['2022 دور أول', '2023 دور أول', '2024 دور ثان'],
      remedialConcept: 'شروط انزلاق الجسم أو وشك الحركة تحت تأثير قوة مائلة بزاوية هـ.'
    },
    {
      topicId: 'thm_5',
      topicName: 'مركز الثقل والكتل السالبة وطريقة المحاور المتعامدة',
      subjectCode: 'STATICS',
      subjectNameAr: 'الاستاتيكا',
      masteryScore: 84,
      difficultyLevel: 'B',
      errorFrequency: 4,
      predictedExamWeight: 9,
      weaknessStatus: 'warning',
      historicalExamAppearances: ['2021 دور أول', '2023 دور أول', '2025 تجريبي'],
      remedialConcept: 'حساب مساحات الأشكال المقتطعة بدقة وتعيين الإحداثيات السينية والصادية.'
    },
    {
      topicId: 'thm_6',
      topicName: 'الكرات والمستويات ومعادلة المستقيم في الفراغ ثلاثي الأبعاد',
      subjectCode: 'ALGEBRA_SOLID_GEO',
      subjectNameAr: 'الجبر والهندسة الفراغية',
      masteryScore: 61,
      difficultyLevel: 'B',
      errorFrequency: 8,
      predictedExamWeight: 11,
      weaknessStatus: 'warning',
      historicalExamAppearances: ['2022 دور ثان', '2024 دور أول', '2025 دور أول'],
      remedialConcept: 'متجه اتجاه المستقيم والعمودي على المستوى والعلاقات التعامدية.'
    },
    {
      topicId: 'thm_7',
      topicName: 'الجذور التكعيبية للواحد الصحيح (أوميجا) ونظرية ديموافر',
      subjectCode: 'ALGEBRA_SOLID_GEO',
      subjectNameAr: 'الجبر والهندسة الفراغية',
      masteryScore: 88,
      difficultyLevel: 'B',
      errorFrequency: 3,
      predictedExamWeight: 10,
      weaknessStatus: 'mastered',
      historicalExamAppearances: ['2021 دور أول', '2023 دور أول', '2024 دور أول'],
      remedialConcept: 'متقن - استمرار حل الأنماط التراكمية مع متطابقة (1 + أوميجا + أوميجا² = 0).'
    },
    {
      topicId: 'thm_8',
      topicName: 'قوانين نيوتن وحركة البكرات والكتل على المستويات',
      subjectCode: 'DYNAMICS',
      subjectNameAr: 'الديناميكا',
      masteryScore: 49,
      difficultyLevel: 'C',
      errorFrequency: 16,
      predictedExamWeight: 13,
      weaknessStatus: 'danger',
      historicalExamAppearances: ['2021 دور أول', '2022 دور أول', '2024 دور أول', '2025 تجريبي'],
      remedialConcept: 'إدارة وحدات القوة والكتلة (النيوتن مقابل الثقل كجم) ومعادلات الحركة النسبية.'
    }
  ];

  const [heatmapItems, setHeatmapItems] = useState<TopicHeatmapData[]>(initialHeatmapData);

  const filteredItems = heatmapItems.filter(
    (item) => selectedSubjectFilter === 'ALL' || item.subjectCode === selectedSubjectFilter
  );

  // Predictive Exam Calculations
  const averageMastery = Math.round(
    heatmapItems.reduce((acc, curr) => acc + curr.masteryScore, 0) / heatmapItems.length
  );

  // Thanaweya Amma Math Total is 120 marks (60 Pure Math + 60 Applied Math)
  const predictedScoreOutOf120 = Math.round((averageMastery / 100) * 120);
  const potentialScoreAfterRemediation = Math.min(120, predictedScoreOutOf120 + 16);

  const dangerCount = heatmapItems.filter((i) => i.weaknessStatus === 'danger').length;
  const warningCount = heatmapItems.filter((i) => i.weaknessStatus === 'warning').length;
  const masteredCount = heatmapItems.filter((i) => i.weaknessStatus === 'mastered').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-blue-950/70 border border-cyan-800/40 p-6 lg:p-7 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              محرك التقييم التنبؤي وخريطة الحرارة (Heatmap Analytics)
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              تشخيص نقاط الضعف الرياضية وتوقع درجات الثانوية العامة
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              تحليل دقيق ناتج عن دمج نتائج امتحانات التخطي، التدريبات المستمرة، والامتحانات الشهرية. يحدد المحرك مواطن الخلل التي قد تضيع الدرجات في امتحان نهاية العام مع مقترحات علاجية فورية.
            </p>
          </div>

          {/* Predictive Score Widget */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 min-w-[280px] text-center space-y-3 shadow-xl">
            <div className="text-xs text-slate-400 font-semibold">التوقع الحالي لدرجة الرياضيات (من 120)</div>
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-4xl font-extrabold text-cyan-400 font-mono">
                {predictedScoreOutOf120}
              </span>
              <span className="text-sm text-slate-400 font-mono">/ 120</span>
            </div>
            <div className="text-[11px] text-emerald-400 bg-emerald-500/10 py-1.5 px-2.5 rounded-xl border border-emerald-500/20 flex items-center justify-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>قابلة للزيادة إلى {potentialScoreAfterRemediation} درجة فور إتقان الدروس الحرجة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-800/40 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-rose-300 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>نقاط ضعف حرجة (&lt; 60%)</span>
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono">{dangerCount} مواضيع</div>
            <div className="text-[11px] text-slate-400">تشكل 38% من درجات الامتحان</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-lg">
            🚨
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-400" />
              <span>بحاجة لتثبيت وتدريب (60% - 84%)</span>
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">{warningCount} مواضيع</div>
            <div className="text-[11px] text-slate-400">تتطلب تدريباً بؤرياً على السرعة</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg">
            ⚠️
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>متقنة ومثبتة (&gt; 85%)</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">{masteredCount} مواضيع</div>
            <div className="text-[11px] text-slate-400">تحتاج فقط مراجعة دورية متباعدة</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg">
            ✅
          </div>
        </div>
      </div>

      {/* Filter and Heatmap Matrix */}
      <div className="space-y-4">
        {/* Subject Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-bold shrink-0 ml-1">تصفية المادة:</span>
          {[
            { code: 'ALL', label: 'جميع فروع الرياضيات' },
            { code: 'CALCULUS', label: 'التفاضل والتكامل' },
            { code: 'ALGEBRA_SOLID_GEO', label: 'الجبر والهندسة الفراغية' },
            { code: 'STATICS', label: 'الاستاتيكا' },
            { code: 'DYNAMICS', label: 'الديناميكا' }
          ].map((tab) => (
            <button
              key={tab.code}
              onClick={() => setSelectedSubjectFilter(tab.code)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-medium whitespace-nowrap ${
                selectedSubjectFilter === tab.code
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Heatmap Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((topic) => {
            const isDanger = topic.weaknessStatus === 'danger';
            const isWarning = topic.weaknessStatus === 'warning';

            return (
              <div
                key={topic.topicId}
                className={`p-5 rounded-2xl border transition-all space-y-4 shadow-lg ${
                  isDanger
                    ? 'bg-slate-900/90 border-rose-900/50 hover:border-rose-500/60'
                    : isWarning
                    ? 'bg-slate-900/90 border-amber-900/40 hover:border-amber-500/50'
                    : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50'
                }`}
              >
                {/* Topic Header & Mastery Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {topic.subjectNameAr}
                    </span>
                    <h4 className="text-sm font-bold text-white leading-snug">{topic.topicName}</h4>
                  </div>

                  {/* Percentage Score Badge */}
                  <div
                    className={`px-3 py-1 rounded-xl font-mono font-bold text-xs shrink-0 flex items-center gap-1 ${
                      isDanger
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : isWarning
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    <span>{topic.masteryScore}%</span>
                  </div>
                </div>

                {/* Progress Visual Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>معدل إتقان نواتج التعلم:</span>
                    <span className="font-mono text-slate-300">{topic.masteryScore} / 100</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${topic.masteryScore}%` }}
                    />
                  </div>
                </div>

                {/* Historical Exam & Stats Row */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                  <div className="text-slate-400">
                    الوزن النسبي بالامتحان: <span className="text-cyan-300 font-bold">{topic.predictedExamWeight}%</span>
                  </div>
                  <div className="text-slate-400">
                    تكرار الخطأ في التدريب: <span className="text-rose-400 font-bold">{topic.errorFrequency} مرات</span>
                  </div>
                </div>

                {/* Appearances */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="text-slate-500">ورد في:</span>
                  {topic.historicalExamAppearances.map((app, aIdx) => (
                    <span
                      key={aIdx}
                      className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800"
                    >
                      {app}
                    </span>
                  ))}
                </div>

                {/* Remedial Recommendation Box */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 text-xs">
                  <div className="font-bold text-amber-300 flex items-center gap-1 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>التوصية العلاجية الذكية:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">{topic.remedialConcept}</p>
                </div>

                {/* Action CTA */}
                <button
                  onClick={() => onTargetTopicForStudy(topic.topicName, topic.subjectCode)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>جدولة حصة علاجية مكثفة مع المعلم الذكي</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

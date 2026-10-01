import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Award,
  RefreshCw,
  Eye,
  Send,
  HelpCircle,
  FileCheck,
  Zap,
  TrendingUp,
  Brain
} from 'lucide-react';
import { MathRenderer, MixedTextRenderer } from './MathRenderer';

interface RubricStep {
  stepName: string;
  maxMark: number;
  awardedMark: number;
  status: 'full' | 'partial' | 'missed';
  studentWorkDetected: string;
  officialAnswerModel: string;
  remedialComment: string;
}

interface EssayProblemSample {
  id: string;
  subjectAr: string;
  examSession: string; // e.g. "ثانوية عامة 2024 دور أول (سؤال مقالي)"
  questionPrompt: string;
  totalMarks: number;
  sampleHandwrittenImage: string;
  studentEarnedMarks: number;
  overallFeedback: string;
  rubricSteps: RubricStep[];
}

export const HandwrittenEssayGraderView: React.FC = () => {
  const sampleProblems: EssayProblemSample[] = [
    {
      id: 'essay_1',
      subjectAr: 'التفاضل والتكامل',
      examSession: 'امتحان الثانوية العامة 2024 - الدور الأول (مقالي)',
      questionPrompt: 'أوجد أبعاد أكبر أسطوانة دائرية قائمة يمكن وضعها داخل مخروط دائري قائم نصف قطر قاعدته ٦ سم وارتفاعه ١٢ سم بحيث تقع قاعدة الأسطوانة على قاعدة المخروط.',
      totalMarks: 3.0,
      studentEarnedMarks: 2.5,
      sampleHandwrittenImage: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=800&auto=format&fit=crop&q=80',
      overallFeedback: 'إجابة ممتازة وخطوات واضحة ومنظمة. تم خصم نصف درجة فقط لعدم التحقق الصريح من المشتقة الثانية للتأكيد على أن الحجم قيمة عظمى مطلقة.',
      rubricSteps: [
        {
          stepName: '1. الرسم واستنتاج العلاقة المساعدة (تشابه المثلثات)',
          maxMark: 1.0,
          awardedMark: 1.0,
          status: 'full',
          studentWorkDetected: 'رسم مقطع رأسي للمخروط والأسطوانة وكتابة التناسب: (12 - ع) / 12 = نق / 6 => ع = 12 - 2 نق',
          officialAnswerModel: '\\frac{12 - h}{12} = \\frac{r}{6} \\implies h = 12 - 2r',
          remedialComment: 'رسم دقيق وصياغة صحيحة للعلاقة الهندسية المساعدة مع توضيح المتغيرات.'
        },
        {
          stepName: '2. كتابة دالة الحجم والاشتقاق ومساواتها بالصفر',
          maxMark: 1.0,
          awardedMark: 1.0,
          status: 'full',
          studentWorkDetected: 'ح = ط نق² ع = ط نق² (12 - 2نق) = ط (12 نق² - 2 نق³). د ح / د نق = ط (24 نق - 6 نق²) = 0',
          officialAnswerModel: 'V = \\pi r^2 h = \\pi(12r^2 - 2r^3) \\implies \\frac{dV}{dr} = \\pi(24r - 6r^2) = 0 \\implies r = 4',
          remedialComment: 'اشتقاق سليم واختيار القيمة الموجبة لنصف القطر (نق = 4 سم) واستبعاد (نق = 0).'
        },
        {
          stepName: '3. اختبار المشتقة الثانية وحساب الارتفاع النهائي',
          maxMark: 1.0,
          awardedMark: 0.5,
          status: 'partial',
          studentWorkDetected: 'ع = 12 - 2(4) = 4 سم. الأبعاد هي: نق = 4 سم، الارتفاع = 4 سم.',
          officialAnswerModel: '\\frac{d^2V}{dr^2} = \\pi(24 - 12r) = \\pi(24 - 48) = -24\\pi < 0 \\implies \\text{قيمة عظمى}',
          remedialComment: 'تنبيه وزاري: تم إيجاد الأبعاد بشكل صحيح ولكن تم إهمال اختبار المشتقة الثانية أو بحث الإشارة للتأكيد على أنها قيمة عظمى (خصم 0.5 درجة).'
        }
      ]
    },
    {
      id: 'essay_2',
      subjectAr: 'الاستاتيكا',
      examSession: 'امتحان الثانوية العامة 2023 - الدور الأول (مقالي)',
      questionPrompt: 'قضيب منتظم أ ب طوله ٨٠ سم ووزنه ٢٠ ث.كجم متصل بطرفه أ بمفصل مثبت في حائط رأسي. حفظ القضيب في وضع أفقي بواسطة خيط خفيف متصل بنقطة على القضيب تبعد ٦٠ سم عن أ ومثبت طرفه الآخر في نقطة على الحائط أعلى أ بمسافة ٨٠ سم. أوجد مقدار الشد في الخيط ورد فعل المفصل.',
      totalMarks: 3.0,
      studentEarnedMarks: 3.0,
      sampleHandwrittenImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
      overallFeedback: 'إجابة نموذجية كاملة مطابقة تماماً لتوزيع درجات المركز القومي للامتحانات (3/3 درجات).',
      rubricSteps: [
        {
          stepName: '1. تحليل القوى وإيجاد زاوية ميل الخيط',
          maxMark: 1.0,
          awardedMark: 1.0,
          status: 'full',
          studentWorkDetected: 'طول الخيط = جذر(60² + 80²) = 100 سم. جا هـ = 80/100 = 4/5 ، جتا هـ = 3/5.',
          officialAnswerModel: '\\text{وتر المثلث القائم} = 100 \\text{ cm}, \\quad \\sin\\theta = \\frac{4}{5}, \\quad \\cos\\theta = \\frac{3}{5}',
          remedialComment: 'استخدام سليم للنسب المثلثية وتحليل قوى الشد ورد الفعل.'
        },
        {
          stepName: '2. شروط الاتزان والعزوم حول أ',
          maxMark: 1.0,
          awardedMark: 1.0,
          status: 'full',
          studentWorkDetected: 'العزوم حول أ = 0 => 20 * 40 - (ش * جا هـ) * 60 = 0 => 800 = ش * (4/5) * 60 => ش = 16.67 ث.كجم',
          officialAnswerModel: '\\sum M_A = 0 \\implies 20 \\times 40 = (T \\sin\\theta) \\times 60 \\implies T = \\frac{50}{3} \\text{ kg.wt}',
          remedialComment: 'حساب العزوم دقيق وتحديد ذراع القوة مطابق للنموذج الرسمي.'
        },
        {
          stepName: '3. مركبات رد فعل المفصل والمقدار النهائي',
          maxMark: 1.0,
          awardedMark: 1.0,
          status: 'full',
          studentWorkDetected: 'س = ش جتا هـ = 10 ، ص = 20 - ش جا هـ = 20/3. ر = جذر(س² + ص²) = 12.02 ث.كجم',
          officialAnswerModel: 'R_x = T\\cos\\theta = 10, \\quad R_y = 20 - T\\sin\\theta = \\frac{20}{3} \\implies R = \\sqrt{R_x^2 + R_y^2}',
          remedialComment: 'استخراج رد الفعل مع الوحدة الدقيقة ث.كجم.'
        }
      ]
    }
  ];

  const [activeProblem, setActiveProblem] = useState<EssayProblemSample>(sampleProblems[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSwitchProblem = (problem: EssayProblemSample) => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setActiveProblem(problem);
      setIsAnalyzing(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-blue-950/70 border border-amber-800/40 p-6 lg:p-7 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
              <Brain className="w-3.5 h-3.5 text-amber-400" />
              مصحح الأسئلة المقالية وخط اليد (Handwritten Essay Vision Grader)
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              تصحيح فوري لخطوات الحل المقالي وفق نماذج إجابة الوزارة
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              تحليل خطوة بخطوة للورقة المقالية (خطوة القانون، خطوة التعويض والاشتقاق، والناتج النهائي مع الوحدة). يكتشف الذكاء الاصطناعي أين تضيع درجاتك في المسائل المقالية لتلافيها قبل لجان الامتحان.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 min-w-[260px] text-center space-y-2 shadow-xl">
            <div className="text-xs text-slate-400 font-semibold">الدرجة المقدرة للورقة المصححة</div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-black text-amber-400 font-mono">
                {activeProblem.studentEarnedMarks}
              </span>
              <span className="text-sm text-slate-400 font-mono">/ {activeProblem.totalMarks} درجات</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
              مطابق لباريم تصحيح الوزارة
            </span>
          </div>
        </div>
      </div>

      {/* Problem Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
        <span className="text-slate-400 font-bold">نماذج مسائل امتحانات الثانوية العامة المصححة:</span>
        <div className="flex items-center gap-2">
          {sampleProblems.map((prob) => (
            <button
              key={prob.id}
              onClick={() => handleSwitchProblem(prob)}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
                activeProblem.id === prob.id
                  ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {prob.subjectAr}: {prob.examSession.slice(0, 30)}...
            </button>
          ))}
        </div>
      </div>

      {/* Main Analysis Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Question Prompt & Student Work Image */}
        <div className="lg:col-span-5 space-y-4">
          {/* Question Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold font-mono">
                {activeProblem.examSession}
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {activeProblem.totalMarks} درجات مقالية
              </span>
            </div>
            <h4 className="text-sm font-bold text-white leading-relaxed">
              {activeProblem.questionPrompt}
            </h4>
          </div>

          {/* Student Handwritten Work Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-[4/3] shadow-xl">
            <img
              src={activeProblem.sampleHandwrittenImage}
              alt="Handwritten math solution"
              className="w-full h-full object-cover opacity-85"
            />

            {isAnalyzing && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                <span className="text-xs font-mono text-amber-300 font-bold">
                  جاري مطابقة خطوات خط اليد مع نموذج الإجابة الرسمي...
                </span>
              </div>
            )}

            <div className="absolute bottom-3 right-3 left-3 bg-slate-950/90 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تم التعرف على خطوات الطالب المكتوبة بخط اليد بنجاح</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400">Gemini Vision OCR</span>
            </div>
          </div>

          {/* Overall Evaluator Summary Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/30 to-slate-900 border border-amber-800/40 text-xs space-y-2">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>ملاحظة رئيس لجنة التقدير:</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">{activeProblem.overallFeedback}</p>
          </div>
        </div>

        {/* Right Column: Step-by-Step Rubric Breakdown */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>تفصيل توزيع الدرجات الوزاري (Rubric Breakdown):</span>
            </h4>
            <span className="text-xs text-slate-400">توزيع دقيق لكل نصف درجة</span>
          </div>

          <div className="space-y-4">
            {activeProblem.rubricSteps.map((step, idx) => {
              const isFull = step.status === 'full';
              const isPartial = step.status === 'partial';

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border transition-all space-y-3 shadow-lg ${
                    isFull
                      ? 'bg-slate-900/90 border-slate-800'
                      : 'bg-slate-900/95 border-amber-900/50'
                  }`}
                >
                  {/* Step Title & Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{step.stepName}</span>
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg ${
                        isFull
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {step.awardedMark} / {step.maxMark} د
                    </span>
                  </div>

                  {/* Student Work Extracted */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                    <div className="text-[11px] text-slate-400 font-semibold">ما تم رصده في ورقة الطالب:</div>
                    <div className="text-slate-200 leading-relaxed font-mono text-[11px]">{step.studentWorkDetected}</div>
                  </div>

                  {/* Official Model Answer Formula */}
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-blue-900/30 space-y-1 text-xs">
                    <div className="text-[11px] text-blue-400 font-semibold">نموذج الوزارة المعتمد:</div>
                    <div className="text-center py-1">
                      <MathRenderer latex={step.officialAnswerModel} block={true} className="text-sm text-cyan-300" />
                    </div>
                  </div>

                  {/* Remedial Comment */}
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                      isFull
                        ? 'bg-emerald-950/20 border border-emerald-800/30 text-emerald-200'
                        : 'bg-amber-950/25 border border-amber-800/40 text-amber-200'
                    }`}
                  >
                    {isFull ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <span className="text-[11px] leading-relaxed">{step.remedialComment}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

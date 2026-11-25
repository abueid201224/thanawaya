import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  CheckCircle2,
  Circle,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { studyPersistenceService } from '../services/studyPersistenceService';

interface RubricStep {
  stepName: string;
  maxMark: number;
  officialAnswerModel: string;
  verificationChecklist: string;
  commonPitfall: string;
}

interface EssayRubricProblem {
  id: string;
  subjectAr: string;
  examSession: string;
  questionPrompt: string;
  totalMarks: number;
  rubricSteps: RubricStep[];
}

const ESSAY_RUBRIC_PROBLEMS: EssayRubricProblem[] = [
  {
    id: 'essay_1',
    subjectAr: 'التفاضل والتكامل',
    examSession: 'مسألة مقالية تدريبية (مستوى التوجيه الفني)',
    questionPrompt:
      'أوجد أبعاد أكبر أسطوانة دائرية قائمة يمكن وضعها داخل مخروط دائري قائم نصف قطر قاعدته 6 سم وارتفاعه 12 سم بحيث تقع قاعدة الأسطوانة على قاعدة المخروط.',
    totalMarks: 3.0,
    rubricSteps: [
      {
        stepName: '1. الرسم واستنتاج العلاقة المساعدة (تشابه المثلثات)',
        maxMark: 1.0,
        officialAnswerModel: '\\frac{12 - h}{12} = \\frac{r}{6} \\implies h = 12 - 2r',
        verificationChecklist:
          'هل رسمت مقطعاً رأسياً يوضح ارتفاع المخروط الكلي 12 وربطت بين h و r بتناسب صحيح؟',
        commonPitfall: 'الخلط بين ارتفاع الأسطوانة h والمسافة المتبقية أعلى الأسطوانة (12 - h).'
      },
      {
        stepName: '2. كتابة دالة الحجم والاشتقاق ومساواتها بالصفر',
        maxMark: 1.0,
        officialAnswerModel:
          'V = \\pi r^2 h = \\pi(12r^2 - 2r^3) \\implies \\frac{dV}{dr} = \\pi(24r - 6r^2) = 0 \\implies r = 4',
        verificationChecklist:
          'هل عبّرت عن الحجم في متغير واحد r ثم اشتققت ووضعت المشتقة = 0 واستبعدت r = 0؟',
        commonPitfall: 'نسيان استبعاد r = 0 هندسياً لأنها لا تشكّل أسطوانة فعلية.'
      },
      {
        stepName: '3. التحقق من القيمة العظمى وحساب الأبعاد النهائية',
        maxMark: 1.0,
        officialAnswerModel:
          '\\frac{d^2V}{dr^2} = \\pi(24 - 12r) \\Big|_{r=4} = -24\\pi < 0 \\implies h = 4\\text{ cm}',
        verificationChecklist:
          'هل تحققت من إشارة المشتقة الثانية (أو خط إشارة المشتقة الأولى) قبل كتابة r = 4 سم و h = 4 سم؟',
        commonPitfall: 'إغفال خطوة التحقق من العظمى المحلية/المطلقة أو نسيان وحدة القياس (سم).'
      }
    ]
  },
  {
    id: 'essay_2',
    subjectAr: 'الاستاتيكا',
    examSession: 'مسألة مقالية تدريبية (اتزان عام)',
    questionPrompt:
      'قضيب منتظم أ ب طوله 80 سم ووزنه 20 ث.كجم متصل بطرفه أ بمفصل مثبت في حائط رأسي. حُفظ القضيب في وضع أفقي بواسطة خيط خفيف متصل بنقطة على القضيب تبعد 60 سم عن أ ومثبت طرفه الآخر في نقطة على الحائط أعلى أ بمسافة 80 سم. أوجد مقدار الشد في الخيط ورد فعل المفصل.',
    totalMarks: 3.0,
    rubricSteps: [
      {
        stepName: '1. تحليل القوى وإيجاد النسب المثلثية لزاوية ميل الخيط',
        maxMark: 1.0,
        officialAnswerModel:
          'L = \\sqrt{60^2 + 80^2} = 100\\text{ cm}, \\quad \\sin\\theta = \\frac{4}{5}, \\quad \\cos\\theta = \\frac{3}{5}',
        verificationChecklist:
          'هل حددت نقطة تأثير الوزن في منتصف القضيب (40 سم من أ) وحسبت جا وجتا الزاوية بدقة؟',
        commonPitfall: 'عكس النسب المثلثية بين جا وجتا عند تحليل الشد إلى مركبتين أفقية ورأسية.'
      },
      {
        stepName: '2. معادلة العزوم حول المفصل أ',
        maxMark: 1.0,
        officialAnswerModel:
          '\\sum M_A = 0 \\implies 20 \\times 40 = (T\\sin\\theta) \\times 60 \\implies T = \\frac{50}{3}\\text{ kg.wt}',
        verificationChecklist:
          'هل أخذت العزوم حول أ لإلغاء مركبتي رد فعل المفصل واستنتجت قيمة الشد T؟',
        commonPitfall: 'ضرب الشد الكلي في 60 دون استخدام المركبة العمودية T جا θ.'
      },
      {
        stepName: '3. حساب مركبتي رد فعل المفصل ومقداره',
        maxMark: 1.0,
        officialAnswerModel:
          'R_x = T\\cos\\theta = 10, \\quad R_y = 20 - T\\sin\\theta = \\frac{20}{3} \\implies R = \\sqrt{R_x^2 + R_y^2}',
        verificationChecklist:
          'هل طبّقت شرطي الاتزان الأفقي والرأسي ثم حسبت المحصلة النهائية مع الوحدة ث.كجم؟',
        commonPitfall: 'الاكتفاء بإيجاد مركبتي المفصل دون حساب مقدار رد الفعل الكلي.'
      }
    ]
  }
];

export const HandwrittenEssayGraderView: React.FC = () => {
  const [activeProblem, setActiveProblem] = useState<EssayRubricProblem>(
    ESSAY_RUBRIC_PROBLEMS[0]
  );
  const [checkedSteps, setCheckedSteps] = useState<number[]>(() =>
    studyPersistenceService.getEssaySelfChecks(ESSAY_RUBRIC_PROBLEMS[0].id)
  );
  const [studentScratchpad, setStudentScratchpad] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<string>('');

  useEffect(() => {
    setCheckedSteps(studyPersistenceService.getEssaySelfChecks(activeProblem.id));
    setSaveMessage('');
  }, [activeProblem.id]);

  const toggleStep = (stepIndex: number) => {
    const next = checkedSteps.includes(stepIndex)
      ? checkedSteps.filter((i) => i !== stepIndex)
      : [...checkedSteps, stepIndex].sort((a, b) => a - b);
    setCheckedSteps(next);

    const res = studyPersistenceService.saveEssaySelfChecks(activeProblem.id, next);
    setSaveMessage(res.ok ? 'تم الحفظ' : res.error || 'تعذر الحفظ المحلي');
  };

  const selfAssessedMarks = activeProblem.rubricSteps.reduce(
    (sum, step, idx) => (checkedSteps.includes(idx) ? sum + step.maxMark : sum),
    0
  );

  return (
    <div className="space-y-6">
      {/* Honest Self-Assessment Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              <span>التقييم الذاتي للأسئلة المقالية وفق معيار المعلم</span>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-slate-900">
              قارن خطوات حلك المكتوبة بمعيار التوزيع المرجعي للمعلم
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              هذا القسم أداة مراجعة ذاتية: اكتب خطواتك في دفترك أو في المسودة أدناه، ثم راجع كل خطوة أمام الحل المرجعي وحدد بنفسك الخطوات التي تحققت في حلك. لا يقوم التطبيق بتصحيح خط اليد آلياً.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-w-[230px] text-center space-y-1 tabular-nums">
            <div className="text-xs text-slate-600 font-semibold">تقييمك الذاتي للخطوات المنجزة</div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {selfAssessedMarks.toFixed(1)} / {activeProblem.totalMarks.toFixed(1)}
            </div>
            {saveMessage && (
              <div className="text-xs font-bold text-emerald-700">{saveMessage}</div>
            )}
          </div>
        </div>

        {/* Problem Switcher */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
          {ESSAY_RUBRIC_PROBLEMS.map((prob) => (
            <button
              key={prob.id}
              type="button"
              onClick={() => setActiveProblem(prob)}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap cursor-pointer ${
                activeProblem.id === prob.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {prob.subjectAr} — {prob.examSession}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Comparison Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Question + Student Notes */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-bold text-blue-700">{activeProblem.subjectAr}</span>
              <span className="tabular-nums font-bold">{activeProblem.totalMarks} درجات مقالية</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 leading-relaxed">
              {activeProblem.questionPrompt}
            </h3>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs">
            <label
              htmlFor="essay-student-notes"
              className="block text-xs font-bold text-slate-800"
            >
              مسودة خطوات حلك للمقارنة (اختياري):
            </label>
            <textarea
              id="essay-student-notes"
              rows={7}
              value={studentScratchpad}
              onChange={(e) => setStudentScratchpad(e.target.value)}
              placeholder="اكتب خطوات حلك أو ملخص المعادلات التي توصلت إليها هنا قبل التحقق من معيار الخطوات..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Teacher-Authored Rubric Checklist */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-700" />
              <span>معايير الخطوات المعتمدة للمقارنة الذاتية:</span>
            </h3>
          </div>

          <div className="space-y-4">
            {activeProblem.rubricSteps.map((step, idx) => {
              const isChecked = checkedSteps.includes(idx);
              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border space-y-3 shadow-xs transition-colors ${
                    isChecked
                      ? 'bg-emerald-50/40 border-emerald-400'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">{step.stepName}</span>
                    <button
                      type="button"
                      onClick={() => toggleStep(idx)}
                      className={`min-h-[40px] px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                        isChecked
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {isChecked ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>متحقق في حلي (+{step.maxMark})</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4" />
                          <span>تأكيد تحقق الخطوة (+{step.maxMark})</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {step.verificationChecklist}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-[11px] font-bold text-blue-800">المرجع الرياضي للخطوة:</div>
                    <div className="py-1">
                      <MathRenderer latex={step.officialAnswerModel} block={true} />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>تنبيه شائع: {step.commonPitfall}</span>
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

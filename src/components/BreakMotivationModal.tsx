import React, { useState } from 'react';
import {
  Coffee,
  Sparkles,
  Brain,
  Repeat,
  FileText,
  Activity,
  X,
  Heart,
  Smile,
  Zap,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { breakGuidances } from '../data/curriculumData';

interface BreakMotivationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BreakMotivationModal: React.FC<BreakMotivationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [breathingPhase, setBreathingPhase] = useState<'شهيق' | 'حبس النفس' | 'زفير' | 'استرخاء'>('شهيق');
  const [breathCount, setBreathCount] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(false);

  // Breathing Box Timer
  React.useEffect(() => {
    let timer: any = null;
    if (isBreathingActive) {
      timer = setInterval(() => {
        setBreathCount((prev) => {
          if (prev > 1) return prev - 1;

          // Transition phase
          setBreathingPhase((current) => {
            if (current === 'شهيق') return 'حبس النفس';
            if (current === 'حبس النفس') return 'زفير';
            if (current === 'زفير') return 'استرخاء';
            return 'شهيق';
          });
          return 4;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isBreathingActive]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                واحة الاستراحة والتحفيز الذهني وطرق المذاكرة المثلى
              </h3>
              <p className="text-xs text-slate-400">
                استراحة بومودورو الذهبية لتجديد طاقة محارب الثانوية العامة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-sm text-slate-200">
          {/* Interactive Breathing Relaxation Widget */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-800/40 text-center space-y-3">
            <div className="text-xs font-bold text-purple-300 flex items-center justify-center gap-1.5">
              <Activity className="w-4 h-4 text-purple-400" />
              تمرين التنفس الصندوقي لخفض التوتر وإعادة شحن التركيز (Box Breathing)
            </div>

            <div className="w-24 h-24 mx-auto rounded-full border-4 border-purple-500/40 flex flex-col items-center justify-center bg-slate-950 shadow-inner">
              <div className="text-xs text-purple-300 font-bold">{breathingPhase}</div>
              <div className="text-2xl font-black text-white font-mono mt-0.5">{breathCount}</div>
            </div>

            <div className="flex justify-center gap-2">
              <button
                onClick={() => setIsBreathingActive(!isBreathingActive)}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                {isBreathingActive ? 'إيقاف التمرين' : 'بدء تمرين التنفس (دقيقة واحدة)'}
              </button>
            </div>
          </div>

          {/* Golden Study Methods Overview */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Brain className="w-4 h-4" />
              أفضل الطرق العلمية المعتمدة للمذاكرة والمراجعة وتلخيص الدروس:
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Method 1 */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-bold text-blue-400 flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5" />
                  1. تقنية فاينمان (The Feynman Technique)
                </div>
                <p className="text-slate-300 leading-relaxed">
                  اشرح المسألة أو القانون لنفسك بصوت مسموع كأنك تشرح لطالب مبتدئ. إذا تلعثمت في خطوة، فذلك هو موضع الخلل الذي يحتاج لمراجعة فورية.
                </p>
              </div>

              {/* Method 2 */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-bold text-emerald-400 flex items-center gap-1">
                  <Repeat className="w-3.5 h-3.5" />
                  2. الاستدعاء النشط (Active Recall)
                </div>
                <p className="text-slate-300 leading-relaxed">
                  أغلق الملخص وحاول كتابة القوانين من ذاكرتك المجردة. القراءة السلبية المتكررة تمنحك إحساساً كاذباً بالفهم، بينما الاستدعاء النشط يرسخها بالامتحان.
                </p>
              </div>

              {/* Method 3 */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-bold text-purple-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  3. التكرار المتباعد (Spaced Repetition)
                </div>
                <p className="text-slate-300 leading-relaxed">
                  راجع الدرس بعد 24 ساعة، ثم بعد 4 أيام، ثم بعد أسبوعين. هذا يكسر منحنى النسيان الطبيعي للدماغ ويجعل المعلومة في الذاكرة طويلة المدى.
                </p>
              </div>

              {/* Method 4 */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-bold text-rose-400 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  4. تلخيص الخرائط وبطاقات القوانين
                </div>
                <p className="text-slate-300 leading-relaxed">
                  لخص كل وحدة في صفحة A4 واحدة تشمل فقط القوانين والخدع والوحدات. استخدم أوراق المكتبة الجاهزة للطباعة كمرجع أساسي.
                </p>
              </div>
            </div>
          </div>

          {/* Motivational Encouragement */}
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200 space-y-2">
            <div className="font-bold text-blue-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              رسالة تحفيزية لوجدانك:
            </div>
            <p className="leading-relaxed">
              "يا بطل.. إن التعب الذي تشعر به اليوم في حل المسائل وساعات السهر هو ذاته الفرح الذي ستعيشه يوم إعلان النتيجة وأنت ترى اسمك في قائمة كليات القمة والهندسة. كل خطوة وكل مسألة تتدرب عليها الآن تقربك من حلمك. خذ نفساً عميقاً وارجع بكل قوة!"
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-md"
          >
            جاهز ومتحمس لاستكمال الجدول الدراسي 🚀
          </button>
        </div>
      </div>
    </div>
  );
};

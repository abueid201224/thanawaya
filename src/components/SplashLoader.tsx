import React from 'react';
import { Sparkles, Calculator, BookOpen, ShieldCheck } from 'lucide-react';

interface SplashLoaderProps {
  message?: string;
}

export const SplashLoader: React.FC<SplashLoaderProps> = ({
  message = 'جاري التحقق من الجلسة المحفوظة والمزامنة السحابية...'
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col items-center justify-center p-6 select-none" dir="rtl">
      {/* Background radial gradient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900/80 to-slate-950 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Animated Brand Emblem */}
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-2xl shadow-blue-500/30 ring-4 ring-white/10">
            <Calculator className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md ring-2 ring-slate-900">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Title and Badge */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>منظومة الثانوية العامة علمي رياضة ٢٠٢٦ / ٢٠٢٧</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Thanaweya Amma Math Copilot
          </h1>
          <p className="text-xs text-slate-400">
            المساعد الذكي المتكامل للرياضيات البحتة والتطبيقية
          </p>
        </div>

        {/* Loading Spinner & Progress Line */}
        <div className="w-full max-w-xs space-y-3 pt-4">
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full animate-pulse w-3/4 mx-auto" />
          </div>
          <p className="text-xs text-slate-300 font-medium">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SplashLoader;

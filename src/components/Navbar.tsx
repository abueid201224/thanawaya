import React from 'react';
import {
  Cpu,
  ShieldCheck,
  Activity,
  Download,
  KeyRound,
  BookOpen
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface NavbarProps {
  user: UserProfile;
  onOpenAuth: () => void;
  onSwitchRole: (newRole: UserRole) => void;
  activeTab: string;
  onOpenDiagnostics?: () => void;
  onOpenDocumentExport?: () => void;
  onOpenApiKeySettings?: () => void;
  onOpenPracticeHub?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAuth,
  onSwitchRole,
  onOpenDiagnostics,
  onOpenDocumentExport,
  onOpenApiKeySettings,
  onOpenPracticeHub
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-50 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-blue-500/20 ring-2 ring-blue-500/10">
          <Cpu className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg lg:text-xl font-bold tracking-tight text-slate-900">
              منظومة المخطط الذكي للثانوية العامة
            </h1>
            <span className="text-xs text-blue-700 font-semibold">
              • علمي رياضة ٢٠٢٦ / ٢٠٢٧
            </span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
            <span>حفظ محلي آمن</span>
            <span>•</span>
            <span>تدريب مراجَع</span>
            <span>•</span>
            <span>دفتر أخطاء ومراجعة متباعدة</span>
          </p>
        </div>
      </div>

      {/* Controls & Profile */}
      <div className="flex items-center flex-wrap gap-2">
        {onOpenPracticeHub && (
          <button
            type="button"
            onClick={onOpenPracticeHub}
            className="min-h-[40px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>حلقة التدريب ودفتر الأخطاء</span>
          </button>
        )}

        {onOpenDocumentExport && (
          <button
            type="button"
            onClick={onOpenDocumentExport}
            className="min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            title="تصدير إلى PDF ثم إتاحة الطباعة المعيارية A4 لكافة المواد (Ctrl+P)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>تصدير PDF / A4</span>
          </button>
        )}

        {onOpenDiagnostics && (
          <button
            type="button"
            onClick={onOpenDiagnostics}
            className="min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            title="فحص وتشخيص تشغيل الصوت والفيديو والويب والطباعة داخل التطبيق"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-700" />
            <span>فحص الخدمات</span>
          </button>
        )}

        {onOpenApiKeySettings && (
          <button
            type="button"
            onClick={onOpenApiKeySettings}
            className="min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            title="إدارة وتشفير مفتاح الذكاء الاصطناعي بحماية Windows DPAPI"
          >
            <KeyRound className="w-3.5 h-3.5 text-blue-700" />
            <span>أمان المفتاح</span>
          </button>
        )}

        {/* Role Selector */}
        <button
          type="button"
          onClick={() => onSwitchRole(user.role === 'student' ? 'admin' : 'student')}
          className={`min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
            user.role === 'admin'
              ? 'bg-violet-50 border-violet-200 text-violet-800 hover:bg-violet-100'
              : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
          }`}
          title="التبديل بين عرض الطالب وعرض المشرف"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{user.role === 'admin' ? 'وضع المشرف' : 'وضع الطالب'}</span>
        </button>

        {/* User Profile Button */}
        <button
          type="button"
          onClick={onOpenAuth}
          className="min-h-[40px] flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-all cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] border border-blue-200">
            {user.name.charAt(0)}
          </div>
          <div className="text-right hidden sm:block">
            <div className="font-bold text-slate-800 leading-tight">{user.name}</div>
          </div>
        </button>
      </div>
    </header>
  );
};

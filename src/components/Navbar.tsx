import React from 'react';
import {
  Cpu,
  Flame,
  ShieldCheck,
  User,
  LogOut,
  Award,
  Calendar,
  CheckCircle2,
  Lock,
  ChevronDown,
  Activity,
  Printer,
  Download
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface NavbarProps {
  user: UserProfile;
  onOpenAuth: () => void;
  onSwitchRole: (newRole: UserRole) => void;
  activeTab: string;
  onOpenDiagnostics?: () => void;
  onOpenDocumentExport?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAuth,
  onSwitchRole,
  activeTab,
  onOpenDiagnostics,
  onOpenDocumentExport
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
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold">
              علمي رياضة ٢٠٢٦ / ٢٠٢٧
            </span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
            <span>مخطط دراسي يومي مرن</span>
            <span>•</span>
            <span>مكتبة وسائط قابلة للطباعة</span>
            <span>•</span>
            <span>معلم ذكي موجه بالأولويات ونقاط الامتحان</span>
          </p>
        </div>
      </div>

      {/* Metrics, Diagnostics, Role Switcher & Profile */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Document Export Button */}
        {onOpenDocumentExport && (
          <button
            onClick={onOpenDocumentExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="تصدير إلى PDF ثم إتاحة الطباعة المعيارية A4 لكافة المواد (Ctrl+P)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>تصدير PDF / A4</span>
          </button>
        )}

        {/* Live Diagnostics & Health Test Button */}
        {onOpenDiagnostics && (
          <button
            onClick={onOpenDiagnostics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="فحص وتشخيص تشغيل الصوت والفيديو والويب والطباعة داخل التطبيق"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-600" />
            <span>فحص الخدمات 🛠️</span>
          </button>
        )}

        {/* Streak Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-xs">
          <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
          <span>ستريك: {user.dailyStreak} يوماً 🔥</span>
        </div>

        {/* Discipline Score */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
          <Award className="w-4 h-4 text-emerald-600" />
          <span>انضباط: {user.disciplineScore}%</span>
        </div>

        {/* RBAC Role Selector */}
        <div className="relative group">
          <button
            onClick={() => onSwitchRole(user.role === 'student' ? 'admin' : 'student')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs ${
              user.role === 'admin'
                ? 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100'
                : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
            }`}
            title="انقر للتبديل بين وضع الطالب وصلاحيات المشرف العام (RBAC)"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{user.role === 'admin' ? 'مشرف (Admin)' : 'طالب (Student)'}</span>
          </button>
        </div>

        {/* User Profile Button */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-all cursor-pointer shadow-xs"
        >
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] border border-blue-200">
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


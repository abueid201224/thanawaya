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
  Printer
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
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-50 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/20">
          <Cpu className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg lg:text-xl font-bold tracking-tight bg-gradient-to-l from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              منظومة المخطط الذكي للثانوية العامة
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono font-medium">
              علمي رياضة ٢٠٢٦ / ٢٠٢٧
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
            title="مركز تصدير المستندات والطباعة A4"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">تصدير A4</span>
          </button>
        )}

        {/* Live Diagnostics & Health Test Button */}
        {onOpenDiagnostics && (
          <button
            onClick={onOpenDiagnostics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
            title="فحص وتشخيص تشغيل الصوت والفيديو والويب والطباعة داخل التطبيق"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>فحص الخدمات 🛠️</span>
          </button>
        )}

        {/* Streak Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-bold shadow-inner">
          <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce" />
          <span>ستريك: {user.dailyStreak} يوماً 🔥</span>
        </div>

        {/* Discipline Score */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold">
          <Award className="w-4 h-4 text-emerald-400" />
          <span>انضباط: {user.disciplineScore}%</span>
        </div>

        {/* RBAC Role Selector */}
        <div className="relative group">
          <button
            onClick={() => onSwitchRole(user.role === 'student' ? 'admin' : 'student')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              user.role === 'admin'
                ? 'bg-purple-950/40 border-purple-500/50 text-purple-300 hover:bg-purple-900/50'
                : 'bg-blue-950/40 border-blue-500/50 text-blue-300 hover:bg-blue-900/50'
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
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium transition-all cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold text-[11px] border border-blue-500/40">
            {user.name.charAt(0)}
          </div>
          <div className="text-right hidden sm:block">
            <div className="font-semibold text-white leading-tight">{user.name}</div>
          </div>
        </button>
      </div>
    </header>
  );
};


import React, { useState, useEffect } from 'react';
import {
  Calendar,
  BookOpen,
  FastForward,
  FileCheck2,
  Printer,
  MessageSquare,
  MessageCircle,
  Award,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Zap,
  CheckCircle2,
  Compass,
  Activity,
  Wifi,
  WifiOff,
  Layers,
  Brain,
  Terminal,
  Code2,
  Download
} from 'lucide-react';
import { UserRole } from '../types';
import { offlineStorage } from '../services/offlineStorage';

export type ActiveNavService =
  | 'planner'
  | 'curriculum'
  | 'skip_exam'
  | 'monthly_exams'
  | 'heatmap'
  | 'concepts_booklet'
  | 'essay_grader'
  | 'grapher'
  | 'library'
  | 'coding_buddy'
  | 'whatsapp_hub'
  | 'tutor'
  | 'progress'
  | 'admin';

interface SidebarNavProps {
  activeService: ActiveNavService;
  onSelectService: (service: ActiveNavService) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userRole: UserRole;
  pendingScoutCount: number;
  onOpenOfflineSync: () => void;
  onOpenDiagnostics?: () => void;
  onOpenDocumentExport?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeService,
  onSelectService,
  isCollapsed,
  onToggleCollapse,
  userRole,
  pendingScoutCount,
  onOpenOfflineSync,
  onOpenDiagnostics,
  onOpenDocumentExport
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const navItems = [
    {
      id: 'planner' as ActiveNavService,
      label: 'المخطط والجدول اليومي',
      icon: Calendar,
      badge: 'مرن',
      desc: 'إدارة مواعيد الحصص وجلسات المذاكرة'
    },
    {
      id: 'curriculum' as ActiveNavService,
      label: 'مكتبة المناهج والتدريبات',
      icon: BookOpen,
      badge: 'محلية',
      desc: 'فهرس الوحدات وتدريبات نواتج التعلم'
    },
    {
      id: 'skip_exam' as ActiveNavService,
      label: 'اختبارات التخطي والإتقان',
      icon: FastForward,
      badge: 'ذكي',
      highlight: true,
      desc: 'تخطي ما درسته مسبقاً باختبار تقييمي'
    },
    {
      id: 'monthly_exams' as ActiveNavService,
      label: 'الامتحانات الشهرية والشاملة',
      icon: FileCheck2,
      badge: 'أكتوبر - يوليو',
      desc: 'محاكاة البابل شيت والمقالي'
    },
    {
      id: 'heatmap' as ActiveNavService,
      label: 'خريطة الحرارة والتقييم التنبؤي',
      icon: Activity,
      badge: 'تنبؤي',
      highlight: true,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
      desc: 'تشخيص نقاط الضعف وتوقع المجموع'
    },
    {
      id: 'concepts_booklet' as ActiveNavService,
      label: 'كتيب المفاهيم والقوانين',
      icon: Layers,
      badge: 'وزاري',
      highlight: true,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      desc: 'القوانين الرسمية المعتمدة في اللجان'
    },
    {
      id: 'essay_grader' as ActiveNavService,
      label: 'مصحح المقالي وخط اليد',
      icon: Brain,
      badge: 'Vision',
      highlight: true,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      desc: 'تصحيح خطوات الأسئلة المقالية وباريم الوزارة'
    },
    {
      id: 'grapher' as ActiveNavService,
      label: 'الراسم الهندسي والبياني',
      icon: Compass,
      badge: 'محاكاة',
      desc: 'منحنيات التفاضل ومخططات القوى الحرة'
    },
    {
      id: 'library' as ActiveNavService,
      label: 'الملخصات المطبوعة والوسائط',
      icon: Printer,
      badge: 'A4',
      desc: 'كبسولات القوانين الجاهزة للطباعة'
    },
    {
      id: 'coding_buddy' as ActiveNavService,
      label: 'كود كوتش وتريكات البرمجة',
      icon: Terminal,
      badge: 'تريكات & AI',
      highlight: true,
      badgeColor: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
      desc: 'أسرار بايثون وألغاز كود خفيفة وماتريال شاملة'
    },
    {
      id: 'whatsapp_hub' as ActiveNavService,
      label: 'منصات الواتساب ومكتبة الحصص',
      icon: MessageCircle,
      badge: 'جديد 📲',
      highlight: true,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      desc: 'ربط أرقام المدرسين، مسارات التنزيل، والجدولة الشهرية'
    },
    {
      id: 'tutor' as ActiveNavService,
      label: 'المعلم الذكي ونقاط الامتحان',
      icon: MessageSquare,
      badge: 'AI',
      desc: 'توجيه سقالي وأسئلة وزارية مكررة'
    },
    {
      id: 'progress' as ActiveNavService,
      label: 'سجل التقدم ومؤشر الانضباط',
      icon: Award,
      badge: 'ستريك',
      desc: 'متابعة نواتج التعلم وساعات المذاكرة'
    },
    {
      id: 'admin' as ActiveNavService,
      label: 'كشاف المواقع ولوحة المشرف',
      icon: ShieldCheck,
      badge: pendingScoutCount > 0 ? `${pendingScoutCount}` : 'RBAC',
      badgeColor: pendingScoutCount > 0 ? 'bg-amber-500 text-black' : 'bg-purple-500/20 text-purple-300',
      desc: 'اعتماد روابط moe.gov.eg و ekb.eg'
    }
  ];

  return (
    <aside
      className={`border-l border-slate-200 bg-white flex flex-col justify-between transition-all duration-300 ease-in-out z-40 select-none shadow-xs ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Sidebar Header with Collapse Button */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-bold text-slate-800 tracking-wider">
                قائمة الخدمات والأنظمة
              </span>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer mx-auto shadow-xs"
            title={isCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية لتقليل الازدحام'}
          >
            {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeService === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectService(item.id)}
                className={`w-full text-right flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer relative group ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-xs shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                } ${item.highlight && !isActive ? 'border border-amber-200 bg-amber-50 text-amber-900' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute right-0 top-2 bottom-2 w-1.5 bg-white rounded-l-full" />
                )}

                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.highlight
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0 pr-1 text-right">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs truncate font-bold">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : item.badgeColor || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal truncate mt-0.5">
                      {item.desc}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer / Fast Track Banner & Offline PWA Sync Status */}
      {!isCollapsed && (
        <div className="p-3 m-3 space-y-2 border-t border-slate-100">
          {/* Quick Tools: Diagnostics & Export */}
          <div className="grid grid-cols-2 gap-1.5">
            {onOpenDiagnostics && (
              <button
                onClick={onOpenDiagnostics}
                className="p-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                title="فحص واختبار الصوت والفيديو والويب"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-600" />
                <span>فحص الخدمات</span>
              </button>
            )}
            {onOpenDocumentExport && (
              <button
                onClick={onOpenDocumentExport}
                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                title="تصدير إلى PDF ثم إتاحة الطباعة المعيارية A4 لكافة المواد (Ctrl+P)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>تصدير PDF</span>
              </button>
            )}
          </div>

          {/* Offline / Online Sync Indicator */}
          <button
            onClick={onOpenOfflineSync}
            className="w-full text-right p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-[11px] transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-700 font-bold group-hover:text-blue-700 transition-colors">متصل بالمزامنة السحابية</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-amber-800 font-bold">وضع دون اتصال (PWA)</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">IndexedDB ⚙️</span>
          </button>

          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-right space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>خاصية التخطي الذكي</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              هل ذاكرت درساً مسبقاً؟ خض اختبار التخطي لتوفير وقتك والتركيز على نقاط الضعف فقط!
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};

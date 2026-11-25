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
  Compass,
  Activity,
  Wifi,
  WifiOff,
  Layers,
  Brain,
  Terminal,
  Download,
  BookmarkCheck
} from 'lucide-react';
import { UserRole } from '../types';

export type ActiveNavService =
  | 'planner'
  | 'practice_hub'
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

  const navItems: Array<{
    id: ActiveNavService;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    desc: string;
    countLabel?: string;
  }> = [
    {
      id: 'practice_hub',
      label: 'حلقة التدريب ودفتر الأخطاء',
      icon: BookmarkCheck,
      desc: 'تدريب موجّه، دفتر الأخطاء، مراجعة متباعدة'
    },
    {
      id: 'planner',
      label: 'المخطط والجدول اليومي',
      icon: Calendar,
      desc: 'إدارة مواعيد الحصص وجلسات المذاكرة'
    },
    {
      id: 'curriculum',
      label: 'مكتبة المناهج والتدريبات',
      icon: BookOpen,
      desc: 'فهرس الوحدات ونواتج التعلم المراجَعة'
    },
    {
      id: 'skip_exam',
      label: 'اختبارات التخطي والإتقان',
      icon: FastForward,
      desc: 'تقييم إتقان الوحدة قبل الانتقال'
    },
    {
      id: 'monthly_exams',
      label: 'الاختبارات الشهرية التقييمية',
      icon: FileCheck2,
      desc: 'وضع الاختبار بدون تلميحات حتى التسليم'
    },
    {
      id: 'heatmap',
      label: 'تحليل المحاولات والأخطاء',
      icon: Activity,
      desc: 'ملخص الأداء الفعلي من المحاولات المسجلة'
    },
    {
      id: 'concepts_booklet',
      label: 'كتيب المفاهيم والقوانين',
      icon: Layers,
      desc: 'القوانين المرجعية الأساسية'
    },
    {
      id: 'essay_grader',
      label: 'التقييم الذاتي للمقالي',
      icon: Brain,
      desc: 'مقارنة خطواتك بمعيار المعلم المرجعي'
    },
    {
      id: 'grapher',
      label: 'الراسم الهندسي والبياني',
      icon: Compass,
      desc: 'منحنيات التفاضل ومخططات القوى'
    },
    {
      id: 'library',
      label: 'الملخصات المطبوعة والوسائط',
      icon: Printer,
      desc: 'كبسولات القوانين الجاهزة للطباعة A4'
    },
    {
      id: 'coding_buddy',
      label: 'مساعد البرمجة والتطبيقات',
      icon: Terminal,
      desc: 'مفاهيم بايثون والربط بالرياضيات'
    },
    {
      id: 'whatsapp_hub',
      label: 'منصات الواتساب ومكتبة الحصص',
      icon: MessageCircle,
      desc: 'تنظيم الحصص والجدولة الشهرية'
    },
    {
      id: 'tutor',
      label: 'المعلم المساعد والتوجيه',
      icon: MessageSquare,
      desc: 'توجيه سقالي ونقاط المراجعة'
    },
    {
      id: 'progress',
      label: 'سجل التقدم الفعلي',
      icon: Award,
      desc: 'متابعة المحاولات والوحدات المنجزة'
    },
    {
      id: 'admin',
      label: 'كشاف المواقع ولوحة المشرف',
      icon: ShieldCheck,
      countLabel: pendingScoutCount > 0 ? `${pendingScoutCount}` : undefined,
      desc: 'مراجعة المصادر واعتمادها'
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
            type="button"
            onClick={onToggleCollapse}
            className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer mx-auto shadow-xs flex items-center justify-center"
            title={isCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
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
                type="button"
                onClick={() => onSelectService(item.id)}
                className={`w-full min-h-[44px] text-right flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0 pr-1 text-right">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs truncate font-bold">{item.label}</span>
                      {item.countLabel && (
                        <span
                          className={`text-[11px] font-bold font-mono tabular-nums ${
                            isActive ? 'text-white' : 'text-amber-700'
                          }`}
                        >
                          ({item.countLabel})
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[10px] truncate mt-0.5 ${
                        isActive ? 'text-blue-100' : 'text-slate-500'
                      }`}
                    >
                      {item.desc}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Tools & Connection State */}
      {!isCollapsed && (
        <div className="p-3 m-3 space-y-2 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-1.5">
            {onOpenDiagnostics && (
              <button
                type="button"
                onClick={onOpenDiagnostics}
                className="min-h-[40px] p-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-700" />
                <span>فحص الخدمات</span>
              </button>
            )}
            {onOpenDocumentExport && (
              <button
                type="button"
                onClick={onOpenDocumentExport}
                className="min-h-[40px] p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>تصدير PDF</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenOfflineSync}
            className="w-full min-h-[40px] text-right p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-[11px] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-slate-800 font-bold">متصل بالشبكة</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                  <span className="text-amber-900 font-bold">وضع دون اتصال</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">تخزين محلي</span>
          </button>
        </div>
      )}
    </aside>
  );
};

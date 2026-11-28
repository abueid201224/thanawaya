import React, { useState, useEffect, useCallback } from 'react';
import {
  Wifi,
  WifiOff,
  Download,
  Database,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  X,
  Sparkles,
  CloudUpload
} from 'lucide-react';
import { offlineStorage } from '../services/offlineStorage';
import { initialCurriculumUnits, initialMonthlyExams } from '../data/fullCurriculumData';
import { OFFICIAL_BOOKLET_PAGES } from '../data/conceptBookletPages';
import { getReviewedUnitsForStudent, getReviewedExamsForStudent } from '../services/contentGate';
import { hybridSyncService } from '../services/hybridSyncService';

interface OfflineSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  cachedResourcesCount: number;
}

export const OfflineSyncModal: React.FC<OfflineSyncModalProps> = ({
  isOpen,
  onClose,
  cachedResourcesCount
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [outboxPendingCount, setOutboxPendingCount] = useState<number>(0);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [manualSyncMessage, setManualSyncMessage] = useState<string>('');

  const refreshOutboxCount = useCallback(async () => {
    try {
      const electronDb =
        typeof window !== 'undefined' ? window.electronAPI?.studyDb : undefined;
      if (electronDb?.getOutbox) {
        const res = await electronDb.getOutbox(50);
        if (res?.ok && res.stats) {
          setOutboxPendingCount(res.stats.pendingCount);
          return;
        }
      }
      if (
        typeof fetch === 'function' &&
        typeof window !== 'undefined' &&
        window.location?.protocol?.startsWith('http')
      ) {
        const res = await fetch('/api/study/sync-outbox?limit=50');
        const ct = res.headers?.get?.('content-type') || '';
        if (res.ok && ct.toLowerCase().includes('application/json')) {
          const data = await res.json();
          if (data?.ok && data.stats) {
            setOutboxPendingCount(Number(data.stats.pendingCount || 0));
            return;
          }
        }
      }
    } catch {
      // Fallback safely to browser pending queue count
    }
    setOutboxPendingCount(0);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setManualSyncMessage('');
    void refreshOutboxCount();
  }, [isOpen, refreshOutboxCount]);

  if (!isOpen) return null;

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const pendingSyncCount = Math.max(outboxPendingCount, offlineStorage.getPendingSyncCount());
  const reviewedUnits = getReviewedUnitsForStudent(initialCurriculumUnits);
  const reviewedExams = getReviewedExamsForStudent(initialMonthlyExams);

  const handleManualSyncNow = async () => {
    setIsManualSyncing(true);
    setManualSyncMessage('');
    try {
      const report = await hybridSyncService.syncNow();
      setOutboxPendingCount(report.pendingCount);
      if (report.offline) {
        setManualSyncMessage('لا يوجد اتصال بالإنترنت حالياً — محفوظة بأمان في صندوق الصادر المحلي.');
      } else if (report.unauthenticated) {
        setManualSyncMessage(
          `الحفظ المحلي مكتمل (${report.pendingCount} بانتظار تسجيل الدخول للمزامنة السحابية).`
        );
      } else if (report.ok) {
        setManualSyncMessage(`اكتملت المزامنة بنجاح (${report.syncedCount} عنصر).`);
      } else {
        setManualSyncMessage(
          `تمت مزامنة ${report.syncedCount} عنصر وتعذر ${report.failedCount} (ستُعاد المحاولة تلقائياً).`
        );
      }
    } catch {
      setManualSyncMessage('تعذر إتمام دورة المزامنة الآن — ستتم إعادة المحاولة تلقائياً.');
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleDownloadFullOfflinePack = async () => {
    setIsSyncing(true);
    try {
      await offlineStorage.setItem(
        'full_curriculum_pack_v1',
        {
          status: 'cached',
          downloadDate: new Date().toISOString(),
          unitsCount: reviewedUnits.length,
          examsCount: reviewedExams.length,
          bookletPagesCount: OFFICIAL_BOOKLET_PAGES.length,
          units: reviewedUnits,
          exams: reviewedExams
        },
        'curriculum'
      );
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportBackup = () => {
    const readJson = (key: string) => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };

    const backupData = {
      app: 'Thanaweya Amma Math Copilot',
      version: '2.1',
      exportedAt: new Date().toISOString(),
      studentSchedule: readJson('thanaweya_schedule_v1') || [],
      curriculumUnitsState: readJson('thanaweya_units_state_v1') || [],
      monthlyExamsState: readJson('thanaweya_exams_state_v1') || [],
      subjectProgress: readJson('thanaweya_subject_progress_v1') || [],
      studyAttempts: readJson('thanaweya_study_attempts_v1') || [],
      mistakeNotebook: readJson('thanaweya_mistake_notebook_v1') || [],
      spacedIntervals: readJson('thanaweya_spaced_intervals_v1') || [1, 3, 7, 14],
      indexedDBCacheStatus: 'active'
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thanaweya_math_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">إدارة التخزين المحلي والعمل دون اتصال (SQLite & PWA)</h3>
              <div className="flex items-center gap-2 text-xs mt-0.5">
                {isOnline ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <Wifi className="w-3.5 h-3.5" />
                    <span>متصل بالإنترنت والمزامنة التلقائية مفعّلة</span>
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1 font-semibold">
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>وضع العمل دون اتصال مفعّل تلقائياً</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Storage Status Cards */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400">الملفات المخزنة محلياً:</span>
            <div className="text-xl font-black text-cyan-400 font-mono">
              {cachedResourcesCount + OFFICIAL_BOOKLET_PAGES.length + reviewedUnits.length} عنصر
            </div>
            <span className="text-[10px] text-slate-500">مذكرات A4 وكتيب المفاهيم والوحدات المراجعة</span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">في صندوق الصادر (Outbox):</span>
              <button
                type="button"
                onClick={handleManualSyncNow}
                disabled={isManualSyncing}
                className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>{isManualSyncing ? 'جاري...' : 'مزامنة الآن'}</span>
              </button>
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono">
              {pendingSyncCount} مهام
            </div>
            <span className="text-[10px] text-slate-500">تتم المزامنة مع التراجع الأسي فور الاتصال</span>
          </div>
        </div>

        {manualSyncMessage && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-cyan-200 font-medium">
            {manualSyncMessage}
          </div>
        )}

        {/* Offline Pack Action */}
        <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>تحميل الحزمة الشاملة للدراسة دون إنترنت:</span>
            </span>
            {downloadSuccess && (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تم التنزيل بنجاح!</span>
              </span>
            )}
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            تتيح لك مذاكرة جميع الوحدات، استعراض كتيب المفاهيم، حل تدريبات الامتحانات، وطباعة الملخصات دون الحاجة لأي اتصال بالإنترنت في لجان المذاكرة والمنازل.
          </p>
          <button
            onClick={handleDownloadFullOfflinePack}
            disabled={isSyncing}
            className="w-full mt-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-cyan-600/30"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري حفظ البيانات في IndexedDB...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>تنزيل كامل الحزمة للاستخدام دون إنترنت</span>
              </>
            )}
          </button>
        </div>

        {/* Backup / Export Section */}
        <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-blue-400" />
              <span>نسخ احتياطي للتقدم والمخطط:</span>
            </div>
            <p className="text-[11px] text-slate-400">تصدير ملف JSON يحتوي على جدولك ودرجاتك الحالية</p>
          </div>
          <button
            onClick={handleExportBackup}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-700"
          >
            تصدير Backup
          </button>
        </div>
      </div>
    </div>
  );
};


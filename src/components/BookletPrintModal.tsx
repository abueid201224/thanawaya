import React, { useState } from 'react';
import {
  Printer,
  X,
  FileText,
  Check,
  Sparkles,
  Layers,
  BookOpen,
  User,
  ShieldCheck,
  Eye,
  Download,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { PrintSettings } from './BookletStandardPrintDocument';

interface BookletPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPageNumber: number;
  currentPageTitle?: string;
  onConfirmPrint: (settings: PrintSettings, mode?: 'pdf_download' | 'print') => void;
}

export const BookletPrintModal: React.FC<BookletPrintModalProps> = ({
  isOpen,
  onClose,
  currentPageNumber,
  currentPageTitle = 'الصفحة الحالية',
  onConfirmPrint
}) => {
  const [scope, setScope] = useState<PrintSettings['scope']>('current');
  const [includeHighlights, setIncludeHighlights] = useState<boolean>(true);
  const [includeStickyNotes, setIncludeStickyNotes] = useState<boolean>(true);
  const [includeStudentInfo, setIncludeStudentInfo] = useState<boolean>(true);
  const [studentName, setStudentName] = useState<string>('');
  const [seatingNumber, setSeatingNumber] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('');
  const [includeOfficialSeal, setIncludeOfficialSeal] = useState<boolean>(true);

  // Keyboard navigation: Esc to close, Ctrl+Enter to trigger export
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        onConfirmPrint(getSettings(), 'pdf_download');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getSettings = (): PrintSettings => ({
    scope,
    currentPageNumber,
    includeHighlights,
    includeStickyNotes,
    includeStudentInfo,
    studentName: studentName.trim() || undefined,
    seatingNumber: seatingNumber.trim() || undefined,
    schoolName: schoolName.trim() || undefined,
    includeOfficialSeal
  });

  const handleStartPdfExport = () => {
    onConfirmPrint(getSettings(), 'pdf_download');
  };

  const handleStartPrint = () => {
    onConfirmPrint(getSettings(), 'print');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-950/60 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>أداة تصدير وطباعة كتيب المفاهيم (A4 PDF)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  معايير الوزارة
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                توليد ملف PDF عالي الدقة بتنسيق A4 القياسي مع تنسيقات الطباعة المعرفة في index.css
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق النافذة (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Settings */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* 1. Page Selection Scope */}
          <div className="space-y-3">
            <label className="font-bold text-slate-200 flex items-center gap-2 text-xs">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>نطاق الصفحات المراد طباعتها:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: 'current',
                  title: `الصفحة الحالية فقط (ص ${currentPageNumber})`,
                  subtitle: currentPageTitle
                },
                {
                  id: 'all',
                  title: 'الكتيب كاملاً (10 صفحات معتمدة)',
                  subtitle: 'النسخة الكاملة للثانوية العامة'
                },
                {
                  id: 'calculus',
                  title: 'فرع التفاضل والتكامل',
                  subtitle: 'صفحات 2 و 3 (قواعد الاشتقاق والتكامل)'
                },
                {
                  id: 'statics',
                  title: 'فرع الاستاتيكا',
                  subtitle: 'صفحات 4 و 5 (الاحتكاك، العزوم، والاتزان)'
                },
                {
                  id: 'dynamics',
                  title: 'فرع الديناميكا',
                  subtitle: 'صفحات 6 و 7 (المتجهات، نيوتن، والقدرة)'
                },
                {
                  id: 'algebra_geo',
                  title: 'الجبر والهندسة الفراغية',
                  subtitle: 'صفحات 8 و 9 (ذات الحدين والمستوى في الفراغ)'
                },
                {
                  id: 'appendix',
                  title: 'ملحق القوانين التراكمية (ص 10)',
                  subtitle: 'المساحات والحجوم والمحيطات المستمرة'
                },
                {
                  id: 'cards',
                  title: 'بنك بطاقات القوانين السريعة',
                  subtitle: 'بطاقات التلخيص مع نصائح الموجهين'
                }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setScope(item.id as any)}
                  className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                    scope === item.id
                      ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{item.title}</span>
                    {scope === item.id && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1">{item.subtitle}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Annotations & Highlights inclusion */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <label className="font-bold text-slate-200 flex items-center gap-2 text-xs">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>خيارات طبقة الملاحظات والتظليلات:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={includeHighlights}
                  onChange={(e) => setIncludeHighlights(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-700 bg-slate-900"
                />
                <div>
                  <div className="font-bold text-slate-200">تضمين التظليلات الفسفورية</div>
                  <div className="text-[11px] text-slate-400">
                    طباعة نصوص القوانين المظللة بألوان الباستيل القياسية المقروءة.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={includeStickyNotes}
                  onChange={(e) => setIncludeStickyNotes(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-700 bg-slate-900"
                />
                <div>
                  <div className="font-bold text-slate-200">تضمين الملاحظات اللاصقة (Sticky Notes)</div>
                  <div className="text-[11px] text-slate-400">
                    طباعة بطاقات الملاحظات وتنبيهات الفخاخ في هامش الصفحة.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 3. Student Identification Header (Optional) */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-200 flex items-center gap-2 text-xs">
                <User className="w-4 h-4 text-cyan-400" />
                <span>بيانات الطالب ورقم الجلوس في ترويسة الصفحة:</span>
              </label>
              <input
                type="checkbox"
                checked={includeStudentInfo}
                onChange={(e) => setIncludeStudentInfo(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-700 bg-slate-900"
              />
            </div>

            {includeStudentInfo && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 animate-in fade-in">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">اسم الطالب:</span>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="مثال: أحمد محمد علي"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">رقم الجلوس:</span>
                  <input
                    type="text"
                    value={seatingNumber}
                    onChange={(e) => setSeatingNumber(e.target.value)}
                    placeholder="مثال: 712345"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">المدرسة / الإدارة:</span>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="مثال: المتفوقين للعلوم والتكنولوجيا"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Official Seal & Watermark */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="font-bold text-slate-200">الترويسة الرسمية والعلامة المائية المعتمدة</div>
                <div className="text-[11px] text-slate-400">
                  تضمين شعار جمهورية مصر العربية وباركود لجان الامتحان.
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={includeOfficialSeal}
              onChange={(e) => setIncludeOfficialSeal(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-700 bg-slate-900"
            />
          </div>

          {/* Quick Print Tip */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-200 space-y-1">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>نصيحة للحصول على أفضل ملف PDF عالي الجودة:</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              عند فتح نافذة الطباعة الخاصة بالمتصفح، اختر الوجهة <strong>«حفظ بتنسيق PDF (Save as PDF)»</strong>، وتأكد من تحديد حجم الورق <strong>A4</strong> وتفعيل خيار <strong>«رسومات الخلفية (Background graphics)»</strong> للحفاظ على إطارات القوانين وألوان التظليل.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer text-xs font-medium"
          >
            إلغاء
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartPdfExport}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/30"
              title="تصدير وتنزيل ملف PDF حقيقي للكتيب (Ctrl+P)"
            >
              <Download className="w-4 h-4" />
              <span>تصدير إلى PDF فوري (Ctrl+P) 📥</span>
            </button>

            <button
              onClick={handleStartPrint}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              title="إتاحة الطباعة المعيارية A4 مع خيار الحفظ كـ PDF"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>إتاحة الطباعة المعيارية 🖨️</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

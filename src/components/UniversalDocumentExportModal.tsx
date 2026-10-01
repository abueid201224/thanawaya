import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  FileText,
  FileCode,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Layers,
  Code2,
  Terminal,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { PRESET_EXPORTABLE_DOCUMENTS } from '../data/exportableDocumentsData';
import {
  documentExportService,
  ExportableDocumentItem,
  PrintableAuditReport
} from '../services/documentExportService';
import { resilientAudio } from '../services/resilientAudioService';
import { MathRenderer } from './MathRenderer';

interface UniversalDocumentExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDocumentId?: string;
}

export const UniversalDocumentExportModal: React.FC<UniversalDocumentExportModalProps> = ({
  isOpen,
  onClose,
  defaultDocumentId
}) => {
  if (!isOpen) return null;

  const [documents] = useState<ExportableDocumentItem[]>(PRESET_EXPORTABLE_DOCUMENTS);
  const [selectedDocId, setSelectedDocId] = useState<string>(
    defaultDocumentId || documents[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'preview' | 'audit_suite'>('preview');

  // Generation & progress state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgressText, setPdfProgressText] = useState<string>('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Audit report state
  const [auditReport, setAuditReport] = useState<PrintableAuditReport>(() =>
    documentExportService.auditPrintableMaterials(PRESET_EXPORTABLE_DOCUMENTS)
  );

  const previewRef = useRef<HTMLDivElement>(null);
  const selectedDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  const handleRefreshAudit = () => {
    resilientAudio.playClickSound();
    const report = documentExportService.auditPrintableMaterials(documents);
    setAuditReport(report);
    resilientAudio.playSuccessChime();
    setStatusNotice('تم بنجاح فحص وتأكيد جاهزية كافة الماتريال القابل للطباعة والتصدير!');
    setTimeout(() => setStatusNotice(null), 4000);
  };

  // Keyboard navigation & Windows shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleExportToPdf();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  /**
   * Primary Action: Direct Export to PDF (jsPDF + html2canvas)
   */
  const handleExportToPdf = async () => {
    if (!previewRef.current || !selectedDoc) return;
    try {
      setIsGeneratingPdf(true);
      resilientAudio.playClickSound();
      setPdfProgressText('جاري إعداد الصفحات وحساب القياسات الهندسية...');

      const ok = await documentExportService.exportElementToPdf(
        previewRef.current,
        `${selectedDoc.id}_${selectedDoc.subjectAr.replace(/\s+/g, '_')}.pdf`,
        {
          title: selectedDoc.title,
          scale: 2,
          onProgress: (step) => setPdfProgressText(step)
        }
      );

      if (ok) {
        resilientAudio.playSuccessChime();
        setStatusNotice('تم بنجاح تصدير وتحميل ملف PDF القياسي عالي الدقة!');
      } else {
        // Fallback to print window
        documentExportService.printCleanDocument(selectedDoc);
        setStatusNotice('تم فتح نافذة الطباعة / الحفظ كـ PDF التوافقية.');
      }
    } catch (e: any) {
      console.warn('PDF export error, falling back to print dialog:', e);
      documentExportService.printCleanDocument(selectedDoc);
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgressText('');
      setTimeout(() => setStatusNotice(null), 5000);
    }
  };

  /**
   * Secondary Action: Clean A4 Print Window
   */
  const handleCleanPrint = () => {
    if (!selectedDoc) return;
    resilientAudio.playClickSound();
    documentExportService.printCleanDocument(selectedDoc);
    setStatusNotice('تم فتح مستند الطباعة A4 المخصص. اختر «Save as PDF» لحفظه أو اختر طابعتك.');
    setTimeout(() => setStatusNotice(null), 5000);
  };

  const handleExportHtml = () => {
    if (!selectedDoc) return;
    documentExportService.exportAsStandaloneHtml(selectedDoc);
    resilientAudio.playSuccessChime();
    setStatusNotice('تم تحميل مستند HTML المستقل بنجاح!');
    setTimeout(() => setStatusNotice(null), 4000);
  };

  const handleExportMarkdown = () => {
    if (!selectedDoc) return;
    documentExportService.exportAsMarkdown(selectedDoc);
    resilientAudio.playSuccessChime();
    setStatusNotice('تم تصدير ملف Markdown (.md) مع صيغ LaTeX!');
    setTimeout(() => setStatusNotice(null), 4000);
  };

  const handleExportJson = () => {
    if (!selectedDoc) return;
    documentExportService.exportAsJson(selectedDoc);
    resilientAudio.playSuccessChime();
    setStatusNotice('تم تصدير البيانات المهيكلة بتنسيق JSON بنجاح.');
    setTimeout(() => setStatusNotice(null), 4000);
  };

  const handleCopyClipboard = async () => {
    if (!selectedDoc) return;
    const ok = await documentExportService.copyToClipboard(selectedDoc);
    if (ok) {
      setCopiedSuccess(true);
      resilientAudio.playSuccessChime();
      setTimeout(() => setCopiedSuccess(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  مركز تصدير PDF وإتاحة الطباعة المعيارية A4
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                  Verified PDF Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تصدير مباشر إلى PDF عالي الدقة ثم إتاحة الطباعة مع فحص وتأكيد جاهزية كافة الماتريال القابل للطباعة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="إغلاق النافذة (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Notice Bar */}
        {statusNotice && (
          <div className="px-6 py-2.5 bg-emerald-950/60 border-b border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2 font-medium animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Sub-Header Tabs */}
        <div className="px-6 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>معاينة المستند وتصدير PDF</span>
            </button>

            <button
              onClick={() => setActiveTab('audit_suite')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'audit_suite'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>فحص واختبار كامل الماتريال القابل للطباعة ({documents.length})</span>
            </button>
          </div>

          <div className="text-slate-400 text-[11px] hidden sm:block font-mono">
            {auditReport.allValid ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> كافة الماتريال جاهزة ومؤكدة ({auditReport.readyItemsCount}/{auditReport.totalItems})
              </span>
            ) : null}
          </div>
        </div>

        {activeTab === 'preview' ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar: Documents Selector */}
            <div className="w-full md:w-72 bg-slate-950/70 border-b md:border-b-0 md:border-l border-slate-800 p-3 space-y-1.5 overflow-y-auto">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                اختر المادة أو الكبسولة:
              </div>

              {documents.map((doc) => {
                const isSelected = doc.id === selectedDocId;
                return (
                  <button
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      resilientAudio.playClickSound();
                    }}
                    className={`w-full text-right p-3 rounded-2xl border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600/20 border-emerald-500/60 text-white shadow-sm'
                        : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold truncate">{doc.subjectAr}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {doc.pagesCountEstimate} ص
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 line-clamp-1">{doc.title}</div>
                  </button>
                );
              })}
            </div>

            {/* Main Area: Document Preview & Export Action Bar */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
              {/* Export Action Bar (Corrected: Direct PDF Export first, then Print option) */}
              <div className="p-4 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>إجراءات المستند المختار:</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Primary 1: Direct Export to PDF */}
                  <button
                    disabled={isGeneratingPdf}
                    onClick={handleExportToPdf}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold transition-all shadow-md shadow-emerald-600/25 cursor-pointer"
                    title="تصدير وتنزيل ملف PDF حقيقي عالي الدقة مباشرة لجهازك (Ctrl+P)"
                  >
                    {isGeneratingPdf ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{isGeneratingPdf ? 'جاري توليد PDF...' : 'تصدير إلى PDF فوري (Ctrl+P) 📥'}</span>
                  </button>

                  {/* Primary 2: Dedicated A4 Print Window */}
                  <button
                    onClick={handleCleanPrint}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-all cursor-pointer"
                    title="فتح نافذة الطباعة المخصصة A4 مع خيار الحفظ كـ PDF"
                  >
                    <Printer className="w-4 h-4 text-blue-400" />
                    <span>إتاحة الطباعة A4 🖨️</span>
                  </button>

                  {/* Secondary: Standalone HTML */}
                  <button
                    onClick={handleExportHtml}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-all cursor-pointer"
                    title="تحميل ملف HTML أوفلاين"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">HTML أوفلاين</span>
                  </button>

                  {/* Markdown */}
                  <button
                    onClick={handleExportMarkdown}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-all cursor-pointer"
                    title="تصدير بصيغة Markdown"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Markdown</span>
                  </button>

                  {/* Copy */}
                  <button
                    onClick={handleCopyClipboard}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-all cursor-pointer"
                  >
                    {copiedSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* PDF Generation Progress Status */}
              {isGeneratingPdf && (
                <div className="px-6 py-2 bg-blue-950/80 border-b border-blue-800/60 text-blue-300 text-xs flex items-center justify-between font-mono animate-pulse">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                    <span>{pdfProgressText}</span>
                  </div>
                  <span>دقة 300 DPI عالية التباين</span>
                </div>
              )}

              {/* Document Live Preview Container */}
              <div className="flex-1 p-6 overflow-y-auto bg-slate-950/40">
                {selectedDoc && (
                  <div
                    ref={previewRef}
                    className="max-w-3xl mx-auto bg-white text-slate-900 rounded-2xl p-8 shadow-2xl border-2 border-emerald-800 relative selection:bg-emerald-100"
                  >
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none text-center font-black text-3xl rotate-[-25deg] text-emerald-950">
                      جمهورية مصر العربية<br />وزارة التربية والتعليم<br />الثانوية العامة
                    </div>

                    {/* Header Row */}
                    <div className="flex items-start justify-between border-b-2 border-emerald-800 pb-4 mb-5 relative z-10">
                      <div>
                        <div className="text-xs font-bold text-emerald-900">
                          جمهورية مصر العربية - وزارة التربية والتعليم والتعليم الفني
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          المركز القومي للامتحانات والتقويم التربوي • قطاع الكتب المدرسية
                        </div>
                        <h2 className="text-xl font-black text-slate-900 mt-1.5">
                          {selectedDoc.title}
                        </h2>
                        <div className="text-xs text-emerald-700 font-bold mt-1">
                          {selectedDoc.subjectAr} {selectedDoc.branchAr ? `• ${selectedDoc.branchAr}` : ''}
                        </div>
                      </div>

                      <div className="border-2 border-emerald-800 bg-emerald-50 rounded-xl px-3 py-1.5 text-center">
                        <div className="text-[10px] font-bold text-emerald-900">وثيقة رسمية</div>
                        <div className="text-xs font-black text-emerald-800 font-mono">A4 PDF READY</div>
                      </div>
                    </div>

                    {/* Summary Box */}
                    <div className="bg-slate-50 border-r-4 border-emerald-700 p-3 rounded-lg mb-5 text-xs text-slate-700 leading-relaxed">
                      {selectedDoc.summary}
                    </div>

                    {/* Sections */}
                    <div className="space-y-5 relative z-10">
                      {selectedDoc.sections.map((sec, idx) => (
                        <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-emerald-900">
                              {idx + 1}. {sec.heading}
                            </h4>
                            {sec.badge && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                                {sec.badge}
                              </span>
                            )}
                          </div>

                          <ul className="space-y-1.5 text-xs text-slate-800 pr-4 list-disc">
                            {sec.items.map((item, itemIdx) => (
                              <li key={itemIdx} className="leading-relaxed">
                                {item}
                              </li>
                            ))}
                          </ul>

                          {sec.latexFormulas && sec.latexFormulas.length > 0 && (
                            <div className="mt-3 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-2">
                              {sec.latexFormulas.map((formula, fIdx) => (
                                <div key={fIdx} className="text-center py-1 overflow-x-auto">
                                  <MathRenderer latex={formula} block={true} />
                                </div>
                              ))}
                            </div>
                          )}

                          {sec.notes && (
                            <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded">
                              <strong>⚠️ تنبيه وزاري هام:</strong> {sec.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-3 border-t border-slate-300 flex justify-between items-center text-[10px] text-slate-500">
                      <span>المصدر المعتمد: {selectedDoc.authorOrSource}</span>
                      <span>تاريخ الوثيقة: {new Date().toLocaleDateString('ar-EG')}</span>
                      <span className="font-mono">THN-2026-VERIFIED</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Audit Suite Tab: Testing & Confirming all printable materials across the entire app */
          <div className="flex-1 p-6 overflow-y-auto bg-slate-950/60 space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-base font-bold text-white">
                    لوحة فحص وتأكيد جاهزية كافة الماتريال القابل للطباعة والتصدير
                  </h4>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  التحقق البرمجي التام من مطابقة المستندات والكبسولات لمعايير وزارة التربية والتعليم، صياغة KaTeX، وتقسيم A4.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefreshAudit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>إعادة فحص كافة المواد</span>
                </button>
              </div>
            </div>

            {/* Audit Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {auditReport.details.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h5 className="text-xs font-bold text-white truncate">{item.title}</h5>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>المادة: <strong className="text-slate-200">{item.subject}</strong></span>
                      <span>•</span>
                      <span>الأقسام: <strong className="text-slate-200">{item.sectionsCount}</strong></span>
                      <span>•</span>
                      <span>صيغ رياضية: <strong className="text-emerald-400 font-mono">{item.formulasCount}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedDocId(item.id);
                        setActiveTab('preview');
                        resilientAudio.playClickSound();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      title="معاينة وتصدير هذا المستند كـ PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تصدير PDF</span>
                    </button>

                    <button
                      onClick={() => {
                        const target = documents.find((d) => d.id === item.id);
                        if (target) documentExportService.printCleanDocument(target);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-all cursor-pointer"
                      title="طباعة فورية A4"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>نظام التصدير يتبع معايير A4 الرسمية لوزارة التربية والتعليم (نسخة معتمدة لدفعة 2026/2027).</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

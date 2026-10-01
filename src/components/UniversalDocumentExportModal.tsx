import React, { useState } from 'react';
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
  Share2
} from 'lucide-react';
import { PRESET_EXPORTABLE_DOCUMENTS } from '../data/exportableDocumentsData';
import { documentExportService, ExportableDocumentItem } from '../services/documentExportService';
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
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const selectedDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  const handlePrint = () => {
    resilientAudio.playClickSound();
    documentExportService.printCurrentWindow();
  };

  const handleExportHtml = () => {
    if (!selectedDoc) return;
    documentExportService.exportAsStandaloneHtml(selectedDoc);
    resilientAudio.playSuccessChime();
    setDownloadNotice('تم تحميل ملف HTML المستقل بنجاح! يمكنك فتحه دون اتصال أو طباعته في أي وقت.');
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  const handleExportMarkdown = () => {
    if (!selectedDoc) return;
    documentExportService.exportAsMarkdown(selectedDoc);
    resilientAudio.playSuccessChime();
    setDownloadNotice('تم تحميل مستند Markdown بصيغة .md متوافق مع كافة المحررات وقارئات LaTeX.');
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  const handleExportJson = () => {
    if (!selectedDoc) return;
    documentExportService.exportAsJson(selectedDoc);
    resilientAudio.playSuccessChime();
    setDownloadNotice('تم تصدير البيانات المهيكلة بتنسيق JSON بنجاح.');
    setTimeout(() => setDownloadNotice(null), 4000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  مركز تصدير المستندات وطباعة الكبسولات A4
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                  Standard A4 Layout
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تصدير وطباعة الملخصات الرسمية والكبسولات بصيغ متعددة (PDF / HTML / Markdown / JSON / Clipboard)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Bar if any */}
        {downloadNotice && (
          <div className="px-6 py-2 bg-emerald-950/50 border-b border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadNotice}</span>
          </div>
        )}

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar: Documents Selector */}
          <div className="w-full md:w-72 bg-slate-950/60 border-b md:border-b-0 md:border-l border-slate-800 p-4 space-y-2 overflow-y-auto">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              اختر المستند أو الكبسولة:
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
                      ? 'bg-blue-600/20 border-blue-500/60 text-white shadow-sm'
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
            {/* Export Action Bar */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">خيارات التصدير:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Print to PDF */}
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-sm cursor-pointer"
                  title="طباعة فورية وحفظ كملف PDF نظيف ومنسق A4"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة A4 / PDF</span>
                </button>

                {/* Standalone HTML */}
                <button
                  onClick={handleExportHtml}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-semibold transition-all cursor-pointer"
                  title="تحميل ملف HTML مستقل يعمل أوفلاين مع خطوط ومعادلات مدمجة"
                >
                  <Download className="w-4 h-4" />
                  <span>ملف HTML أوفلاين</span>
                </button>

                {/* Markdown */}
                <button
                  onClick={handleExportMarkdown}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold transition-all cursor-pointer"
                  title="تحميل مستند بصيغة Markdown (.md)"
                >
                  <FileText className="w-4 h-4" />
                  <span>Markdown (.md)</span>
                </button>

                {/* JSON */}
                <button
                  onClick={handleExportJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold transition-all cursor-pointer"
                  title="تصدير كبيانات JSON"
                >
                  <FileCode className="w-4 h-4" />
                  <span>بيانات JSON</span>
                </button>

                {/* Copy to Clipboard */}
                <button
                  onClick={handleCopyClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold transition-all cursor-pointer"
                >
                  {copiedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>نسخ المحتوى</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Document Live Preview */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-950/40">
              {selectedDoc && (
                <div className="max-w-3xl mx-auto bg-white text-slate-900 rounded-2xl p-7 shadow-xl border-2 border-emerald-800 relative">
                  {/* Ministry Watermark simulation */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none text-center font-bold text-3xl rotate-[-25deg] text-emerald-950">
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
                      <div className="text-[10px] font-bold text-emerald-900">نموذج معتمد</div>
                      <div className="text-xs font-black text-emerald-800 font-mono">A4 STANDARD</div>
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
      </div>
    </div>
  );
};

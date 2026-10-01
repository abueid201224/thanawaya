import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Video,
  Headphones,
  Printer,
  FileText,
  Search,
  Star,
  ExternalLink,
  ShieldCheck,
  Play,
  Pause,
  Download,
  CheckCircle2,
  Filter,
  Eye,
  X,
  Volume2,
  Activity,
  Sparkles
} from 'lucide-react';
import { MultimediaLibraryItem, MediaFileType } from '../types';
import { resilientAudio } from '../services/resilientAudioService';

interface SubjectLibraryViewProps {
  items: MultimediaLibraryItem[];
  onOpenVideo: (item: MultimediaLibraryItem) => void;
  onOpenDiagnostics?: () => void;
  onOpenDocumentExport?: (subjectCode?: string) => void;
}

export const SubjectLibraryView: React.FC<SubjectLibraryViewProps> = ({
  items,
  onOpenVideo,
  onOpenDiagnostics,
  onOpenDocumentExport
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedFileType, setSelectedFileType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active audio narrator state
  const [narratingItemId, setNarratingItemId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = resilientAudio.subscribeSpeakingState((isSpeaking) => {
      if (!isSpeaking) setNarratingItemId(null);
    });
    return () => {
      unsub();
      resilientAudio.stop();
    };
  }, []);

  // Printable Modal preview
  const [printableModalItem, setPrintableModalItem] = useState<MultimediaLibraryItem | null>(null);

  const subjectsList = [
    { code: 'ALL', name: 'جميع المواد' },
    { code: 'CALCULUS', name: 'التفاضل والتكامل' },
    { code: 'ALGEBRA_SOLID_GEO', name: 'الجبر والهندسة الفراغية' },
    { code: 'STATICS', name: 'الاستاتيكا' },
    { code: 'DYNAMICS', name: 'الديناميكا' },
    { code: 'PHYSICS', name: 'الفيزياء' },
    { code: 'CHEMISTRY', name: 'الكيمياء' },
    { code: 'LANGUAGES', name: 'اللغات' }
  ];

  const filteredItems = items.filter((item) => {
    const matchesSubject = selectedSubject === 'ALL' || item.subjectCode === selectedSubject;
    const matchesType = selectedFileType === 'ALL' || item.fileType === selectedFileType;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesType && matchesSearch;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleToggleNarrator = (item: MultimediaLibraryItem) => {
    if (narratingItemId === item.id) {
      resilientAudio.stop();
      setNarratingItemId(null);
    } else {
      resilientAudio.stop();
      setNarratingItemId(item.id);
      const textToRead = `${item.title} . مادة ${item.subjectNameAr} . ${item.description} . ${
        item.printableCheatSheet ? item.printableCheatSheet.join(' . ') : ''
      }`;
      resilientAudio.speak(textToRead, {
        onEnd: () => setNarratingItemId(null),
        onError: () => setNarratingItemId(null)
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-blue-950/60 border border-indigo-800/40 p-6 lg:p-7 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              مكتبة الوسائط التعليمية المعتمدة لكل مادة
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              فيديوهات، تسجيلات صوتية، وملخصات جاهزة للطباعة
            </h2>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {onOpenDocumentExport && (
                <button
                  onClick={() => onOpenDocumentExport(selectedSubject === 'ALL' ? undefined : selectedSubject)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>مركز تصدير المستندات A4</span>
                </button>
              )}

              {onOpenDiagnostics && (
                <button
                  onClick={onOpenDiagnostics}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>فحص وتشخيص تشغيل الوسائط 🛠️</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-4 min-w-[260px] text-xs space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>المحتويات المعتمدة:</span>
              <span className="font-bold text-emerald-400 font-mono">{items.length} مصادر</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>ملخصات جاهزة للطباعة:</span>
              <span className="font-bold text-purple-400 font-mono">
                {items.filter((i) => i.fileType === 'printable_doc').length} ملفات A4
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>فيديوهات وكبسولات:</span>
              <span className="font-bold text-blue-400 font-mono">
                {items.filter((i) => i.fileType !== 'printable_doc').length} وسائط
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في الدروس والمذكرات والقوانين..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Media Type Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedFileType('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedFileType === 'ALL'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setSelectedFileType('video')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedFileType === 'video'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>فيديوهات</span>
            </button>
            <button
              onClick={() => setSelectedFileType('audio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedFileType === 'audio'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>كبسولات صوتية</span>
            </button>
            <button
              onClick={() => setSelectedFileType('printable_doc')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedFileType === 'printable_doc'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>ملخصات للطباعة (PDF)</span>
            </button>
          </div>
        </div>

        {/* Subjects horizontal pill scroller */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {subjectsList.map((s) => (
            <button
              key={s.code}
              onClick={() => setSelectedSubject(s.code)}
              className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all cursor-pointer ${
                selectedSubject === s.code
                  ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold ring-1 ring-indigo-500/40'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Library Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => {
          const isDoc = item.fileType === 'printable_doc';
          const isVideo = item.fileType === 'video';
          const isAudio = item.fileType === 'audio';

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
            >
              <div className="space-y-3">
                {/* Header row: badge & rating */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                      isDoc
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/25'
                        : isVideo
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                    }`}
                  >
                    {isDoc && <Printer className="w-3 h-3" />}
                    {isVideo && <Video className="w-3 h-3" />}
                    {isAudio && <Headphones className="w-3 h-3" />}
                    <span>{item.subjectNameAr}</span>
                  </span>

                  <div className="flex items-center gap-1 text-amber-400 text-xs font-mono">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{item.rating}</span>
                  </div>
                </div>

                {/* Title */}
                <h4 className="text-base font-bold text-white leading-snug line-clamp-2">
                  {item.title}
                </h4>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {item.description}
                </p>

                {/* Printable badge if doc */}
                {isDoc && (
                  <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/30 text-purple-200 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Printer className="w-3.5 h-3.5 text-purple-400" />
                      وثيقة مهيأة للطباعة المباشرة A4
                    </span>
                    <span className="font-mono text-[11px] text-purple-300 font-bold">
                      {item.durationOrPages}
                    </span>
                  </div>
                )}

                {/* Audio preview controls if audio */}
                {isAudio && (
                  <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/30 space-y-2">
                    <div className="flex items-center justify-between text-xs text-amber-300 font-medium">
                      <span>كبسولة صوتية سريعة</span>
                      <span className="font-mono">{item.durationOrPages}</span>
                    </div>
                    <audio src={item.url} controls className="w-full h-8" />
                  </div>
                )}
              </div>

              {/* Footer / Action */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>معتمد وزارياً</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Resilient Audio Narrator button for any card */}
                  <button
                    onClick={() => handleToggleNarrator(item)}
                    className={`p-1.5 rounded-xl border text-xs transition-all flex items-center gap-1 cursor-pointer ${
                      narratingItemId === item.id
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                    }`}
                    title={narratingItemId === item.id ? 'إيقاف النطق' : 'استماع صوتي للملخص'}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">
                      {narratingItemId === item.id ? 'إيقاف' : 'استماع'}
                    </span>
                  </button>

                  {isDoc && (
                    <button
                      onClick={() => setPrintableModalItem(item)}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/20"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>معاينة وطباعة</span>
                    </button>
                  )}

                  {isVideo && (
                    <button
                      onClick={() => onOpenVideo(item)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>تشغيل الوسائط</span>
                    </button>
                  )}

                  {isAudio && (
                    <a
                      href={item.url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-xs font-medium"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل MP3</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Printable Sheet Fullscreen Modal */}
      {printableModalItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  {printableModalItem.subjectNameAr} • وثيقة طباعة رسمية
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {printableModalItem.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة فورية للورقة (Print / PDF)</span>
                </button>
                <button
                  onClick={() => setPrintableModalItem(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Printable Sheet Body (Stylized as High-Yield A4) */}
            <div className="flex-1 p-6 lg:p-8 overflow-y-auto bg-slate-950 text-slate-100 space-y-6 printable-content">
              {/* Header Box on Sheet */}
              <div className="border-2 border-slate-700 rounded-2xl p-5 bg-slate-900/80 text-center space-y-2">
                <div className="text-xs font-bold text-blue-400">
                  جمهورية مصر العربية • وزارة التربية والتعليم والتعليم الفني • ثانوية عامة (علمي رياضة)
                </div>
                <h2 className="text-xl font-extrabold text-white">
                  {printableModalItem.title}
                </h2>
                <div className="text-xs text-slate-400">
                  المصدر: {printableModalItem.sourceName} • كبسولة المفاهيم والقوانين التي لا يخلو منها الامتحان
                </div>
              </div>

              {/* Formula & Rule List */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-amber-400 border-b border-slate-800 pb-2">
                  القوانين والقواعد الذهبية المعتمدة للحل السريع:
                </h4>

                <div className="grid grid-cols-1 gap-3">
                  {printableModalItem.printableCheatSheet?.map((formula, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3"
                    >
                      <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="text-sm text-slate-100 font-medium leading-relaxed">
                        {formula}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Watermark / Guidance Footer */}
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/30 text-xs text-slate-300 space-y-1">
                <div className="font-bold text-blue-300">ملاحظة موجه الرياضيات الأول:</div>
                <p>
                  احفظ هذه الورقة بجوار مكتب مذاكرتك وراجعها أسبوعياً بنظام التكرار المتباعد (Spaced Repetition).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

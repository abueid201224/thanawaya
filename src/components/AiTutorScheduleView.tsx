import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  BookOpen,
  Send,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Award,
  ExternalLink,
  ChevronDown,
  Layers,
  CheckCircle2,
  FileQuestion,
  HelpCircle,
  Clock,
  Mic,
  MicOff,
  Volume2,
  Camera,
  FileText,
  Download,
  Check,
  RotateCcw
} from 'lucide-react';
import { DailyScheduleSlot, ExamEssential } from '../types';
import { curriculumSourceReferences } from '../data/curriculumData';
import { MathRenderer, MixedTextRenderer } from './MathRenderer';
import { MathLatexToolbar } from './MathLatexToolbar';
import { MathScanOcrModal } from './MathScanOcrModal';
import { offlineStorage } from '../services/offlineStorage';
import { voiceAssistant } from '../services/voiceAssistant';

interface AiTutorScheduleViewProps {
  activeSlot: DailyScheduleSlot | null;
  examEssentials: ExamEssential[];
  onOpenBreakGuide: () => void;
}

type TutorTab = 'card' | 'tutor' | 'resources';

export const AiTutorScheduleView: React.FC<AiTutorScheduleViewProps> = ({
  activeSlot,
  examEssentials,
  onOpenBreakGuide
}) => {
  const currentSlot = activeSlot || {
    id: 'default_slot',
    timeStart: '16:00',
    timeEnd: '17:30',
    subjectCode: 'CALCULUS',
    subjectNameAr: 'التفاضل والتكامل',
    topic: 'تطبيقات القيم العظمى والصغرى والمعدلات الزمنية المرتبطة',
    slotType: 'study',
    priority: 'critical',
    isCompleted: false,
    examEssentialKey: 'ess_calc_1',
    aiPriorityReason: 'مقترح تدريب عام؛ لم تُحسب أوزان امتحانية أو تكرارات موثقة لهذا الدرس.'
  };

  const matchingEssential = examEssentials.find(
    (e) => e.id === currentSlot.examEssentialKey || e.subjectCode === currentSlot.subjectCode
  );

  // Tab State
  const [activeTab, setActiveTab] = useState<TutorTab>('tutor');

  // Math Toolbar & OCR Modal
  const [showMathToolbar, setShowMathToolbar] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);


  // Offline Caching State for the current study topic
  const [savedLocally, setSavedLocally] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<
    Array<{
      role: 'user' | 'assistant';
      text: string;
      time: string;
      links?: Array<{ title: string; url: string }>;
    }>
  >([
    {
      role: 'assistant',
      text: `مرحباً! هذه مساحة تدريب أولية لموضوع "${currentSlot.topic}" (${currentSlot.subjectNameAr}).\n\n${currentSlot.aiPriorityReason || 'اختر نقطة تريد مراجعتها وابدأ بمحاولة الحل.'}\n\nالمحتوى والردود هنا لا تُعدّ بيانات امتحانية موثقة، ولا يستخدم هذا الحوار حالياً نموذج ذكاء اصطناعي متصلاً. يمكنك استخدام لوحة الرموز أو إدخال نص المسألة للتدريب.`,
      time: 'الآن'
    }
  ]);

  const [chatInput, setChatInput] = useState('');
  const [inputNotice, setInputNotice] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiThinking]);

  // Voice-to-Text Handler
  const handleToggleVoice = () => {
    if (isListening) {
      voiceAssistant.stopListening();
      setIsListening(false);
      setVoiceNotice(null);
    } else {
      setIsListening(true);
      setVoiceNotice('جاري الاستماع لصوتك باللغة العربية...');
      voiceAssistant.startListening({
        onResult: (transcript) => {
          setChatInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
          setVoiceNotice(null);
        },
        onError: (err) => {
          setIsListening(false);
          setVoiceNotice(`تنبيه: ${err}`);
          setTimeout(() => setVoiceNotice(null), 4000);
        },
        onEnd: () => {
          setIsListening(false);
          setVoiceNotice(null);
        }
      });
    }
  };

  const handleInsertLatex = (latex: string) => {
    setChatInput((prev) => `${prev} ${latex} `);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text) return;

    if (!textToSend) setChatInput('');

    const newHistory = [...chatMessages, { role: 'user' as const, text, time: 'الآن' }];
    setChatMessages(newHistory);
    setIsAiThinking(true);

    setTimeout(() => {
      let reply = '';
      let links: Array<{ title: string; url: string }> | undefined;

      if (text.includes('الخدعة') || text.includes('فخ')) {
        reply = `⚠️ **ملاحظة تدريبية عامة — لا يوجد توثيق لتكرارها امتحانياً:**\n${matchingEssential?.examTrapWarning || 'تحقق من شروط المسألة ومجال المتغيرات والوحدات قبل إكمال الحل.'}\n\n💡 **مفهوم للتدرب عليه:**\n${matchingEssential?.coreConcept || 'اكتب العلاقة الرياضية أولاً ثم تحقّق من خطوات الاشتقاق أو التعويض.'}\n\nهذه المادة الأولية تحتاج مراجعة معلم أو مصدر موثوق قبل اعتمادها.`;
      } else if (text.includes('امتحان سابق') || text.includes('مسألة مشابهة') || text.includes('وزاري')) {
        reply = `لا توجد في هذه النسخة أسئلة من امتحانات سابقة موثقة. أستطيع عرض مثال تدريبي داخلي، لكنه غير منسوب إلى امتحان رسمي:\n\n${matchingEssential?.sampleExamQuestion || 'اكتب مسألة تدريبية تريد تحليلها.'}\n\nخطوات الحل المعروضة تدريبية أولية وليست نموذج إجابة رسمي:\n${matchingEssential?.stepByStepSolution || 'ابدأ بكتابة المعطيات والعلاقة المناسبة ثم تحقّق من كل خطوة.'}`;
      } else if (text.includes('Scan') || text.includes('المعادلة المستخرجة')) {
        reply = `هذه المحادثة لا تحلل الصور تلقائياً ولا تتحقق من استخراجها. إذا أُدرج نص المسألة، استخدمه كنقطة بداية ثم راجع المعطيات بنفسك.\n\nما العلاقة أو القانون الذي تظن أنه يناسب المسألة؟`;
      } else if (text.includes('روابط') || text.includes('مستندات') || text.includes('حكومية')) {
        reply = `لا توجد حالياً روابط مصادر دراسية موثقة لهذا الموضوع داخل التطبيق. أُزيلت الروابط العامة والتجريبية؛ ستُضاف مراجع مباشرة بعد التحقق من مصدرها وارتباطها بالمنهج.`;
      } else {
        reply = `أستطيع مساعدتك في التفكير خطوة بخطوة، لكن الردود الحالية قوالب تدريبية ثابتة وليست ناتجة عن نموذج ذكاء اصطناعي.\n\nابدأ بكتابة المعطيات والعلاقة التي تربطها، ثم اقترح خطوة أولى. تحقّق من الحل النهائي في مصدر تعليمي موثوق أو معلمك.`;
      }

      setChatMessages([
        ...newHistory,
        {
          role: 'assistant',
          text: reply,
          time: 'الآن',
          links
        }
      ]);
      setIsAiThinking(false);
    }, 600);
  };

  const handleSaveToOfflineCache = async () => {
    await offlineStorage.setItem(`topic_cache_${currentSlot.id}`, {
      slot: currentSlot,
      essential: matchingEssential,
      cachedDate: new Date().toLocaleDateString('ar-EG')
    }, 'curriculum');
    setSavedLocally(true);
    setTimeout(() => setSavedLocally(false), 3000);
  };

  const handleSpeakText = (text: string) => {
    voiceAssistant.speak(text);
  };



  return (
    <div className="space-y-4">
      {/* Top Context & 3-Tab Navigator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                {currentSlot.subjectNameAr}
              </span>
              <span className="font-mono text-xs text-slate-400">
                {currentSlot.timeStart} - {currentSlot.timeEnd}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5 line-clamp-1">{currentSlot.topic}</h3>
          </div>
        </div>

        {/* 3 Tab Switchers */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('card')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'card'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>بطاقة تدريبية</span>
          </button>

          <button
            onClick={() => setActiveTab('tutor')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tutor'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>مساعد تدريب أولي</span>
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'resources'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>المصادر الموثقة</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: بطاقة تدريبية (Exam Essential Card) */}
      {/* ============================================================== */}
      {activeTab === 'card' && matchingEssential && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card Left: Weight, Trap, and Golden Rule */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-800/40 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Zap className="w-5 h-5 fill-amber-400" />
                  <span>ملاحظات تدريبية أولية</span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold">
                  غير موثّق
                </span>
              </div>

              {/* Past Exam Occurrences */}
              <div className="space-y-1.5">
                <span className="text-xs text-slate-400">مصادر تكرار الامتحانات: غير موثقة في هذه النسخة</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {matchingEssential.pastExamOccurrences.length > 0 ? (
                    matchingEssential.pastExamOccurrences.map((occ, i) => (
                      <span
                        key={i}
                        className="text-xs px-3 py-1 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-semibold"
                      >
                        {occ}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">لا توجد امتحانات موثقة مرتبطة بهذا المثال.</span>
                  )}
                </div>
              </div>

              {/* Golden Rule (القاعدة الذهبية) */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 space-y-2">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>مفهوم تدريبي (غير موثق بمصدر رسمي):</span>
                </div>
                <MixedTextRenderer text={matchingEssential.coreConcept} className="text-slate-200 text-sm leading-relaxed" />
              </div>

              {/* Exam Trap Warning (الفخ الامتحاني) */}
              <div className="p-4 rounded-xl bg-rose-950/25 border border-rose-800/40 text-xs text-rose-200 space-y-1.5">
                <div className="font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>تنبيه تدريبي محتمل — لا توجد بيانات إحصائية موثقة:</span>
                </div>
                <p className="leading-relaxed text-xs">{matchingEssential.examTrapWarning}</p>
              </div>
            </div>
          </div>

          {/* Card Right: Internal practice example and solution outline */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileQuestion className="w-4 h-4 text-blue-400" />
                  <span>مثال تدريبي داخلي — غير منسوب إلى امتحان:</span>
                </h4>
                <button
                  onClick={() => handleSpeakText(matchingEssential.sampleExamQuestion)}
                  title="استماع صوتي للمسألة"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm font-medium text-slate-100 leading-relaxed">
                <MixedTextRenderer text={matchingEssential.sampleExamQuestion} />
              </div>

              {/* Step by Step Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-blue-400">خطوات حل تدريبية — ليست نموذج إجابة رسمياً:</span>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <MixedTextRenderer text={matchingEssential.stepByStepSolution} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setActiveTab('tutor');
                    handleSendMessage('هات لي مسألة مشابهة من امتحان سابق مع خطوات الحل');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>ناقش هذه المسألة مع المعلم الذكي</span>
                </button>
                <button
                  onClick={handleSaveToOfflineCache}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  {savedLocally ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
                  <span>{savedLocally ? 'تم الحفظ للعمل دون اتصال' : 'حفظ دون اتصال'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: مساعد تدريب أولي السقالي (Conversational Tutor) */}
      {/* ============================================================== */}
      {activeTab === 'tutor' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col h-[640px] overflow-hidden shadow-2xl">
          {/* Quick Action Chips & Controls Bar */}
          <div className="p-3 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-slate-400 shrink-0 font-medium text-[11px]">مفاتيح تفاعلية:</span>
              <button
                onClick={() => handleSendMessage('ما هي الخدعة الامتحانية التي يقع فيها الطلاب في هذا الدرس؟')}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 hover:bg-amber-500/20 whitespace-nowrap transition-all cursor-pointer text-[11px]"
              >
                ⚠️ الفخ الامتحاني المتكرر
              </button>
              <button
                onClick={() => handleSendMessage('هات لي مسألة مشابهة من امتحان سابق مع خطوات الحل')}
                className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-300 hover:bg-blue-500/20 whitespace-nowrap transition-all cursor-pointer text-[11px]"
              >
                📝 مسألة من امتحانات 2021-2025
              </button>
            </div>

            {/* OCR & LaTeX Toolbar Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOcrModalOpen(true)}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:opacity-90"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan & Solve (OCR)</span>
              </button>

              <button
                onClick={() => setShowMathToolbar(!showMathToolbar)}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  showMathToolbar
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <MathRenderer latex="f(x)" className="text-xs" />
                <span>لوحة الرموز</span>
              </button>
            </div>
          </div>

          {/* Math LaTeX Toolbar (when open) */}
          {showMathToolbar && (
            <div className="p-2 bg-slate-950 border-b border-slate-800">
              <MathLatexToolbar onInsertLatex={handleInsertLatex} />
            </div>
          )}

          {/* Voice Listening Notice Banner */}
          {voiceNotice && (
            <div className="p-2 bg-blue-950/80 border-b border-blue-800/50 text-blue-300 text-xs flex items-center justify-center gap-2 animate-pulse">
              <Mic className="w-4 h-4 text-blue-400" />
              <span>{voiceNotice}</span>
            </div>
          )}

          {/* Message Feed */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-4 text-sm leading-relaxed shadow-md ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-bl-sm'
                      : 'bg-slate-800/90 text-slate-100 rounded-br-sm border border-slate-700/60'
                  }`}
                >
                  <MixedTextRenderer text={msg.text} />

                  {/* Speech Narration Button for Assistant */}
                  {msg.role === 'assistant' && (
                    <div className="mt-2 flex items-center justify-between border-t border-slate-700/60 pt-2 text-[11px] text-slate-400">
                      <button
                        onClick={() => handleSpeakText(msg.text)}
                        className="flex items-center gap-1 hover:text-cyan-300 transition-colors cursor-pointer"
                        title="استماع صوتي للشرح"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>استمع للشرح</span>
                      </button>
                      <span>{msg.time}</span>
                    </div>
                  )}

                  {/* Links from Assistant */}
                  {msg.links && msg.links.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/80 space-y-1.5">
                      <div className="text-xs font-bold text-emerald-400">
                        لا توجد مراجع موثقة متاحة حالياً:
                      </div>
                      {msg.links.map((link, lIdx) => (
                        <a
                          key={lIdx}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs text-blue-300 hover:text-blue-200 underline font-mono"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{link.title}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isAiThinking && (
              <div className="flex items-center gap-2 text-xs text-blue-400 p-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>المعلم الذكي يحلل العلاقة الرياضية ويربطها بنواتج التعلم...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Formula Preview Banner if chat input contains math */}
          {chatInput.includes('$') && (
            <div className="px-4 py-2 bg-slate-950 border-t border-cyan-900/40 flex items-center justify-between gap-3 text-xs animate-in fade-in">
              <div className="flex items-center gap-2 overflow-x-auto min-w-0">
                <span className="text-[11px] text-cyan-400 font-bold shrink-0">معاينة المعادلة الرياضية:</span>
                <div className="text-cyan-200 font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-cyan-800/40">
                  <MixedTextRenderer text={chatInput} />
                </div>
              </div>
              <button
                onClick={() => setChatInput('')}
                className="text-[10px] text-slate-500 hover:text-rose-400 cursor-pointer shrink-0"
              >
                مسح
              </button>
            </div>
          )}

          {/* Scanned Formula Loaded Notice */}
          {inputNotice && (
            <div className="px-4 py-1.5 bg-emerald-950/80 border-t border-emerald-800/50 text-emerald-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{inputNotice}</span>
              </div>
              <button
                onClick={() => setInputNotice(null)}
                className="text-emerald-500 hover:text-emerald-300 text-[10px] cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Chat Input Box with Camera, Voice Mic & Send */}
          <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
            {/* Quick Camera OCR button directly in the chat input bar */}
            <button
              onClick={() => setIsOcrModalOpen(true)}
              title="التقاط أو مسح مسألة رياضية بالكاميرا (Scan & Solve OCR)"
              className="p-2.5 rounded-xl bg-slate-900 text-cyan-400 border border-slate-800 hover:text-cyan-300 hover:bg-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
            >
              <Camera className="w-5 h-5" />
            </button>

            <button
              onClick={handleToggleVoice}
              title={isListening ? 'إيقاف التسجيل' : 'تحدث صوتياً (Voice-to-Text)'}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              ref={inputRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="اكتب استفسارك، أو امسح مسألة بالكاميرا، أو استخدم لوحة الرموز..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!chatInput.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-600/30"
            >
              <Send className="w-4 h-4" />
              <span>إرسال</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: references awaiting verification */}
      {activeTab === 'resources' && (
        <div className="rounded-2xl border border-amber-800/40 bg-slate-900 p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <AlertTriangle className="w-5 h-5" />
            <span>المصادر قيد التحقق</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            الروابط التالية بوابات رسمية عامة، وليست إثباتاً بأن موضوعات التطبيق تطابق منهج 2026/2027. تحقّق من سنة كل كتاب أو ملف قبل الاعتماد عليه.
          </p>
          <div className="space-y-3">
            {curriculumSourceReferences.map((reference) => (
              <div key={reference.id} className="rounded-xl border border-slate-700 bg-slate-950/70 p-4 space-y-2">
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-blue-300 hover:text-blue-200"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{reference.title}</span>
                </a>
                <p className="text-xs text-slate-400">{reference.publisher} • {reference.yearScope}</p>
                <p className="text-xs text-amber-200/90">{reference.limitation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Math Scan & Solve OCR Modal */}
      <MathScanOcrModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onInsertToInput={(latexFormula, fullPrompt) => {
          setActiveTab('tutor');
          const formattedPrompt = fullPrompt || `$${latexFormula}$`;
          setChatInput(formattedPrompt);
          setInputNotice('تم استخراج المعادلة وإدراجها في مربع الكتابة بنجاح، يمكنك مراجعتها أو الضغط على إرسال ↵');
          setTimeout(() => {
            inputRef.current?.focus();
          }, 150);
        }}
        onSendToChat={(problemText) => {
          setActiveTab('tutor');
          handleSendMessage(problemText);
        }}
      />
    </div>
  );
};

import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Printer,
  Copy,
  Check,
  Sparkles,
  Zap,
  Bookmark,
  Layers,
  Filter,
  Download,
  ExternalLink,
  Highlighter,
  StickyNote,
  FileText,
  Grid
} from 'lucide-react';
import { MathRenderer, MixedTextRenderer } from './MathRenderer';
import { ConceptBookletPdfViewer } from './ConceptBookletPdfViewer';
import { BookletPrintModal } from './BookletPrintModal';
import { BookletStandardPrintDocument, PrintSettings } from './BookletStandardPrintDocument';
import { INITIAL_BOOKLET_ANNOTATIONS } from '../data/conceptBookletPages';
import { HighlightAnnotation, StickyNoteAnnotation } from '../types/bookletAnnotations';
import { documentExportService } from '../services/documentExportService';

interface ConceptEntry {
  id: string;
  subjectCode: 'CALCULUS' | 'ALGEBRA' | 'SOLID_GEO' | 'STATICS' | 'DYNAMICS';
  subjectNameAr: string;
  chapter: string;
  title: string;
  latexFormula: string;
  explanation: string;
  examFrequency: string; // e.g. "تكرر في 2021، 2023، 2024"
  examTip: string;
}

export const OfficialConceptBookletView: React.FC = () => {
  const [displayMode, setDisplayMode] = useState<'pdf_overlay' | 'cards'>('pdf_overlay');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Print Utility State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [activePageForPrint, setActivePageForPrint] = useState<number>(4);
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    scope: 'all',
    currentPageNumber: 4,
    includeHighlights: true,
    includeStickyNotes: true,
    includeStudentInfo: true,
    studentName: '',
    seatingNumber: '',
    schoolName: '',
    includeOfficialSeal: true
  });

  const getStoredAnnotations = (): {
    highlights: HighlightAnnotation[];
    stickyNotes: StickyNoteAnnotation[];
  } => {
    try {
      const saved = localStorage.getItem('thanaweya_booklet_annotations_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          highlights: parsed.highlights || INITIAL_BOOKLET_ANNOTATIONS.highlights,
          stickyNotes: parsed.stickyNotes || INITIAL_BOOKLET_ANNOTATIONS.stickyNotes
        };
      }
    } catch (e) {
      console.error('Error reading booklet annotations:', e);
    }
    return INITIAL_BOOKLET_ANNOTATIONS;
  };

  // Keyboard navigation & global shortcuts listener
  React.useEffect(() => {
    const handleOpenPrint = () => {
      handleOpenPrintModal('all');
    };
    const handleClose = () => {
      setIsPrintModalOpen(false);
    };

    window.addEventListener('open-booklet-print-modal', handleOpenPrint);
    window.addEventListener('close-all-modals', handleClose);
    return () => {
      window.removeEventListener('open-booklet-print-modal', handleOpenPrint);
      window.removeEventListener('close-all-modals', handleClose);
    };
  }, []);

  const handleOpenPrintModal = (targetScope: PrintSettings['scope'] = 'all', pageNum: number = 4) => {
    setActivePageForPrint(pageNum);
    setPrintSettings((prev) => ({
      ...prev,
      scope: targetScope,
      currentPageNumber: pageNum
    }));
    setIsPrintModalOpen(true);
  };

  const handleConfirmPrint = (newSettings: PrintSettings, mode?: 'pdf_download' | 'print') => {
    setPrintSettings(newSettings);
    setIsPrintModalOpen(false);

    if (mode === 'pdf_download') {
      setTimeout(async () => {
        const container = document.querySelector('.booklet-print-container') as HTMLElement;
        if (container) {
          // Temporarily style container for canvas capture
          const prevDisplay = container.style.display;
          const prevVis = container.style.visibility;
          container.style.display = 'block';
          container.style.visibility = 'visible';

          await documentExportService.exportElementToPdf(
            container,
            `official_concept_booklet_page_${newSettings.currentPageNumber}.pdf`,
            { title: 'كتيب المفاهيم الرسمي A4', scale: 2 }
          );

          container.style.display = prevDisplay;
          container.style.visibility = prevVis;
        } else {
          window.print();
        }
      }, 200);
    } else {
      setTimeout(() => {
        window.print();
      }, 150);
    }
  };

  const concepts: ConceptEntry[] = [
    // CALCULUS
    {
      id: 'conc_calc_1',
      subjectCode: 'CALCULUS',
      subjectNameAr: 'التفاضل والتكامل',
      chapter: 'اشتقاق الدوال المثلثية والمشتقات العليا',
      title: 'مشتقات الدوال المثلثية والقواطع',
      latexFormula: '\\frac{d}{dx}(\\tan u) = \\sec^2 u \\cdot \\frac{du}{dx}, \\quad \\frac{d}{dx}(\\sec u) = \\sec u \\tan u \\cdot \\frac{du}{dx}',
      explanation: 'تذكر دائماً ضرب الناتج في مشتقة الزاوية du/dx. وإذا كانت الدالة تبدأ بحرف التاء (جتا، ظتا، قتا) فإن مشتقتها سالبة.',
      examFrequency: 'أساسي في السؤال 1 أو 2 بكل الامتحانات',
      examTip: 'في حالة المشتقات العليا للظا أو القا، استخدم المتطابقة: $\\sec^2 u = 1 + \\tan^2 u$ لتبسيط الناتج.'
    },
    {
      id: 'conc_calc_2',
      subjectCode: 'CALCULUS',
      subjectNameAr: 'التفاضل والتكامل',
      chapter: 'تطبيقات القيم العظمى والصغرى',
      title: 'تحديد فترات التزايد والتناقص والنقاط الحرجة',
      latexFormula: 'f\'(x) = 0 \\quad \\text{أو} \\quad f\'(x) \\text{ غير معرفة بشرط } x \\in \\text{مجال } f',
      explanation: 'النقطة الحرجة تتطلب أولاً أن تنتمي إلى مجال الدالة الأصلي. فحص الإشارة على خط أعداد المشتقة الأولى يحدد العظمى والصغرى.',
      examFrequency: 'مسألة مقالية مؤكدة (3 درجات)',
      examTip: 'فخ امتحاني: لا تنسَ فحص أطراف الفترة المغلقة $[a, b]$ عند طلب القيم القصوى المطلقة.'
    },
    {
      id: 'conc_calc_3',
      subjectCode: 'CALCULUS',
      subjectNameAr: 'التفاضل والتكامل',
      chapter: 'التكامل المحدد والمساحات والحجوم',
      title: 'حجم الجسم الدوراني حول محور السينات والصادات',
      latexFormula: 'V_x = \\pi \\int_{a}^{b} [y_1^2 - y_2^2] \\, dx, \\qquad V_y = \\pi \\int_{c}^{d} [x_1^2 - x_2^2] \\, dy',
      explanation: 'الحجم الدوراني يتطلب ضرب التكامل في الثابت $\\pi$. تأكد من تربيع كل دالة على حدة وليس تربيع الفرق بينهما.',
      examFrequency: 'امتحانات 2021، 2022، 2024 دور أول',
      examTip: 'خطأ شائع: نسيان معامل $\\pi$ في بداية القانون يضيع درجة السؤال في نموذج الإجابة.'
    },
    // STATICS
    {
      id: 'conc_stat_1',
      subjectCode: 'STATICS',
      subjectNameAr: 'الاستاتيكا',
      chapter: 'الاحتكاك والاتزان على مستوى مائل',
      title: 'قوة الاحتكاك النهائي وشروط وشك الانزلاق',
      latexFormula: 'F_s = \\mu_s R, \\quad \\lambda = \\text{زاوية الاحتكاك}, \\quad \\mu_s = \\tan \\lambda',
      explanation: 'إذا كان الجسم متزناً على وشك الانزلاق تحت تأثير وزنه فقط على مستوى مائل فإن زاوية ميل المستوى $\\theta = \\lambda$.',
      examFrequency: 'تكرر في جميع امتحانات الثانوية العامة دون استثناء',
      examTip: 'قوة الاحتكاك $F$ تكون دائماً في عكس اتجاه الحركة المحتملة أو وشك الحركة.'
    },
    {
      id: 'conc_stat_2',
      subjectCode: 'STATICS',
      subjectNameAr: 'الاستاتيكا',
      chapter: 'العزوم في المستوى والفراغ',
      title: 'عزم قوة حول نقطة باستخدام الضرب الاتجاهي',
      latexFormula: '\\vec{M}_O = \\vec{r} \\times \\vec{F} = \\begin{vmatrix} \\hat{i} & \\hat{j} & \\hat{k} \\\\ x & y & z \\\\ F_x & F_y & F_z \\end{vmatrix}',
      explanation: 'متجه الموضع $\\vec{r}$ يبدأ من النقطة المراد أخذ العزم حولها إلى أي نقطة تقع على خط عمل القوة (نقطة التأثير - نقطة العزم).',
      examFrequency: 'امتحانات 2022، 2023، 2025 تجريبي',
      examTip: 'طول العمود الساقط من النقطة على خط عمل القوة = $|\\vec{M}_O| / |\\vec{F}|$.'
    },
    {
      id: 'conc_stat_3',
      subjectCode: 'STATICS',
      subjectNameAr: 'الاستاتيكا',
      chapter: 'مركز الثقل وطريقة الكتل السالبة',
      title: 'إحداثيات مركز الثقل لمجموعة كتل نقطية وصفائح',
      latexFormula: 'X_{G} = \\frac{\\sum m_i x_i}{\\sum m_i}, \\qquad Y_{G} = \\frac{\\sum m_i y_i}{\\sum m_i}',
      explanation: 'عند اقتطاع جزء من صفيحة منتظمة (مثل قرص أو مربع)، تعامل مساحة الجزء المقتطع ككتلة سالبة في المعادلة.',
      examFrequency: 'مسألة ثابتة في نهاية ورقة الاستاتيكا',
      examTip: 'اختر نقطة الأصل (0, 0) عند أحد رؤوس الصفيحة لتسهيل حساب الإحداثيات الموجبة.'
    },
    // DYNAMICS
    {
      id: 'conc_dyn_1',
      subjectCode: 'DYNAMICS',
      subjectNameAr: 'الديناميكا',
      chapter: 'تفاضل وتكامل الدوال المتجهة',
      title: 'العجلة كدالة في الموضع أو الزمن',
      latexFormula: 'a = \\frac{dv}{dt}, \\qquad a = v \\frac{dv}{dx} \\quad (\\text{عندما تكون السرعة دالة في } x)',
      explanation: 'عندما تعطى السرعة $v$ كدالة في المسافة $x$، يجب استخدام الصورة $a = v \\frac{dv}{dx}$ وليس التفاضل بالنسبة للزمن مباشرة.',
      examFrequency: 'امتحانات 2021 دور أول، 2023 دور ثان، 2024 دور أول',
      examTip: 'التكامل المماثل: $\\int_{x_0}^{x} a \\, dx = \\int_{v_0}^{v} v \\, dv = \\frac{1}{2}(v^2 - v_0^2)$.'
    },
    {
      id: 'conc_dyn_2',
      subjectCode: 'DYNAMICS',
      subjectNameAr: 'الديناميكا',
      chapter: 'قوانين نيوتن وحركة المصاعد والبكرات',
      title: 'الوزن الظاهري وضغط الجسم على أرضية المصعد',
      latexFormula: 'N = m(g + a) \\quad (\\text{صاعد بعجلة }), \\qquad N = m(g - a) \\quad (\\text{هابط بعجلة })',
      explanation: 'إذا كان الوزن الظاهري $N > mg$ فالحركة صاعدة بتسارع أو هابطة بتقصير. انتبه إلى ضبط وحدات الكتلة (كجم) والعجلة ($m/s^2$).',
      examFrequency: 'تكرر بنسبة 100% في جميع دورات الامتحانات',
      examTip: 'إذا كان المطلوب قراءة الميزان بالثقل كيلوجرام (ث.كجم): اقسم الناتج بالنيوتن على 9.8.'
    },
    // ALGEBRA & SOLID GEOMETRY
    {
      id: 'conc_alg_1',
      subjectCode: 'ALGEBRA',
      subjectNameAr: 'الجبر والهندسة الفراغية',
      chapter: 'الأعداد المركبة والجذور التكعيبية للواحد',
      title: 'خواص الجذور التكعيبية للواحد الصحيح (أوميجا)',
      latexFormula: '1 + \\omega + \\omega^2 = 0, \\quad \\omega^3 = 1, \\quad \\omega - \\omega^2 = \\pm \\sqrt{3}i',
      explanation: 'أي مجموع لحدين يساوي سالب الحد الثالث: $1 + \\omega = -\\omega^2$. واستخدم $\\omega^4 = \\omega$ و $\\omega^5 = \\omega^2$.',
      examFrequency: 'امتحانات 2021، 2023، 2024 دور أول',
      examTip: 'في الكسور المتماثلة، اضرب الحد المطلق في البسط في $\\omega^3$ لأخذ عامل مشترك والاختصار السريع.'
    },
    {
      id: 'conc_geo_1',
      subjectCode: 'SOLID_GEO',
      subjectNameAr: 'الجبر والهندسة الفراغية',
      chapter: 'معادلة الخط المستقيم والمستوى في الفراغ',
      title: 'معادلة المستوى والبعد العمودي لنقطة عن مستوى',
      latexFormula: '\\vec{n} \\cdot \\vec{r} = \\vec{n} \\cdot \\vec{A} = d, \\qquad D = \\frac{|a x_1 + b y_1 + c z_1 + d|}{\\sqrt{a^2 + b^2 + c^2}}',
      explanation: '$\\vec{n} = (a, b, c)$ هو متجه الاتجاه العمودي على المستوى. البعد $D$ يعطي دائماً قيمة موجبة بفضل القيمة المطلقة.',
      examFrequency: 'مسألة مقالية أو بابل شيت مؤكدة في كل نموذج',
      examTip: 'لإيجاد قياس الزاوية بين مستقيم ومستوى: استخدم قانون الجيب $\\sin\\theta = \\frac{|\\vec{d} \\cdot \\vec{n}|}{|\\vec{d}| |\\vec{n}|}$.'
    }
  ];

  const handleCopyFormula = (id: string, formula: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredConcepts = concepts.filter((c) => {
    const matchesSubject = selectedSubject === 'ALL' || c.subjectCode === selectedSubject;
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.chapter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.latexFormula.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="no-print space-y-6">
        {/* Top Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-blue-950/70 border border-emerald-800/40 p-6 lg:p-7 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                كتيب المفاهيم الرسمي التفاعلي لوزارة التربية والتعليم
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                القوانين والمتطابقات الرسمية المعتمدة في لجان الامتحان
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                مرجع شامل مصنف حسب فروع الرياضيات الأربعة (التفاضل، الجبر والفراغية، الاستاتيكا، والديناميكا) مع تحليل أماكن ورودها في امتحانات الثانوية العامة السابقة ونصائح الموجهين.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleOpenPrintModal('all')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/30"
                title="تصدير الكتيب بالكامل إلى PDF أو الطباعة المعيارية A4 (Ctrl+P)"
              >
                <Download className="w-4 h-4" />
                <span>تصدير إلى PDF ثم إتاحة الطباعة (Ctrl+P)</span>
              </button>

              <button
                onClick={() => handleOpenPrintModal('current', 4)}
                className="bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-800"
                title="تصدير الصفحة الحالية إلى PDF أو طباعتها"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>تصدير / طباعة الصفحة الحالية</span>
              </button>
            </div>
          </div>
        </div>

        {/* View Mode Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setDisplayMode('pdf_overlay')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                displayMode === 'pdf_overlay'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>عرض وثيقة الكتيب الرسمي A4 (مع طبقة التظليل والملاحظات)</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-mono">
                تفاعلي
              </span>
            </button>

            <button
              onClick={() => setDisplayMode('cards')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                displayMode === 'cards'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>بنك القوانين والبطاقات السريعة</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 px-3 py-1">
            <Highlighter className="w-3.5 h-3.5 text-amber-400" />
            <span>تظليل النصوص الفسفوري</span>
            <span className="text-slate-600">•</span>
            <StickyNote className="w-3.5 h-3.5 text-blue-400" />
            <span>ملصقات وملاحظات لاصقة محفوظة</span>
          </div>
        </div>

        {/* PDF DOCUMENT VIEWER WITH ANNOTATION OVERLAY */}
        {displayMode === 'pdf_overlay' && (
          <ConceptBookletPdfViewer
            onOpenPrintModal={(page) => handleOpenPrintModal('current', page)}
          />
        )}

        {/* CARDS AND QUICK SEARCH MODE */}
        {displayMode === 'cards' && (
          <>
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
              {/* Subject Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { code: 'ALL', label: 'جميع القوانين' },
                  { code: 'CALCULUS', label: 'التفاضل والتكامل' },
                  { code: 'STATICS', label: 'الاستاتيكا' },
                  { code: 'DYNAMICS', label: 'الديناميكا' },
                  { code: 'ALGEBRA', label: 'الجبر' },
                  { code: 'SOLID_GEO', label: 'الهندسة الفراغية' }
                ].map((tab) => (
                  <button
                    key={tab.code}
                    onClick={() => setSelectedSubject(tab.code as any)}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap font-medium ${
                      selectedSubject === tab.code
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                <input
                  id="contextual-search-input"
                  data-search-input="true"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن قانون، دالة، أو متطابقة... (Ctrl+F)"
                  title="البحث السريع في القوانين والمفاهيم (Ctrl+F)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Concepts Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 printable-content">
              {filteredConcepts.map((item) => {
                const isBookmarked = bookmarkedIds.includes(item.id);
                const isCopied = copiedId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-4 shadow-xl flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {item.subjectNameAr}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">{item.chapter}</span>
                          </div>
                          <h4 className="text-base font-bold text-white">{item.title}</h4>
                        </div>

                        <div className="flex items-center gap-1.5 no-print">
                          <button
                            onClick={() => toggleBookmark(item.id)}
                            title="حفظ في المفضلة"
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isBookmarked
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                            }`}
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCopyFormula(item.id, item.latexFormula)}
                            title="نسخ صيغة LaTeX"
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
                          >
                            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* KaTeX Rendered Formula Box */}
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-center overflow-x-auto">
                        <MathRenderer latex={item.latexFormula} block={true} className="text-base sm:text-lg text-emerald-300 font-bold" />
                      </div>

                      {/* Explanation text */}
                      <p className="text-xs text-slate-300 leading-relaxed">{item.explanation}</p>
                    </div>

                    {/* Exam frequency & Tip footer */}
                    <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">التكرار في الامتحانات:</span>
                        <span className="text-amber-300 font-semibold">{item.examFrequency}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-[11px] text-emerald-200">
                        <span className="font-bold text-emerald-400">نصيحة الموجه: </span>
                        <MixedTextRenderer text={item.examTip} className="inline" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Print-to-PDF Configuration Modal */}
      <BookletPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        currentPageNumber={activePageForPrint}
        currentPageTitle={`صفحة ${activePageForPrint}`}
        onConfirmPrint={handleConfirmPrint}
      />

      {/* Standardized A4 PDF Print Document (Visible only when printing) */}
      <BookletStandardPrintDocument
        settings={printSettings}
        highlights={getStoredAnnotations().highlights}
        stickyNotes={getStoredAnnotations().stickyNotes}
        cardsList={filteredConcepts}
      />
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  Highlighter,
  StickyNote,
  MousePointer,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Printer,
  Sparkles,
  Download,
  Check,
  X,
  Plus,
  BookOpen,
  Filter,
  Search,
  AlertCircle,
  Clock,
  Pin,
  ListFilter,
  Eye,
  RotateCcw,
  Tag,
  Copy
} from 'lucide-react';
import { MathRenderer, MixedTextRenderer } from './MathRenderer';
import {
  HighlightAnnotation,
  StickyNoteAnnotation,
  HighlightColor,
  StickyNoteColor,
  BookletPageData,
  HighlightRect
} from '../types/bookletAnnotations';
import { OFFICIAL_BOOKLET_PAGES, INITIAL_BOOKLET_ANNOTATIONS } from '../data/conceptBookletPages';

interface ConceptBookletPdfViewerProps {
  onFormulaSelect?: (formula: string) => void;
  onOpenPrintModal?: (currentPage: number) => void;
}

const STORAGE_KEY = 'thanaweya_booklet_annotations_v2';

export const ConceptBookletPdfViewer: React.FC<ConceptBookletPdfViewerProps> = ({
  onFormulaSelect,
  onOpenPrintModal
}) => {
  // Page & View state
  const [currentPage, setCurrentPage] = useState<number>(4); // Default to Statics (high-yield)
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 80, 100, 120, 140 %
  const [showAnnotationsDrawer, setShowAnnotationsDrawer] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Active Tool state
  const [activeTool, setActiveTool] = useState<'select' | 'highlighter' | 'sticky_note' | 'eraser'>('select');
  const [activeColor, setActiveColor] = useState<HighlightColor>('yellow');

  // Annotations state (Highlights & Sticky Notes)
  const [highlights, setHighlights] = useState<HighlightAnnotation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.highlights) return parsed.highlights;
      }
    } catch (e) {
      console.error('Error loading annotations:', e);
    }
    return INITIAL_BOOKLET_ANNOTATIONS.highlights;
  });

  const [stickyNotes, setStickyNotes] = useState<StickyNoteAnnotation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.stickyNotes) return parsed.stickyNotes;
      }
    } catch (e) {
      console.error('Error loading sticky notes:', e);
    }
    return INITIAL_BOOKLET_ANNOTATIONS.stickyNotes;
  });

  // Floating text selection popup
  const [selectionPopup, setSelectionPopup] = useState<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
    rects: HighlightRect[];
  }>({
    visible: false,
    x: 0,
    y: 0,
    text: '',
    rects: []
  });

  // Dragging sticky note state
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Drawer filters
  const [drawerSearch, setDrawerSearch] = useState<string>('');
  const [drawerFilterTag, setDrawerFilterTag] = useState<string>('ALL');

  // References
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ highlights, stickyNotes })
      );
    } catch (e) {
      console.error('Failed to save booklet annotations to localStorage:', e);
    }
  }, [highlights, stickyNotes]);

  // Current page data
  const pageData = OFFICIAL_BOOKLET_PAGES.find((p) => p.pageNumber === currentPage) || OFFICIAL_BOOKLET_PAGES[0];
  const currentPageHighlights = highlights.filter((h) => h.pageNumber === currentPage);
  const currentPageStickyNotes = stickyNotes.filter((s) => s.pageNumber === currentPage);

  // Highlight color maps
  const colorStyles: Record<
    HighlightColor,
    { bg: string; border: string; text: string; label: string; dot: string; glow: string }
  > = {
    yellow: {
      bg: 'bg-yellow-400/35',
      border: 'border-yellow-400/80',
      text: 'text-yellow-300',
      label: 'أصفر فسفوري',
      dot: 'bg-yellow-400',
      glow: 'rgba(234, 179, 8, 0.4)'
    },
    emerald: {
      bg: 'bg-emerald-400/35',
      border: 'border-emerald-400/80',
      text: 'text-emerald-300',
      label: 'أخضر زمردي',
      dot: 'bg-emerald-400',
      glow: 'rgba(16, 185, 129, 0.4)'
    },
    cyan: {
      bg: 'bg-sky-400/35',
      border: 'border-sky-400/80',
      text: 'text-sky-300',
      label: 'أزرق سماوي',
      dot: 'bg-sky-400',
      glow: 'rgba(14, 165, 233, 0.4)'
    },
    pink: {
      bg: 'bg-pink-400/35',
      border: 'border-pink-400/80',
      text: 'text-pink-300',
      label: 'وردي فاقع',
      dot: 'bg-pink-400',
      glow: 'rgba(236, 72, 153, 0.4)'
    },
    amber: {
      bg: 'bg-amber-400/35',
      border: 'border-amber-400/80',
      text: 'text-amber-300',
      label: 'برتقالي تحذيري',
      dot: 'bg-amber-400',
      glow: 'rgba(249, 115, 22, 0.4)'
    }
  };

  const stickyNoteColorStyles: Record<
    StickyNoteColor,
    {
      cardBg: string;
      headerBg: string;
      border: string;
      text: string;
      pinBg: string;
    }
  > = {
    yellow: {
      cardBg: 'bg-yellow-950/90',
      headerBg: 'bg-yellow-500/20',
      border: 'border-yellow-500/60',
      text: 'text-yellow-200',
      pinBg: 'bg-yellow-500'
    },
    emerald: {
      cardBg: 'bg-emerald-950/90',
      headerBg: 'bg-emerald-500/20',
      border: 'border-emerald-500/60',
      text: 'text-emerald-200',
      pinBg: 'bg-emerald-500'
    },
    cyan: {
      cardBg: 'bg-sky-950/90',
      headerBg: 'bg-sky-500/20',
      border: 'border-sky-500/60',
      text: 'text-sky-200',
      pinBg: 'bg-sky-500'
    },
    pink: {
      cardBg: 'bg-pink-950/90',
      headerBg: 'bg-pink-500/20',
      border: 'border-pink-500/60',
      text: 'text-pink-200',
      pinBg: 'bg-pink-500'
    },
    purple: {
      cardBg: 'bg-purple-950/90',
      headerBg: 'bg-purple-500/20',
      border: 'border-purple-500/60',
      text: 'text-purple-200',
      pinBg: 'bg-purple-500'
    },
    amber: {
      cardBg: 'bg-amber-950/90',
      headerBg: 'bg-amber-500/20',
      border: 'border-amber-500/60',
      text: 'text-amber-200',
      pinBg: 'bg-amber-500'
    }
  };

  // Handle native text selection on the page content to trigger overlay actions
  const handleMouseUp = () => {
    if (activeTool === 'eraser' || activeTool === 'sticky_note') return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      // Don't close if clicking inside popup
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 2) return;

    if (!pageContainerRef.current) return;
    const pageRect = pageContainerRef.current.getBoundingClientRect();
    const range = selection.getRangeAt(0);
    const clientRects = Array.from(range.getClientRects());

    if (clientRects.length === 0) return;

    // Convert client rects to percentage relative to page container
    const relativeRects: HighlightRect[] = clientRects.map((r) => {
      const top = ((r.top - pageRect.top) / pageRect.height) * 100;
      const left = ((r.left - pageRect.left) / pageRect.width) * 100;
      const width = (r.width / pageRect.width) * 100;
      const height = (r.height / pageRect.height) * 100;
      return {
        top: Math.max(0, top),
        left: Math.max(0, left),
        width: Math.min(100, width),
        height: Math.min(100, height)
      };
    });

    // Position the popup right above the first rect
    const firstRect = clientRects[0];
    const popupX = Math.min(
      Math.max(20, firstRect.left - pageRect.left + firstRect.width / 2),
      pageRect.width - 160
    );
    const popupY = Math.max(10, firstRect.top - pageRect.top - 48);

    setSelectionPopup({
      visible: true,
      x: popupX,
      y: popupY,
      text,
      rects: relativeRects
    });
  };

  // Close selection popup when clicking outside
  const handlePageClick = (e: React.MouseEvent) => {
    // If sticky note dropper tool is active, place sticky note at click location!
    if (activeTool === 'sticky_note') {
      if (!pageContainerRef.current) return;
      const rect = pageContainerRef.current.getBoundingClientRect();
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

      // Bound within safe area
      const boundedX = Math.min(Math.max(5, xPercent), 85);
      const boundedY = Math.min(Math.max(5, yPercent), 88);

      const newNote: StickyNoteAnnotation = {
        id: `sn_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        pageNumber: currentPage,
        x: boundedX,
        y: boundedY,
        color: (activeColor as any) || 'yellow',
        tag: '💡 ملاحظة هامة',
        content: '',
        isCollapsed: false,
        createdAt: Date.now()
      };

      setStickyNotes((prev) => [...prev, newNote]);
      // Reset tool to select or keep it
      return;
    }

    // Dismiss selection popup if clicking empty area
    const target = e.target as HTMLElement;
    if (!target.closest('.selection-popup-menu')) {
      setSelectionPopup((prev) => ({ ...prev, visible: false }));
    }
  };

  // Apply highlight from current selection
  const applyHighlight = (color: HighlightColor = activeColor) => {
    if (!selectionPopup.visible || selectionPopup.rects.length === 0) return;

    const newHighlight: HighlightAnnotation = {
      id: `hl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      pageNumber: currentPage,
      color,
      rects: selectionPopup.rects,
      selectedText: selectionPopup.text,
      createdAt: Date.now()
    };

    setHighlights((prev) => [...prev, newHighlight]);
    setSelectionPopup({ visible: false, x: 0, y: 0, text: '', rects: [] });
    window.getSelection()?.removeAllRanges();
  };

  // Create a sticky note attached to the selected text
  const createStickyNoteFromSelection = () => {
    if (!selectionPopup.visible) return;

    const highlightId = `hl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newHighlight: HighlightAnnotation = {
      id: highlightId,
      pageNumber: currentPage,
      color: activeColor,
      rects: selectionPopup.rects,
      selectedText: selectionPopup.text,
      createdAt: Date.now()
    };

    // Calculate position near the first rect
    const firstRect = selectionPopup.rects[0];
    const noteX = Math.min(Math.max(5, firstRect.left + firstRect.width + 2), 70);
    const noteY = Math.min(Math.max(5, firstRect.top), 80);

    const noteId = `sn_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newNote: StickyNoteAnnotation = {
      id: noteId,
      pageNumber: currentPage,
      x: noteX,
      y: noteY,
      color: activeColor as any,
      tag: '⭐ ملحوظة على قانون',
      content: `تعليق على: "${selectionPopup.text.slice(0, 40)}..."`,
      isCollapsed: false,
      createdAt: Date.now(),
      linkedHighlightId: highlightId
    };

    newHighlight.noteId = noteId;

    setHighlights((prev) => [...prev, newHighlight]);
    setStickyNotes((prev) => [...prev, newNote]);
    setSelectionPopup({ visible: false, x: 0, y: 0, text: '', rects: [] });
    window.getSelection()?.removeAllRanges();
  };

  // Copy selected text
  const handleCopySelection = () => {
    if (selectionPopup.text) {
      navigator.clipboard.writeText(selectionPopup.text);
      setCopiedText('تم النسخ!');
      setTimeout(() => setCopiedText(null), 2000);
      setSelectionPopup((prev) => ({ ...prev, visible: false }));
    }
  };

  // Delete a highlight
  const handleDeleteHighlight = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  };

  // Delete a sticky note
  const handleDeleteStickyNote = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setStickyNotes((prev) => prev.filter((s) => s.id !== id));
  };

  // Toggle collapse state for sticky note
  const toggleStickyNoteCollapse = (id: string) => {
    setStickyNotes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isCollapsed: !s.isCollapsed } : s))
    );
  };

  // Update sticky note content
  const updateStickyNote = (id: string, updates: Partial<StickyNoteAnnotation>) => {
    setStickyNotes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  // Sticky note dragging handlers
  const handleNoteDragStart = (e: React.MouseEvent, note: StickyNoteAnnotation) => {
    e.stopPropagation();
    if (!pageContainerRef.current) return;
    const pageRect = pageContainerRef.current.getBoundingClientRect();
    const currentX = (note.x / 100) * pageRect.width;
    const currentY = (note.y / 100) * pageRect.height;

    setDraggingNoteId(note.id);
    setDragOffset({
      x: e.clientX - (pageRect.left + currentX),
      y: e.clientY - (pageRect.top + currentY)
    });
  };

  const handleOverlayMouseMove = (e: React.MouseEvent) => {
    if (!draggingNoteId || !pageContainerRef.current) return;
    const pageRect = pageContainerRef.current.getBoundingClientRect();

    const newX = e.clientX - pageRect.left - dragOffset.x;
    const newY = e.clientY - pageRect.top - dragOffset.y;

    const percentX = Math.min(Math.max(2, (newX / pageRect.width) * 100), 85);
    const percentY = Math.min(Math.max(2, (newY / pageRect.height) * 100), 90);

    setStickyNotes((prev) =>
      prev.map((s) =>
        s.id === draggingNoteId ? { ...s, x: percentX, y: percentY } : s
      )
    );
  };

  const handleOverlayMouseUp = () => {
    setDraggingNoteId(null);
  };

  // Quick insert math into note
  const insertFormulaToNote = (noteId: string, snippet: string) => {
    setStickyNotes((prev) =>
      prev.map((s) => {
        if (s.id === noteId) {
          return {
            ...s,
            content: s.content ? `${s.content} ${snippet}` : snippet
          };
        }
        return s;
      })
    );
  };

  // Reset to original clean state
  const handleResetAnnotations = () => {
    if (window.confirm('هل تريد إعادة تعيين التظليلات والملاحظات للنسخة الافتراضية؟')) {
      setHighlights(INITIAL_BOOKLET_ANNOTATIONS.highlights);
      setStickyNotes(INITIAL_BOOKLET_ANNOTATIONS.stickyNotes);
    }
  };

  // Clear current page annotations
  const handleClearCurrentPage = () => {
    if (window.confirm(`هل أنت متأكد من مسح جميع التظليلات والملاحظات في الصفحة ${currentPage}؟`)) {
      setHighlights((prev) => prev.filter((h) => h.pageNumber !== currentPage));
      setStickyNotes((prev) => prev.filter((s) => s.pageNumber !== currentPage));
    }
  };

  // Jump to page from drawer or dropdown
  const jumpToPage = (pageNum: number) => {
    setCurrentPage(pageNum);
    setShowAnnotationsDrawer(false);
  };

  return (
    <div
      className="space-y-4"
      onMouseMove={handleOverlayMouseMove}
      onMouseUp={handleOverlayMouseUp}
    >
      {/* 1. TOP TOOLBAR & CONTROLS */}
      <div className="bg-slate-900/95 backdrop-blur border border-slate-800 rounded-2xl p-3 shadow-xl sticky top-2 z-30 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Main Action Tool Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {/* Tool: Pointer */}
            <button
              onClick={() => setActiveTool('select')}
              title="مؤشر التحديد والتنقل (Select & Move)"
              className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'select'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MousePointer className="w-4 h-4" />
              <span className="hidden sm:inline">تحديد ونصوص</span>
            </button>

            {/* Tool: Highlighter */}
            <button
              onClick={() => setActiveTool('highlighter')}
              title="قلم التظليل الفسفوري (Highlighter)"
              className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'highlighter'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Highlighter className="w-4 h-4" />
              <span className="hidden sm:inline">أداة التظليل</span>
            </button>

            {/* Tool: Sticky Note Dropper */}
            <button
              onClick={() => setActiveTool('sticky_note')}
              title="إضافة ملصق ملاحظات (Click on page to drop Sticky Note)"
              className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'sticky_note'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <StickyNote className="w-4 h-4" />
              <span className="hidden sm:inline">ملاحظة لاصقة</span>
            </button>

            {/* Tool: Eraser */}
            <button
              onClick={() => setActiveTool('eraser')}
              title="أداة المسح والحذف"
              className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'eraser'
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">ممحاة</span>
            </button>
          </div>

          {/* Color Palette Picker */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium ml-1 hidden md:inline">اللون:</span>
            {(['yellow', 'emerald', 'cyan', 'pink', 'amber'] as HighlightColor[]).map((c) => (
              <button
                key={c}
                onClick={() => {
                  setActiveColor(c);
                  if (activeTool === 'select' || activeTool === 'eraser') {
                    setActiveTool('highlighter');
                  }
                }}
                title={colorStyles[c].label}
                className={`w-6 h-6 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                  colorStyles[c].dot
                } ${
                  activeColor === c
                    ? 'ring-2 ring-white scale-110 shadow-md'
                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`}
              >
                {activeColor === c && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
              </button>
            ))}
          </div>

          {/* Page Navigation & Branch Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="الصفحة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="px-2 py-0.5 text-center min-w-[70px]">
                <span className="text-xs font-bold text-white font-mono">{currentPage}</span>
                <span className="text-[10px] text-slate-500 mx-1">/</span>
                <span className="text-xs text-slate-400 font-mono">{OFFICIAL_BOOKLET_PAGES.length}</span>
              </div>

              <button
                disabled={currentPage >= OFFICIAL_BOOKLET_PAGES.length}
                onClick={() => setCurrentPage((p) => Math.min(OFFICIAL_BOOKLET_PAGES.length, p + 1))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="الصفحة التالية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Branch Dropdown */}
            <select
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer hidden lg:block"
            >
              {OFFICIAL_BOOKLET_PAGES.map((p) => (
                <option key={p.pageNumber} value={p.pageNumber}>
                  ص {p.pageNumber}: {p.subjectNameAr} - {p.branchAr}
                </option>
              ))}
            </select>
          </div>

          {/* Zoom & Extras */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setZoomLevel((z) => Math.max(80, z - 10))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                title="تصغير"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-slate-300 px-1">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                title="تكبير"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Annotations Drawer Toggle */}
            <button
              onClick={() => setShowAnnotationsDrawer(!showAnnotationsDrawer)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                showAnnotationsDrawer
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <ListFilter className="w-4 h-4 text-emerald-400" />
              <span>فهرس الملاحظات</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                {highlights.length + stickyNotes.length}
              </span>
            </button>

            {/* Print / Export */}
            <button
              onClick={() => (onOpenPrintModal ? onOpenPrintModal(currentPage) : window.print())}
              title="تصدير الصفحة أو الكتيب إلى PDF ثم إتاحة الطباعة المعيارية A4"
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-bold hidden sm:inline">تصدير PDF / طباعة</span>
            </button>
          </div>
        </div>

        {/* Informational Guidance bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-emerald-400">💡 كيفية الاستخدام:</span>
            {activeTool === 'select' && (
              <span>حدد أي نص بالماوس لإظهار قائمة التظليل وإضافة الملاحظات اللاصقة فوراً.</span>
            )}
            {activeTool === 'highlighter' && (
              <span>وضع التظليل مفعل: حدد النص أو المعادلات لتظليلها باللون المختار تلقائياً.</span>
            )}
            {activeTool === 'sticky_note' && (
              <span className="text-blue-300">
                انقر في أي مكان داخل صفحة الكتيب لإسقاط ملاحظة لاصقة (Sticky Note) في ذلك الموضع بدقة.
              </span>
            )}
            {activeTool === 'eraser' && (
              <span className="text-rose-300">
                وضع الممحاة: انقر فوق أي تظليل أو ملاحظة لحذفها، أو استخدم زر مسح الصفحة.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(currentPageHighlights.length > 0 || currentPageStickyNotes.length > 0) && (
              <button
                onClick={handleClearCurrentPage}
                className="text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>مسح تعليقات هذه الصفحة ({currentPageHighlights.length + currentPageStickyNotes.length})</span>
              </button>
            )}
            <button
              onClick={handleResetAnnotations}
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer mr-3"
            >
              <RotateCcw className="w-3 h-3" />
              <span>استعادة التظليلات الافتراضية</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN DOCUMENT VIEW & INTERACTIVE OVERLAY */}
      <div className="flex gap-4 items-start justify-center">
        {/* Document Canvas Container */}
        <div
          className="relative transition-all duration-200 shadow-2xl rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 max-w-4xl w-full"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
        >
          {/* THE AUTHENTIC MINISTRY BOOKLET PAGE (A4 Look) */}
          <div
            ref={pageContainerRef}
            onClick={handlePageClick}
            onMouseUp={handleMouseUp}
            className="relative bg-white text-slate-900 p-8 sm:p-12 min-h-[1050px] select-text shadow-inner overflow-hidden font-sans border-t-8 border-t-emerald-700"
          >
            {/* Ministry Watermark */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.035] select-none rotate-[-30deg]">
              <div className="text-center space-y-4">
                <div className="text-7xl font-extrabold font-serif">جمهورية مصر العربية</div>
                <div className="text-5xl font-bold">وزارة التربية والتعليم والتعليم الفني</div>
                <div className="text-4xl font-mono">نسخة اختبارات الثانوية العامة الرسمية</div>
              </div>
            </div>

            {/* Official Header */}
            <div className="border-b-2 border-emerald-900 pb-4 mb-6 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-emerald-900 tracking-wider">
                  جمهورية مصر العربية • وزارة التربية والتعليم والتعليم الفني
                </div>
                <div className="text-xs text-slate-600 font-semibold">
                  مجلد مفاهيم شهادة إتمام الدراسة الثانوية العامة (الصف الثالث الثانوي - شعبة الرياضيات)
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                  {pageData.title}
                </h2>
                <div className="text-xs font-bold text-emerald-800">
                  {pageData.subtitle}
                </div>
              </div>

              <div className="text-left shrink-0">
                <div className="inline-block border-2 border-slate-900 px-3 py-1 text-center rounded bg-slate-50">
                  <div className="text-[10px] font-bold text-slate-600">الصفحة</div>
                  <div className="text-xl font-black font-mono text-slate-950">{pageData.pageNumber}</div>
                </div>
                <div className="text-[10px] text-slate-600 font-mono mt-1 text-center">
                  {pageData.subjectCode}
                </div>
              </div>
            </div>

            {/* Page Content Sections */}
            <div className="space-y-6 text-sm text-slate-800 leading-relaxed">
              {pageData.sections.map((sec) => (
                <div
                  key={sec.id}
                  className="space-y-3 p-4 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center gap-2 border-r-4 border-r-emerald-700 pr-2">
                    <h3 className="font-bold text-base text-slate-950">{sec.title}</h3>
                  </div>

                  {/* Latex formula box if present */}
                  {sec.latex && (
                    <div className="p-4 my-2 rounded-lg bg-emerald-50/60 border border-emerald-200 text-center text-emerald-950 font-bold overflow-x-auto">
                      <MathRenderer latex={sec.latex} block={true} className="text-base sm:text-lg text-emerald-950" />
                      {onFormulaSelect && (
                        <div className="mt-2 flex justify-center">
                          <button
                            onClick={() => onFormulaSelect(sec.latex!)}
                            className="text-[11px] text-emerald-700 hover:text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-300 shadow-xs cursor-pointer font-medium"
                          >
                            استخدام الصيغة في المساعد الذكي
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-700">{sec.description}</p>

                  {/* Bullet points */}
                  {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                    <ul className="space-y-1.5 list-disc list-inside text-xs sm:text-sm text-slate-800 pr-2">
                      {sec.bulletPoints.map((bp, idx) => (
                        <li key={idx} className="leading-normal">
                          <MixedTextRenderer text={bp} className="inline" />
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Rule Box */}
                  {sec.ruleBox && (
                    <div className="p-3.5 my-2 rounded-lg bg-amber-50/60 border border-amber-300 space-y-1.5">
                      <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span>{sec.ruleBox.title}</span>
                      </div>
                      <div className="text-center py-1">
                        <MathRenderer latex={sec.ruleBox.formula} block={true} className="text-amber-950 font-bold text-sm sm:text-base" />
                      </div>
                      {sec.ruleBox.notes && (
                        <div className="text-[11px] text-amber-800 font-medium">
                          {sec.ruleBox.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Exam alert */}
                  {sec.examAlert && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{sec.examAlert}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Official Footer */}
            <div className="mt-12 pt-4 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>{pageData.footerNote}</span>
              <span className="font-mono">صفحة {pageData.pageNumber} من 10</span>
            </div>

            {/* 3. INTERACTIVE OVERLAY LAYER (Absolute on top of PDF sheet) */}
            <div
              ref={overlayRef}
              className={`absolute inset-0 z-10 pointer-events-none ${
                activeTool === 'sticky_note' ? 'cursor-crosshair' : ''
              }`}
            >
              {/* RENDER HIGHLIGHT RECTANGLES */}
              {currentPageHighlights.map((hl) => {
                const style = colorStyles[hl.color] || colorStyles.yellow;
                return (
                  <React.Fragment key={hl.id}>
                    {hl.rects.map((rect, idx) => (
                      <div
                        key={idx}
                        onClick={(e) => {
                          if (activeTool === 'eraser') {
                            handleDeleteHighlight(hl.id, e);
                          }
                        }}
                        style={{
                          top: `${rect.top}%`,
                          left: `${rect.left}%`,
                          width: `${rect.width}%`,
                          height: `${rect.height}%`,
                          boxShadow: `0 0 10px ${style.glow}`
                        }}
                        className={`absolute rounded pointer-events-auto transition-opacity group cursor-pointer ${
                          style.bg
                        } ${style.border} border-b-2 ${
                          activeTool === 'eraser' ? 'hover:bg-rose-500/50 hover:border-rose-600' : ''
                        }`}
                        title={hl.selectedText ? `تظليل: ${hl.selectedText}` : 'تظليل'}
                      >
                        {/* Hover delete button when activeTool is eraser or hover */}
                        <button
                          onClick={(e) => handleDeleteHighlight(hl.id, e)}
                          className="absolute -top-3 -right-3 p-1 rounded-full bg-slate-900 text-white opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition-all shadow-md z-20"
                          title="حذف هذا التظليل"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </React.Fragment>
                );
              })}

              {/* RENDER STICKY NOTES */}
              {currentPageStickyNotes.map((note) => {
                const noteStyle = stickyNoteColorStyles[note.color] || stickyNoteColorStyles.yellow;

                if (note.isCollapsed) {
                  // Collapsed Pin View
                  return (
                    <div
                      key={note.id}
                      onClick={() => {
                        if (activeTool === 'eraser') {
                          handleDeleteStickyNote(note.id);
                        } else {
                          toggleStickyNoteCollapse(note.id);
                        }
                      }}
                      onMouseDown={(e) => handleNoteDragStart(e, note)}
                      style={{
                        top: `${note.y}%`,
                        left: `${note.x}%`
                      }}
                      className={`absolute pointer-events-auto cursor-grab active:cursor-grabbing transition-transform hover:scale-110 z-20 flex items-center gap-1.5 p-1.5 pr-2.5 rounded-full shadow-xl border ${
                        noteStyle.cardBg
                      } ${noteStyle.border}`}
                      title="انقر لفتح الملاحظة اللاصقة الكاملة أو اسحب لتغيير الموضع"
                    >
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-slate-950 font-bold ${noteStyle.pinBg}`}>
                        <Pin className="w-2.5 h-2.5 rotate-45" />
                      </div>
                      <span className="text-[11px] font-bold text-white max-w-[120px] truncate">
                        {note.tag || 'ملاحظة'}
                      </span>
                    </div>
                  );
                }

                // Expanded Sticky Note Card View
                return (
                  <div
                    key={note.id}
                    style={{
                      top: `${note.y}%`,
                      left: `${note.x}%`,
                      maxWidth: '260px',
                      width: '240px'
                    }}
                    className={`absolute pointer-events-auto rounded-xl shadow-2xl border transition-all z-20 text-xs backdrop-blur-md ${
                      noteStyle.cardBg
                    } ${noteStyle.border}`}
                  >
                    {/* Note Header / Drag Handle */}
                    <div
                      onMouseDown={(e) => handleNoteDragStart(e, note)}
                      className={`p-2.5 rounded-t-xl cursor-grab active:cursor-grabbing flex items-center justify-between gap-2 border-b ${
                        noteStyle.headerBg
                      } ${noteStyle.border}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Pin className="w-3.5 h-3.5 text-white rotate-45" />
                        <span className="font-bold text-white text-[11px] truncate">{note.tag}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleStickyNoteCollapse(note.id)}
                          className="p-1 text-slate-300 hover:text-white rounded hover:bg-black/30 transition-all cursor-pointer"
                          title="تصغير الملاحظة إلى دبوس"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteStickyNote(note.id, e)}
                          className="p-1 text-rose-300 hover:text-rose-100 rounded hover:bg-rose-900/50 transition-all cursor-pointer"
                          title="حذف الملاحظة"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Note Content Area */}
                    <div className="p-2.5 space-y-2">
                      <textarea
                        value={note.content}
                        onChange={(e) => updateStickyNote(note.id, { content: e.target.value })}
                        placeholder="اكتب ملاحظتك أو تعليقك على القانون هنا..."
                        rows={3}
                        className={`w-full bg-black/40 border ${noteStyle.border} rounded-lg p-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white resize-none font-sans leading-relaxed`}
                      />

                      {/* Tag selector chips */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {['⚠️ فخ امتحاني', '💡 فكرة حل', '⭐ متوقع', '📝 تذكير'].map((tag) => (
                          <button
                            key={tag}
                            onClick={() => updateStickyNote(note.id, { tag })}
                            className={`text-[9px] px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                              note.tag === tag
                                ? 'bg-white text-slate-950 font-bold'
                                : 'bg-black/30 text-slate-300 hover:text-white'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>

                      {/* Math Quick Inserts */}
                      <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                        <span>إدراج سريع:</span>
                        <div className="flex items-center gap-1">
                          {['+ C', '\\frac{dy}{dx}', '\\mu_s', '\\pi', '\\omega'].map((formula) => (
                            <button
                              key={formula}
                              onClick={() => insertFormulaToNote(note.id, `$${formula}$`)}
                              className="px-1.5 py-0.5 rounded bg-black/40 hover:bg-black/70 text-slate-300 font-mono text-[10px] cursor-pointer"
                            >
                              {formula}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color switch buttons inside note */}
                      <div className="flex items-center justify-between pt-1 border-t border-white/10">
                        <div className="flex items-center gap-1">
                          {(['yellow', 'emerald', 'cyan', 'pink', 'purple', 'amber'] as StickyNoteColor[]).map((clr) => (
                            <button
                              key={clr}
                              onClick={() => updateStickyNote(note.id, { color: clr })}
                              className={`w-3.5 h-3.5 rounded-full transition-transform ${
                                stickyNoteColorStyles[clr].pinBg
                              } ${note.color === clr ? 'ring-1 ring-white scale-125' : 'opacity-60 hover:opacity-100'}`}
                            />
                          ))}
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 4. FLOATING SELECTION POPUP MENU (Appears right at selected text) */}
            {selectionPopup.visible && (
              <div
                style={{
                  top: `${selectionPopup.y}px`,
                  left: `${selectionPopup.x}px`
                }}
                className="selection-popup-menu absolute z-30 -translate-x-1/2 flex items-center gap-1 bg-slate-900 text-white px-2 py-1.5 rounded-xl shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Apply Highlight Button */}
                <button
                  onClick={() => applyHighlight(activeColor)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                  <span>تظليل النص</span>
                </button>

                {/* Add Sticky Note linked to selection */}
                <button
                  onClick={createStickyNoteFromSelection}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                >
                  <StickyNote className="w-3.5 h-3.5" />
                  <span>ملاحظة لاصقة</span>
                </button>

                {/* Copy selection */}
                <button
                  onClick={handleCopySelection}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="نسخ النص"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {/* Dismiss */}
                <button
                  onClick={() => setSelectionPopup((prev) => ({ ...prev, visible: false }))}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 5. ANNOTATIONS DRAWER / SIDEBAR (All Notes & Highlights Across All Pages) */}
        {showAnnotationsDrawer && (
          <div className="w-80 shrink-0 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-2xl h-[900px] flex flex-col justify-between">
            <div className="space-y-3 overflow-hidden flex flex-col flex-1">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ListFilter className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">فهرس التحشيات والملاحظات</h4>
                </div>
                <button
                  onClick={() => setShowAnnotationsDrawer(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search & Tag Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
                  <input
                    type="text"
                    value={drawerSearch}
                    onChange={(e) => setDrawerSearch(e.target.value)}
                    placeholder="ابحث في ملاحظاتك وتظليلاتك..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-8 pl-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
                  {['ALL', '⚠️ فخ امتحاني', '💡 فكرة حل', '⭐ متوقع', 'تظليل'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setDrawerFilterTag(tag)}
                      className={`px-2 py-0.5 rounded-lg whitespace-nowrap cursor-pointer ${
                        drawerFilterTag === tag
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {tag === 'ALL' ? 'الكل' : tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* List of Sticky Notes & Highlights */}
              <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
                {/* Notes section */}
                <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                  <span>الملاحظات اللاصقة ({stickyNotes.length})</span>
                </div>

                {stickyNotes
                  .filter((n) => {
                    const matchesSearch =
                      !drawerSearch ||
                      n.content.toLowerCase().includes(drawerSearch.toLowerCase()) ||
                      n.tag.toLowerCase().includes(drawerSearch.toLowerCase());
                    const matchesTag =
                      drawerFilterTag === 'ALL' ||
                      drawerFilterTag === 'تظليل' ? false : n.tag === drawerFilterTag;
                    return matchesSearch && (drawerFilterTag === 'ALL' || matchesTag);
                  })
                  .map((note) => (
                    <div
                      key={note.id}
                      onClick={() => jumpToPage(note.pageNumber)}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 cursor-pointer space-y-1.5 transition-all text-xs group"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-amber-300">{note.tag}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          ص {note.pageNumber}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] line-clamp-2 leading-relaxed">
                        {note.content || 'ملاحظة بدون نص...'}
                      </p>
                      <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-900">
                        <span>انقر للانتقال للموضع بالصفحة</span>
                        <button
                          onClick={(e) => handleDeleteStickyNote(note.id, e)}
                          className="text-rose-400 hover:text-rose-200 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}

                {/* Highlights section */}
                <div className="text-[11px] font-bold text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span>التظليلات الفسفورية ({highlights.length})</span>
                </div>

                {highlights
                  .filter((h) => {
                    const matchesSearch =
                      !drawerSearch ||
                      h.selectedText.toLowerCase().includes(drawerSearch.toLowerCase());
                    return matchesSearch && (drawerFilterTag === 'ALL' || drawerFilterTag === 'تظليل');
                  })
                  .map((hl) => (
                    <div
                      key={hl.id}
                      onClick={() => jumpToPage(hl.pageNumber)}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 cursor-pointer space-y-1 transition-all text-xs group"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${colorStyles[hl.color]?.dot}`} />
                          <span className="text-slate-400">{colorStyles[hl.color]?.label}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          ص {hl.pageNumber}
                        </span>
                      </div>
                      <p className="text-slate-200 text-[11px] font-mono line-clamp-2 bg-slate-900/60 p-1 rounded">
                        "{hl.selectedText}"
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <button
                onClick={() => {
                  const summaryText = [
                    '# ملخص ملاحظاتي على كتيب المفاهيم الرسمي 2026/2027',
                    ...stickyNotes.map(
                      (s) => `• [ص ${s.pageNumber}] (${s.tag}): ${s.content}`
                    ),
                    ...highlights.map(
                      (h) => `• [تظليل ص ${h.pageNumber}]: "${h.selectedText}"`
                    )
                  ].join('\n\n');

                  navigator.clipboard.writeText(summaryText);
                  alert('تم نسخ ملخص الملاحظات والتظليلات إلى الحافظة!');
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>نسخ ملخص الملاحظات بالكامل</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

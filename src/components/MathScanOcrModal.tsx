import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  X,
  FileImage,
  RefreshCw,
  Brain,
  Zap,
  RotateCw,
  Copy,
  Check,
  VideoOff,
  Edit3,
  WifiOff
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';

interface MathScanOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToInput: (latexFormula: string, fullPrompt?: string) => void;
  onSendToChat: (problemText: string, latexFormula: string) => void;
}

interface ExamPreset {
  id: string;
  title: string;
  branch: string;
  latex: string;
  plainText: string;
  scaffoldingSteps: Array<{
    stepNumber: number;
    title: string;
    guidingQuestion: string;
    hintFormulaLatex: string;
    officialMinistryRule: string;
  }>;
  finalAnswerVerification: string;
}

const PRESET_EXAM_PROBLEMS: ExamPreset[] = [
  {
    id: 'preset_calc_1',
    title: 'تكامل كسري لوغاريتمي',
    branch: 'تفاضل وتكامل (مثال محلي)',
    latex: '\\int \\frac{2x + 3}{x^2 + 3x + 5} \\, dx',
    plainText: 'تكامل دالة كسرية حيث مشتقة المقام موجودة في البسط: (2x + 3) / (x^2 + 3x + 5)',
    scaffoldingSteps: [
      {
        stepNumber: 1,
        title: 'التعرف على نمط المسألة',
        guidingQuestion: 'افحص المقام جيداً: ما هي مشتقة المقدار (س² + ٣س + ٥) بالنسبة إلى س؟',
        hintFormulaLatex: '\\frac{d}{dx}(x^2 + 3x + 5) = 2x + 3',
        officialMinistryRule: 'إذا كان البسط مشتقة للمقام: فإن ناتج التكامل = لو_هـ |المقام| + ث'
      },
      {
        stepNumber: 2,
        title: 'كتابة الصورة القياسية',
        guidingQuestion: 'هل يحتاج البسط إلى ضرب في ثابت أم يطابق المشتقة تماماً؟',
        hintFormulaLatex: '\\int \\frac{f\'(x)}{f(x)} \\, dx = \\ln|f(x)| + c',
        officialMinistryRule: 'تحقق من القيمة المطلقة وثابت التكامل.'
      }
    ],
    finalAnswerVerification: '\\ln|x^2 + 3x + 5| + c'
  },
  {
    id: 'preset_trig_2',
    title: 'نهاية دالة مثلثية',
    branch: 'تفاضل وتكامل (مثال محلي)',
    latex: '\\lim_{x \\to 0} \\frac{\\sin(5x)}{\\tan(3x)}',
    plainText: 'نهاية دالة مثلثية عند اقتراب س من الصفر',
    scaffoldingSteps: [
      {
        stepNumber: 1,
        title: 'التعويض المباشر',
        guidingQuestion: 'ما ناتج التعويض المباشر عند س = 0؟',
        hintFormulaLatex: '\\frac{\\sin(0)}{\\tan(0)} = \\frac{0}{0}',
        officialMinistryRule: 'ظهور صفر على صفر يستدعي القسمة على س أو تطبيق نظريات النهايات.'
      },
      {
        stepNumber: 2,
        title: 'القسمة على س في البسط والمقام',
        guidingQuestion: 'إذا قسمت كل من البسط والمقام على س، ما قيمة كل نهاية مستقلة؟',
        hintFormulaLatex: '\\lim_{x \\to 0} \\frac{\\frac{\\sin(5x)}{x}}{\\frac{\\tan(3x)}{x}} = \\frac{5}{3}',
        officialMinistryRule: 'قاعدة أساسية: نها جا(أ س)/س = أ ، نها ظا(ب س)/س = ب.'
      }
    ],
    finalAnswerVerification: '\\frac{5}{3}'
  }
];

export const MathScanOcrModal: React.FC<MathScanOcrModalProps> = ({
  isOpen,
  onClose,
  onInsertToInput,
  onSendToChat
}) => {
  const [activeMode, setActiveMode] = useState<'camera' | 'upload' | 'preset'>('upload');
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Camera Stream State
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Captured / Selected Image
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // OCR Processing State (Honest empty initial state — zero fake pre-populated result)
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrProgressStep, setOcrProgressStep] = useState<string>('');
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [revealedStepIndex, setRevealedStepIndex] = useState(0);

  // Extracted Data + Student Confirmation Gate
  const [extractedLatex, setExtractedLatex] = useState<string>('');
  const [plainText, setPlainText] = useState<string>('');
  const [identifiedTopic, setIdentifiedTopic] = useState<string>('');
  const [scaffoldingSteps, setScaffoldingSteps] = useState<ExamPreset['scaffoldingSteps']>([]);
  const [finalVerification, setFinalVerification] = useState<string>('');
  const [isTranscriptionConfirmed, setIsTranscriptionConfirmed] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('متصفحك لا يدعم فتح الكاميرا المباشرة، يمكنك رفع صورة من جهازك.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      let message = 'تعذر تشغيل الكاميرا.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'يرجى السماح بالوصول للكاميرا أو اختيار رفع صورة.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'لم يتم العثور على كاميرا متصلة، يمكنك رفع صورة المسألة.';
      } else if (err.message) {
        message = err.message;
      }
      setCameraError(message);
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (isOpen && activeMode === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode, capturedImage, startCamera, stopCamera]);

  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !isOnline) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    stopCamera();
    setCapturedImage(dataUrl);
    runOcrAnalysis(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOnline) {
      setOcrError('التعرف الضوئي عبر الإنترنت غير متاح في وضع عدم الاتصال.');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setCapturedImage(base64);
        runOcrAnalysis(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: ExamPreset) => {
    setCapturedImage('preset-local');
    setOcrError(null);
    setIsProcessingOcr(false);
    setExtractedLatex(preset.latex);
    setPlainText(preset.plainText);
    setIdentifiedTopic(preset.branch);
    setScaffoldingSteps(preset.scaffoldingSteps);
    setFinalVerification(preset.finalAnswerVerification);
    setRevealedStepIndex(0);
    setIsTranscriptionConfirmed(false);
  };

  const runOcrAnalysis = async (imageSrc: string) => {
    if (!isOnline) {
      setIsProcessingOcr(false);
      setOcrError('أنت غير متصل بالإنترنت الآن. تعذر استدعاء خدمة التحليل الضوئي.');
      return;
    }

    setIsProcessingOcr(true);
    setOcrError(null);
    setExtractedLatex('');
    setPlainText('');
    setIdentifiedTopic('');
    setScaffoldingSteps([]);
    setFinalVerification('');
    setIsTranscriptionConfirmed(false);
    setOcrProgressStep('1/2 مسح تراكيب الصورة وإرسالها للخادم المحلي...');

    try {
      const controller = new AbortController();
      const clientTimeoutId = setTimeout(() => controller.abort(), 35000);

      const response = await fetch('/api/ocr-math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageSrc,
          mimeType: 'image/jpeg'
        }),
        signal: controller.signal
      });

      clearTimeout(clientTimeoutId);

      if (response.ok) {
        const data = await response.json();
        setExtractedLatex(data.latex || '');
        setPlainText(data.plainText || '');
        setIdentifiedTopic(data.topic || 'مسألة رياضية');
        setScaffoldingSteps(Array.isArray(data.scaffoldingSteps) ? data.scaffoldingSteps : []);
        setFinalVerification(data.finalAnswerVerification || '');
        setRevealedStepIndex(0);
        setIsTranscriptionConfirmed(false);
        setIsProcessingOcr(false);
      } else {
        const errorJson = await response.json().catch(() => ({}));
        setOcrError(
          errorJson.error ||
            'تعذر استخراج المعادلة الرياضية من الصورة. يرجى التأكد من وضوح المسألة وإعداد المفتاح.'
        );
        setIsProcessingOcr(false);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setOcrError('استغرقت معالجة الصورة أكثر من 30 ثانية (TIMEOUT).');
      } else {
        setOcrError('تعذر الاتصال بخادم التحليل المحلي. يرجى التحقق من التشغيل وإعداد المفتاح.');
      }
      setIsProcessingOcr(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setOcrError(null);
    setExtractedLatex('');
    setPlainText('');
    setScaffoldingSteps([]);
    setFinalVerification('');
    setIsTranscriptionConfirmed(false);
    if (activeMode === 'camera') {
      startCamera();
    }
  };

  const handleCopyLatex = () => {
    if (!extractedLatex) return;
    navigator.clipboard.writeText(extractedLatex);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleInsertIntoChatInput = () => {
    if (!isTranscriptionConfirmed || !extractedLatex.trim()) return;
    const fullText = `مسألة (${identifiedTopic || 'رياضيات'}):\n${plainText}\n$$${extractedLatex}$$`;
    onInsertToInput(extractedLatex, fullText);
    onClose();
  };

  const handleSendDirectlyToChat = () => {
    if (!isTranscriptionConfirmed || !extractedLatex.trim()) return;
    const fullText = `مسألة مؤكدة (${identifiedTopic || 'رياضيات'}):\n"${plainText}"\nالصيغة الرياضية: $$${extractedLatex}$$`;
    onSendToChat(fullText, extractedLatex);
    onClose();
  };

  if (!isOpen) return null;

  const hasValidResult = Boolean(extractedLatex.trim()) && !isProcessingOcr && !ocrError;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                كاميرا استخراج المسائل مع تأكيد التفريغ الرياضي
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تحويل الصورة إلى صيغة LaTeX مع مراجعة الطالب وتأكيدها قبل عرض الخطوات الإرشادية
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Offline Banner */}
        {!isOnline && (
          <div className="px-4 py-2.5 bg-amber-950/60 border-b border-amber-700/50 text-amber-200 text-xs flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              أنت في وضع عدم الاتصال: أزرار التحليل الضوئي بالشبكة معطلة. يمكنك تجربة الأمثلة المحلية فقط.
            </span>
          </div>
        )}

        {/* Source Mode Tabs */}
        <div className="bg-slate-950/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveMode('camera');
                setCapturedImage(null);
              }}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeMode === 'camera'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>الكاميرا</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('upload');
                setCapturedImage(null);
              }}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeMode === 'upload'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>رفع صورة</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('preset');
                setCapturedImage(null);
              }}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeMode === 'preset'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <FileImage className="w-3.5 h-3.5" />
              <span>أمثلة محلية</span>
            </button>
          </div>

          {capturedImage && (
            <button
              type="button"
              onClick={handleRetake}
              className="min-h-[40px] px-3 text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-medium whitespace-nowrap"
            >
              <RotateCw className="w-3 h-3" />
              <span>البدء من جديد</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          {/* CAMERA VIEW */}
          {!capturedImage && activeMode === 'camera' && (
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black aspect-video flex flex-col items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

              {cameraError && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <VideoOff className="w-8 h-8 text-amber-400" />
                  <p className="text-xs text-slate-300 max-w-md">{cameraError}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
                    >
                      إعادة المحاولة
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMode('upload')}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer"
                    >
                      رفع صورة
                    </button>
                  </div>
                </div>
              )}

              {!cameraError && (
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 px-4">
                  <button
                    type="button"
                    onClick={handleToggleFacingMode}
                    className="min-h-[40px] px-3 rounded-xl bg-slate-900/90 text-white border border-slate-700 text-xs cursor-pointer"
                  >
                    تبديل الكاميرا
                  </button>
                  <button
                    type="button"
                    disabled={!isOnline}
                    onClick={handleCaptureSnapshot}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isOnline ? 'التقاط وتحليل الصورة' : 'غير متاح دون اتصال'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* UPLOAD VIEW */}
          {!capturedImage && activeMode === 'upload' && (
            <div className="border-2 border-dashed border-slate-700 rounded-3xl p-8 sm:p-12 text-center bg-slate-950/60 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-600/20 text-blue-400 mx-auto flex items-center justify-center border border-blue-500/30">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">اختر صورة المسألة من جهازك</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  يدعم صور JPG و PNG و WEBP. بعد الاستخراج سيُطلب منك مراجعة وتأكيد الصيغة الرياضية قبل المتابعة.
                </p>
              </div>
              <label
                className={`min-h-[44px] inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-xs font-bold ${
                  isOnline
                    ? 'bg-blue-600 hover:bg-blue-500 cursor-pointer'
                    : 'bg-slate-700 opacity-50 cursor-not-allowed'
                }`}
              >
                <FileImage className="w-4 h-4" />
                <span>{isOnline ? 'تصفح واختيار الصورة' : 'التحليل بالشبكة غير متاح دون اتصال'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={!isOnline}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* LOCAL PRESETS VIEW (No external Unsplash images) */}
          {!capturedImage && activeMode === 'preset' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-semibold">
                اختر مثالاً محلياً لتجربة تأكيد التفريغ الرياضي والخطوات الإرشادية دون اتصال:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_EXAM_PROBLEMS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-right space-y-2 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-white">{preset.title}</h5>
                      <span className="text-[11px] text-slate-400">{preset.branch}</span>
                    </div>
                    <div className="text-xs text-blue-300 font-mono pt-1">
                      <MathRenderer latex={preset.latex} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVE RESULT + MANDATORY TRANSCRIPTION CONFIRMATION STEP */}
          {capturedImage && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Column: Image / Extracted LaTeX & Mandatory Student Confirmation */}
              <div className="space-y-3">
                {capturedImage !== 'preset-local' && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black aspect-video flex items-center justify-center">
                    <img
                      src={capturedImage}
                      alt="الصورة الملتقطة للمسألة"
                      className="w-full h-full object-contain"
                    />
                    {isProcessingOcr && (
                      <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center p-4 text-center space-y-2">
                        <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                        <span className="text-xs font-bold text-cyan-300">{ocrProgressStep}</span>
                      </div>
                    )}
                  </div>
                )}

                {ocrError ? (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-3"
                  >
                    <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>تنبيه:</span>
                    </div>
                    <p className="text-xs text-rose-200 leading-relaxed">{ocrError}</p>
                    <div className="flex gap-2">
                      {capturedImage !== 'preset-local' && (
                        <button
                          type="button"
                          disabled={!isOnline}
                          onClick={() => runOcrAnalysis(capturedImage)}
                          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-rose-600 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                        >
                          إعادة المحاولة
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleRetake}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer"
                      >
                        تغيير المصدر
                      </button>
                    </div>
                  </div>
                ) : hasValidResult ? (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-800/40 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>مراجعة وتأكيد التفريغ الرياضي (LaTeX):</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyLatex}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copySuccess ? 'تم النسخ' : 'نسخ LaTeX'}</span>
                      </button>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                      <MathRenderer latex={extractedLatex} block={true} className="text-base text-cyan-300" />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="ocr-latex-edit" className="block text-[11px] text-slate-400">
                        عدّل الصيغة عند الحاجة قبل التأكيد:
                      </label>
                      <input
                        id="ocr-latex-edit"
                        type="text"
                        dir="ltr"
                        value={extractedLatex}
                        onChange={(e) => {
                          setExtractedLatex(e.target.value);
                          setIsTranscriptionConfirmed(false);
                        }}
                        className="w-full min-h-[40px] bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-xs text-slate-200 text-left"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="ocr-plain-edit" className="block text-[11px] text-slate-400">
                        الوصف النصي للمسألة:
                      </label>
                      <input
                        id="ocr-plain-edit"
                        type="text"
                        value={plainText}
                        onChange={(e) => {
                          setPlainText(e.target.value);
                          setIsTranscriptionConfirmed(false);
                        }}
                        className="w-full min-h-[40px] bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsTranscriptionConfirmed(true)}
                      disabled={isTranscriptionConfirmed}
                      className={`min-h-[44px] w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                        isTranscriptionConfirmed
                          ? 'bg-emerald-950/60 border border-emerald-500 text-emerald-300'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isTranscriptionConfirmed
                          ? 'تم تأكيد صحة التفريغ الرياضي'
                          : 'تأكيد صحة التفريغ الرياضي للمتابعة'}
                      </span>
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Right Column: Scaffolding Steps (Gated until student confirms transcription) */}
              <div className="space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                      <Brain className="w-4 h-4 text-indigo-400" />
                      <span>خطوات التوجيه السقالي (Scaffolding Steps):</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      تظهر الخطوات الإرشادية بعد تأكيدك أن التفريغ الرياضي للصيغة صحيح.
                    </p>
                  </div>

                  {!isTranscriptionConfirmed ? (
                    <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-2 text-xs text-slate-400">
                      <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
                      <div className="font-bold text-slate-200">بانتظار تأكيد التفريغ الرياضي</div>
                      <p>
                        راجع الصيغة المستخرجة على اليمين واضغط «تأكيد صحة التفريغ الرياضي للمتابعة» لفتح التوجيه.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
                        {scaffoldingSteps.map((step, idx) => {
                          const isUnlocked = idx <= revealedStepIndex;
                          return (
                            <div
                              key={idx}
                              className={`p-3.5 rounded-2xl border ${
                                isUnlocked
                                  ? 'bg-slate-900/90 border-slate-700/80'
                                  : 'bg-slate-950/40 border-slate-900 opacity-60'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white">
                                  {step.stepNumber}. {step.title}
                                </span>
                                {!isUnlocked && (
                                  <button
                                    type="button"
                                    onClick={() => setRevealedStepIndex(idx)}
                                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                                  >
                                    إظهار الخطوة
                                  </button>
                                )}
                              </div>

                              {isUnlocked && (
                                <div className="mt-2.5 space-y-2 text-xs">
                                  <div className="text-slate-200">{step.guidingQuestion}</div>
                                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-center">
                                    <MathRenderer latex={step.hintFormulaLatex} block={true} />
                                  </div>
                                  <div className="text-[11px] text-slate-300 bg-blue-950/20 p-2 rounded-lg border border-blue-900/30">
                                    {step.officialMinistryRule}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {revealedStepIndex < scaffoldingSteps.length - 1 && (
                        <button
                          type="button"
                          onClick={() => setRevealedStepIndex((prev) => prev + 1)}
                          className="min-h-[40px] w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>إظهار الخطوة الإرشادية التالية</span>
                        </button>
                      )}
                    </>
                  )}
                </div>

                {isTranscriptionConfirmed && finalVerification && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                    <span>التحقق النهائي:</span>
                    <MathRenderer latex={finalVerification} className="text-emerald-400 font-bold" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {isTranscriptionConfirmed
                ? 'تم تأكيد التفريغ — يمكنك الإدراج أو الإرسال للمناقشة'
                : 'يلزم تأكيد التفريغ الرياضي قبل الإدراج'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleInsertIntoChatInput}
              disabled={!hasValidResult || !isTranscriptionConfirmed}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>إدراج في مربع الشات</span>
            </button>

            <button
              type="button"
              onClick={handleSendDirectlyToChat}
              disabled={!hasValidResult || !isTranscriptionConfirmed}
              className="min-h-[40px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>إدراج وإرسال للمناقشة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

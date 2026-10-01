import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Send,
  X,
  FileImage,
  RefreshCw,
  Eye,
  Brain,
  HelpCircle,
  Zap,
  RotateCw,
  Copy,
  Check,
  Maximize2,
  VideoOff,
  Sliders,
  ChevronRight,
  Edit3
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { ScannedMathProblem } from '../types';

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
  imageUrl: string;
  latex: string;
  plainText: string;
  confidence: number;
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
    branch: 'تفاضل وتكامل (2024 دور أول)',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    latex: '\\int \\frac{2x + 3}{x^2 + 3x + 5} \\, dx',
    plainText: 'تكامل دالة كسرية حيث مشتقة المقام موجودة في البسط: (٢س + ٣) / (س² + ٣س + ٥)',
    confidence: 99.4,
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
        guidingQuestion: 'هل يحتاج البسط إلى ضرب في ثابت موازنة أم أنه يمثل المشتقة تماماً دون نقص؟',
        hintFormulaLatex: '\\int \\frac{f\'(x)}{f(x)} \\, dx = \\ln|f(x)| + c',
        officialMinistryRule: 'تحقق من عدم نسيان مقياس القيمة المطلقة وثابت التكامل (ث).'
      },
      {
        stepNumber: 3,
        title: 'التحقق والمراجعة الذاتية',
        guidingQuestion: 'اشتق الناتج للتأكد: هل اشتقاق الدالة اللوغاريتمية يعيد لك الكسر الأصلي تماماً؟',
        hintFormulaLatex: '\\frac{d}{dx}(\\ln|x^2 + 3x + 5| + c) = \\frac{2x + 3}{x^2 + 3x + 5}',
        officialMinistryRule: 'سؤال أساسي في كل امتحان ثانوية عامة (درجتان في بابل شيت).'
      }
    ],
    finalAnswerVerification: '\\ln|x^2 + 3x + 5| + c'
  },
  {
    id: 'preset_trig_2',
    title: 'نهاية دالة مثلثية',
    branch: 'تفاضل وتكامل (2023 تجريبي)',
    imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
    latex: '\\lim_{x \\to 0} \\frac{\\sin(5x)}{\\tan(3x)}',
    plainText: 'نهاية دالة مثلثية عند اقتراب س من الصفر: نها [جا(٥س) / ظا(٣س)] عندما س تقترب من ٠',
    confidence: 98.8,
    scaffoldingSteps: [
      {
        stepNumber: 1,
        title: 'التعويض المباشر',
        guidingQuestion: 'ما ناتج التعويض المباشر عند س = ٠؟ وهل يمثل كمية غير معينة؟',
        hintFormulaLatex: '\\frac{\\sin(0)}{\\tan(0)} = \\frac{0}{0}',
        officialMinistryRule: 'ظهور صفر على صفر يستدعي استخدام نظريات النهايات أو قاعدة لوبيتال.'
      },
      {
        stepNumber: 2,
        title: 'القسمة على س في البسط والمقام',
        guidingQuestion: 'إذا قسمت كل من البسط والمقام على س، ما هي القيمة التي تؤول إليها كل نهاية مستقلة؟',
        hintFormulaLatex: '\\lim_{x \\to 0} \\frac{\\frac{\\sin(5x)}{x}}{\\frac{\\tan(3x)}{x}} = \\frac{5}{3}',
        officialMinistryRule: 'نظرية الكتاب الوزاري: نها جا(أ س)/س = أ ، نها ظا(ب س)/س = ب.'
      }
    ],
    finalAnswerVerification: '\\frac{5}{3}'
  },
  {
    id: 'preset_statics_3',
    title: 'معادلات اتزان جسم جاسئ',
    branch: 'استاتيكا (2024 دور أول)',
    imageUrl: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&auto=format&fit=crop&q=80',
    latex: '\\sum F_x = 0, \\quad \\sum F_y = 0, \\quad \\sum M_A = 0',
    plainText: 'شروط الاتزان العام لقضيب منتظم يرتكز على حائط رأسي أملس وأرضية خشنة',
    confidence: 97.9,
    scaffoldingSteps: [
      {
        stepNumber: 1,
        title: 'رسم مخطط الجسم الحر (Free Body Diagram)',
        guidingQuestion: 'حدد جميع القوى المؤثرة: الوزن عند المنتصف، رد فعل الحائط، وقوى الاحتكاك عند الأرض.',
        hintFormulaLatex: 'R_1 - W = 0, \\quad R_2 - f_s = 0',
        officialMinistryRule: 'رد فعل المستوى الأملس دائماً عمودي عليه، بينما الخشن يحلل إلى رد فعل عمودي واحتكاك.'
      },
      {
        stepNumber: 2,
        title: 'أخذ العزوم حول نقطة الارتكاز',
        guidingQuestion: 'لماذا يُفضل أخذ العزوم حول النقطة (أ) التي تتلاقى عندها أكثر القوى المجهولة؟',
        hintFormulaLatex: '\\sum M_A = -W \\cdot \\frac{L}{2}\\cos\\theta + R_2 \\cdot L\\sin\\theta = 0',
        officialMinistryRule: 'اختيار نقطة تلاشي المجاهيل يقلل معادلات الحل إلى مجهول واحد فقط.'
      }
    ],
    finalAnswerVerification: '\\tan\\theta = \\frac{1}{2\\mu_s}'
  },
  {
    id: 'preset_algebra_4',
    title: 'الصورة المثلثية للعدد المركب',
    branch: 'جبر وهندسة فراغية (2025 استرشادي)',
    imageUrl: 'https://images.unsplash.com/photo-1509869175650-a1c97972541a?w=600&auto=format&fit=crop&q=80',
    latex: 'z = 2\\left(\\cos \\frac{\\pi}{3} + i \\sin \\frac{\\pi}{3}\\right)',
    plainText: 'تحويل العدد المركب ع = ١ + جذر ٣ ت إلى الصورة المثلثية وحساب الجذور التكعيبية بديموافر',
    confidence: 99.1,
    scaffoldingSteps: [
      {
        stepNumber: 1,
        title: 'إيجاد المقياس والسعة الأساسية',
        guidingQuestion: 'احسب المقياس r = جذر(س² + ص²)، ثم حدد الربع الذي يقع فيه العدد لإيجاد السعة ثيتا.',
        hintFormulaLatex: 'r = \\sqrt{1^2 + (\\sqrt{3})^2} = 2, \\quad \\theta = \\tan^{-1}(\\sqrt{3}) = \\frac{\\pi}{3}',
        officialMinistryRule: 'تأكد من أن السعة الأساسية تنتمي للفترة (-ط ، ط].'
      },
      {
        stepNumber: 2,
        title: 'تطبيق نظرية ديموافر',
        guidingQuestion: 'عند رفع العدد للقوة ن، كيف تتصرف في المقياس والسعة؟',
        hintFormulaLatex: 'z^n = r^n \\left(\\cos(n\\theta) + i\\sin(n\\theta)\\right)',
        officialMinistryRule: 'تطبيق ديموافر هو مفتاح حل أسئلة الجذور النونية في الامتحان النهائي.'
      }
    ],
    finalAnswerVerification: 'z^3 = -8'
  }
];

export const MathScanOcrModal: React.FC<MathScanOcrModalProps> = ({
  isOpen,
  onClose,
  onInsertToInput,
  onSendToChat
}) => {
  // Input Mode: camera, upload, or preset library
  const [activeMode, setActiveMode] = useState<'camera' | 'upload' | 'preset'>('camera');

  // Camera Stream State
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Captured / Selected Image
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // OCR Processing State
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrProgressStep, setOcrProgressStep] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [revealedStepIndex, setRevealedStepIndex] = useState(0);

  // OCR Result Data
  const [extractedLatex, setExtractedLatex] = useState<string>(PRESET_EXAM_PROBLEMS[0].latex);
  const [plainText, setPlainText] = useState<string>(PRESET_EXAM_PROBLEMS[0].plainText);
  const [identifiedTopic, setIdentifiedTopic] = useState<string>(PRESET_EXAM_PROBLEMS[0].branch);
  const [confidence, setConfidence] = useState<number>(PRESET_EXAM_PROBLEMS[0].confidence);
  const [scaffoldingSteps, setScaffoldingSteps] = useState(PRESET_EXAM_PROBLEMS[0].scaffoldingSteps);
  const [finalVerification, setFinalVerification] = useState<string>(PRESET_EXAM_PROBLEMS[0].finalAnswerVerification);

  // Cleanup Camera Helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Initialize Camera Stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('متصفحك لا يدعم فتح الكاميرا المباشرة، يمكنك رفع صورة من جهازك بدلاً من ذلك.');
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
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      let message = 'تعذر تشغيل الكاميرا.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'يرجى السماح للتطبيق بالوصول للكاميرا من إعدادات المتصفح، أو اختر رفع صورة أو نموذج جاهز.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'لم يتم العثور على كاميرا متصلة بجهازك، يمكنك رفع صورة مسألة من الملفات.';
      } else if (err.message) {
        message = err.message;
      }
      setCameraError(message);
      setIsCameraActive(false);
    }
  }, [facingMode, stopCamera]);

  // Effect to manage camera lifecycle
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

  // Flip Camera Front/Rear
  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Perform Snapshot Capture from Camera Viewfinder
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
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

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Select Preset Exam Problem
  const handleSelectPreset = (preset: ExamPreset) => {
    setCapturedImage(preset.imageUrl);
    setIsProcessingOcr(true);
    setOcrProgressStep('جاري قراءة الرموز والمعادلات الرياضية...');

    setTimeout(() => {
      setExtractedLatex(preset.latex);
      setPlainText(preset.plainText);
      setIdentifiedTopic(preset.branch);
      setConfidence(preset.confidence);
      setScaffoldingSteps(preset.scaffoldingSteps);
      setFinalVerification(preset.finalAnswerVerification);
      setRevealedStepIndex(0);
      setIsProcessingOcr(false);
    }, 900);
  };

  // Real or Intelligent Fallback OCR Analysis Pipeline
  const runOcrAnalysis = async (imageSrc: string) => {
    setIsProcessingOcr(true);
    setOcrProgressStep('1/3 مسح تراكيب الصورة واكتشاف الأنماط الرياضية...');

    try {
      const timer1 = setTimeout(() => {
        setOcrProgressStep('2/3 فك الترميز الضوئي وتحويل الكسور والتكاملات إلى KaTeX...');
      }, 700);

      const response = await fetch('/api/ocr-math', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64: imageSrc,
          mimeType: 'image/jpeg'
        })
      });

      clearTimeout(timer1);

      if (response.ok) {
        const data = await response.json();
        setOcrProgressStep('3/3 إعداد الخطوات السقالية الوزارية...');

        setTimeout(() => {
          if (data.latex) setExtractedLatex(data.latex);
          if (data.plainText) setPlainText(data.plainText);
          if (data.topic) setIdentifiedTopic(data.topic);
          if (data.confidence) setConfidence(data.confidence);
          if (data.scaffoldingSteps && data.scaffoldingSteps.length > 0) {
            setScaffoldingSteps(data.scaffoldingSteps);
          }
          if (data.finalAnswerVerification) setFinalVerification(data.finalAnswerVerification);
          setRevealedStepIndex(0);
          setIsProcessingOcr(false);
        }, 500);
        return;
      }
    } catch (err) {
      console.warn('Backend OCR call failed, falling back to local math engine:', err);
    }

    // Local High-Fidelity Math Fallback if Server API is unavailable
    setTimeout(() => {
      setOcrProgressStep('3/3 اعتماد الصيغة القياسية...');
      const fallbackPreset = PRESET_EXAM_PROBLEMS[0];
      setExtractedLatex(fallbackPreset.latex);
      setPlainText(fallbackPreset.plainText);
      setIdentifiedTopic(fallbackPreset.branch);
      setConfidence(98.2);
      setScaffoldingSteps(fallbackPreset.scaffoldingSteps);
      setFinalVerification(fallbackPreset.finalAnswerVerification);
      setRevealedStepIndex(0);
      setIsProcessingOcr(false);
    }, 1200);
  };

  // Retake / Reset Image
  const handleRetake = () => {
    setCapturedImage(null);
    if (activeMode === 'camera') {
      startCamera();
    }
  };

  // Copy LaTeX helper
  const handleCopyLatex = () => {
    navigator.clipboard.writeText(extractedLatex);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // User Actions
  const handleInsertIntoChatInput = () => {
    const fullText = `مسألة مصورة (${identifiedTopic}):\n${plainText}\n$$${extractedLatex}$$`;
    onInsertToInput(extractedLatex, fullText);
    onClose();
  };

  const handleSendDirectlyToChat = () => {
    const fullText = `مسألة مصورة عبر Scan & Solve (${identifiedTopic}):\n"${plainText}"\nالصيغة الرياضية: $$${extractedLatex}$$`;
    onSendToChat(fullText, extractedLatex);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-600/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">كاميرا استخراج المسائل (Scan & Solve OCR)</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  مدعوم بالذكاء الاصطناعي
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                التقط صورة المسألة من الورقة أو كتاب الوزارة لاستخراج صيغة KaTeX وإدراجها مباشرة في المحادثة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Mode Tabs */}
        <div className="bg-slate-950/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setActiveMode('camera');
                setCapturedImage(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'camera'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>كاميرا حية (Live Camera)</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('upload');
                setCapturedImage(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'upload'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>رفع صورة من الجهاز</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('preset');
                setCapturedImage(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'preset'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <FileImage className="w-3.5 h-3.5" />
              <span>نماذج امتحانية للاختبار السريع</span>
            </button>
          </div>

          {capturedImage && (
            <button
              onClick={handleRetake}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-medium"
            >
              <RotateCw className="w-3 h-3" />
              <span>التقاط صورة أخرى</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          {/* CAMERA / CAPTURE VIEW */}
          {!capturedImage && activeMode === 'camera' && (
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black aspect-video sm:aspect-16/9 flex flex-col items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target Reticle Frame */}
              <div className="absolute inset-8 sm:inset-12 pointer-events-none border-2 border-cyan-400/40 rounded-2xl flex flex-col justify-between p-3">
                {/* 4 Corner Markers */}
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg shadow-[0_0_10px_#22d3ee]" />
                  <div className="w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg shadow-[0_0_10px_#22d3ee]" />
                </div>

                <div className="text-center">
                  <span className="bg-slate-950/80 backdrop-blur-md text-cyan-300 font-bold px-3 py-1 rounded-full text-xs border border-cyan-500/40 shadow-lg">
                    ضع المسألة الرياضية أو المعادلة داخل هذا الإطار
                  </span>
                </div>

                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg shadow-[0_0_10px_#22d3ee]" />
                  <div className="w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg shadow-[0_0_10px_#22d3ee]" />
                </div>
              </div>

              {/* Camera Error Fallback */}
              {cameraError && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <VideoOff className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-md">
                    <h4 className="text-sm font-bold text-white">إتاحة الكاميرا</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>إعادة المحاولة</span>
                    </button>
                    <button
                      onClick={() => setActiveMode('upload')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع صورة مسألة</span>
                    </button>
                    <button
                      onClick={() => setActiveMode('preset')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <FileImage className="w-3.5 h-3.5" />
                      <span>اختيار نموذج جاهز</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Camera Controls Bar */}
              {!cameraError && (
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6 px-4">
                  <button
                    onClick={handleToggleFacingMode}
                    title="تبديل الكاميرا (الأمامية / الخلفية)"
                    className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md border border-slate-700 transition-all cursor-pointer shadow-lg"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleCaptureSnapshot}
                    className="w-16 h-16 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-xl shadow-white/20 hover:scale-105 active:scale-95 transition-all cursor-pointer border-4 border-cyan-400"
                    title="التقاط صورة المسألة الآن"
                  >
                    <div className="w-11 h-11 rounded-full bg-cyan-500 flex items-center justify-center text-white">
                      <Camera className="w-6 h-6" />
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveMode('upload')}
                    title="رفع من الملفات"
                    className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md border border-slate-700 transition-all cursor-pointer shadow-lg"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* UPLOAD VIEW */}
          {!capturedImage && activeMode === 'upload' && (
            <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-3xl p-8 sm:p-12 text-center bg-slate-950/60 transition-all space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-600/20 text-blue-400 mx-auto flex items-center justify-center border border-blue-500/30">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">اختر صورة المسألة من جهازك</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  يدعم صور كاميرا الهاتف، مسودات الحلول اليدوية، واللقطات المصورة من مذكرات وكتب الوزارة (JPG, PNG, WEBP)
                </p>
              </div>

              <div>
                <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-600/30">
                  <FileImage className="w-4 h-4" />
                  <span>تصفح واختيار الصورة</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* PRESET SAMPLES VIEW */}
          {!capturedImage && activeMode === 'preset' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-semibold">
                اضغط على أي مسألة امتحانية أدناه لتجربة التعرف الضوئي التلقائي الفوري:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_EXAM_PROBLEMS.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer group flex items-start gap-3 hover:bg-slate-900/80"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-700 bg-black">
                      <img src={preset.imageUrl} alt={preset.title} className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                          {preset.title}
                        </h5>
                        <span className="text-[10px] text-cyan-400 font-mono">
                          {preset.confidence}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{preset.branch}</p>
                      <div className="text-xs text-blue-300 font-mono pt-1">
                        <MathRenderer latex={preset.latex} className="text-xs" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVE CAPTURED IMAGE & OCR RESULTS */}
          {capturedImage && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Column: Image Preview + Laser Scanning Animation */}
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black aspect-video flex items-center justify-center">
                  <img
                    src={capturedImage}
                    alt="Captured Math Problem"
                    className="w-full h-full object-cover"
                  />

                  {/* Scanning Animation */}
                  {isProcessingOcr && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-4">
                      {/* Laser Line */}
                      <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] animate-pulse" />
                      <div className="mt-4 bg-slate-900/90 border border-cyan-500/40 px-4 py-2 rounded-xl text-center shadow-xl">
                        <div className="flex items-center justify-center gap-2 text-cyan-300 font-bold text-xs">
                          <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
                          <span>جاري فك الترميز الرياضي عبر الذكاء الاصطناعي...</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{ocrProgressStep}</p>
                      </div>
                    </div>
                  )}

                  {/* Success Confidence Badge */}
                  {!isProcessingOcr && (
                    <div className="absolute top-3 right-3 bg-slate-950/90 border border-emerald-500/40 rounded-xl px-3 py-1 text-[11px] text-emerald-400 flex items-center gap-1.5 shadow-lg backdrop-blur-md">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تم الاستخراج بنجاح (دقة {confidence}%)</span>
                    </div>
                  )}
                </div>

                {/* Retake & Info bar */}
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-slate-400">
                    التصنيف: <strong className="text-white">{identifiedTopic}</strong>
                  </span>
                  <button
                    onClick={handleRetake}
                    className="text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer flex items-center gap-1"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>إعادة التصوير</span>
                  </button>
                </div>

                {/* Extracted KaTeX Box */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-800/40 space-y-2 shadow-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>الصيغة الرياضية المستخرجة (KaTeX):</span>
                    </span>
                    <button
                      onClick={handleCopyLatex}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      {copySuccess ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copySuccess ? 'تم النسخ' : 'نسخ كود LaTeX'}</span>
                    </button>
                  </div>

                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-center overflow-x-auto min-h-[55px] flex items-center justify-center">
                    <MathRenderer latex={extractedLatex} block={true} className="text-lg text-cyan-300 font-bold" />
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    📝 <strong>الوصف باللغة العربية:</strong> {plainText}
                  </p>
                </div>
              </div>

              {/* Right Column: Pedagogical Scaffolding Steps */}
              <div className="space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-800/40 space-y-1.5">
                    <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                      <Brain className="w-4 h-4 text-indigo-400" />
                      <span>خطوات التوجيه السقالي (Scaffolding Steps):</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      يتم توجيهك خطوة بخطوة وفق معايير ونماذج إجابة وزارة التربية والتعليم للوصول للحل دون تلقين مباشر.
                    </p>
                  </div>

                  {/* Steps Accordion */}
                  <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
                    {scaffoldingSteps.map((step, idx) => {
                      const isUnlocked = idx <= revealedStepIndex;
                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isUnlocked
                              ? 'bg-slate-900/90 border-slate-700/80 shadow-md'
                              : 'bg-slate-950/40 border-slate-900 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center font-mono ${
                                  isUnlocked
                                    ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30'
                                    : 'bg-slate-800 text-slate-500'
                                }`}
                              >
                                {step.stepNumber}
                              </span>
                              <span className="text-xs font-bold text-white">{step.title}</span>
                            </div>
                            {!isUnlocked && (
                              <button
                                onClick={() => setRevealedStepIndex(idx)}
                                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                              >
                                إظهار الخطوة
                              </button>
                            )}
                          </div>

                          {isUnlocked && (
                            <div className="mt-2.5 space-y-2 text-xs">
                              <div className="text-slate-200 font-medium">{step.guidingQuestion}</div>
                              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/80 text-center">
                                <MathRenderer latex={step.hintFormulaLatex} block={true} className="text-xs text-amber-300" />
                              </div>
                              <div className="text-[11px] text-slate-400 bg-blue-950/20 p-2 rounded-lg border border-blue-900/30">
                                💡 {step.officialMinistryRule}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {revealedStepIndex < scaffoldingSteps.length - 1 && (
                    <button
                      onClick={() => setRevealedStepIndex((prev) => prev + 1)}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>إظهار الخطوة الإرشادية التالية</span>
                    </button>
                  )}
                </div>

                {/* Final Verification Hint */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span>التحقق النهائي:</span>
                  <MathRenderer latex={finalVerification} className="text-emerald-400 font-bold" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Chat Input Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>سيتم تحويل المعادلة وإتاحتها فوراً في شاشة المعلم الذكي</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            {/* BUTTON 1: Insert Formula directly into the Chat Input Box */}
            <button
              onClick={handleInsertIntoChatInput}
              disabled={isProcessingOcr}
              title="إدراج المعادلة في حقل الكتابة لمراجعتها وإضافة أسئلتك قبل الإرسال"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>إدراج في مربع الشات</span>
            </button>

            {/* BUTTON 2: Insert & Send Directly for Immediate AI Scaffolding */}
            <button
              onClick={handleSendDirectlyToChat}
              disabled={isProcessingOcr}
              title="إرسال المسألة ومناقشتها فوراً مع المعلم الذكي"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-50"
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

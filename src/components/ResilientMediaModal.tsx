import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  ExternalLink,
  RotateCcw,
  Sparkles,
  FileText,
  Printer,
  Headphones,
  AlertTriangle,
  Check,
  ChevronRight,
  ChevronLeft,
  Download,
  Info
} from 'lucide-react';
import { MultimediaLibraryItem } from '../types';
import { resilientAudio } from '../services/resilientAudioService';
import { MathRenderer } from './MathRenderer';

interface ResilientMediaModalProps {
  item: MultimediaLibraryItem | null;
  onClose: () => void;
  onOpenDocumentExport?: (subjectCode: string) => void;
}

type PlayerMode = 'direct_video' | 'embed_web' | 'capsule_interactive';

export const ResilientMediaModal: React.FC<ResilientMediaModalProps> = ({
  item,
  onClose,
  onOpenDocumentExport
}) => {
  if (!item) return null;

  const [playerMode, setPlayerMode] = useState<PlayerMode>(() => {
    if (item.fileType === 'printable_doc') return 'capsule_interactive';
    if (item.url.includes('youtube') || item.url.includes('youtu.be') || item.url.includes('moe.gov.eg')) {
      return 'embed_web';
    }
    return 'direct_video';
  });

  const [videoError, setVideoError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync speaking state
  useEffect(() => {
    const unsub = resilientAudio.subscribeSpeakingState(setIsSpeakingAudio);
    return () => {
      unsub();
      resilientAudio.stop();
    };
  }, []);

  // Format embed URL for YouTube if applicable
  const getEmbedUrl = (rawUrl: string): string => {
    try {
      if (rawUrl.includes('youtube.com/watch')) {
        const urlObj = new URL(rawUrl);
        const v = urlObj.searchParams.get('v');
        if (v) return `https://www.youtube.com/embed/${v}?autoplay=1&enablejsapi=1`;
      }
      if (rawUrl.includes('youtu.be/')) {
        const id = rawUrl.split('youtu.be/')[1]?.split('?')[0];
        if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1`;
      }
      return rawUrl;
    } catch {
      return rawUrl;
    }
  };

  const handleVideoError = () => {
    setVideoError('تعذر تشغيل ملف الفيديو المباشر عبر بروتوكول المتصفح (CORS أو تنسيق غير مدعوم). تم تحويلك تلقائياً لوضع الكبسولة التفاعلية والمشاهد البديل.');
    setPlayerMode('capsule_interactive');
    resilientAudio.playAttentionChime();
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    resilientAudio.playClickSound();
  };

  const handleSpeakCapsule = () => {
    if (isSpeakingAudio) {
      resilientAudio.stop();
    } else {
      const textToRead = [
        item.title,
        `المادة: ${item.subjectNameAr}`,
        item.description,
        ...(item.printableCheatSheet || [])
      ].join(' . ');

      resilientAudio.speak(textToRead, {
        rate: 0.95
      });
    }
  };

  const slides = item.printableCheatSheet && item.printableCheatSheet.length > 0
    ? item.printableCheatSheet
    : [
        item.description,
        'قاعدة ذهبية: تأكد دائماً من كتابة خطوات الحل كاملة في كراسة الإجابة للحصول على درجات خطوات باريم الوزارة.',
        'ملاحظة: هذا الدرس مرتبط بأسئلة الامتحان الوزاري الرسمي للثانوية العامة.'
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              {item.fileType === 'printable_doc' ? (
                <FileText className="w-5 h-5 text-purple-400" />
              ) : item.fileType === 'audio' ? (
                <Headphones className="w-5 h-5 text-emerald-400" />
              ) : (
                <Play className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {item.subjectNameAr}
                </span>
                <span className="text-[11px] text-slate-400 font-medium truncate">
                  {item.sourceName}
                </span>
              </div>
              <h3 className="text-base font-bold text-white truncate mt-0.5">
                {item.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeakCapsule}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isSpeakingAudio
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title="قراءة ملخص الدرس صوتياً"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isSpeakingAudio ? 'إيقاف الصوت' : 'استماع صوتي'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="px-5 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
            {item.fileType !== 'printable_doc' && (
              <button
                onClick={() => {
                  setPlayerMode('direct_video');
                  setVideoError(null);
                }}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  playerMode === 'direct_video'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                مشغل الفيديو المباشر
              </button>
            )}

            <button
              onClick={() => {
                setPlayerMode('embed_web');
                setVideoError(null);
              }}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                playerMode === 'embed_web'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              مشاهد الويب / التضمين
            </button>

            <button
              onClick={() => setPlayerMode('capsule_interactive')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                playerMode === 'capsule_interactive'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الكبسولة التفاعلية والشرائح
            </button>
          </div>

          <div className="flex items-center gap-2">
            {item.isPrintable && (
              <button
                onClick={() => {
                  if (onOpenDocumentExport) {
                    onOpenDocumentExport(item.subjectCode);
                  } else {
                    window.print();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة كبسولة A4</span>
              </button>
            )}

            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>فتح الرابط الأصلي</span>
            </a>
          </div>
        </div>

        {/* Video Error Banner if any */}
        {videoError && (
          <div className="px-5 py-2.5 bg-amber-950/40 border-b border-amber-800/50 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{videoError}</span>
            </div>
            <button
              onClick={() => setVideoError(null)}
              className="text-amber-400 hover:underline font-bold"
            >
              تجاهل
            </button>
          </div>
        )}

        {/* Main Player Display Area */}
        <div className="flex-1 overflow-y-auto bg-black flex flex-col justify-center items-center min-h-[320px] max-h-[58vh]">
          {/* Mode 1: Direct Video */}
          {playerMode === 'direct_video' && (
            <div className="relative w-full h-full aspect-video flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                src={item.url}
                controls
                autoPlay
                onError={handleVideoError}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Mode 2: Web Embed / YouTube */}
          {playerMode === 'embed_web' && (
            <div className="w-full h-full min-h-[360px] aspect-video bg-slate-950 flex flex-col">
              <iframe
                src={getEmbedUrl(item.url)}
                title={item.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full flex-1 border-0"
              />
            </div>
          )}

          {/* Mode 3: Capsule & Interactive Slides */}
          {playerMode === 'capsule_interactive' && (
            <div className="w-full h-full p-6 bg-gradient-to-b from-slate-900 to-slate-950 text-white flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="text-xs text-purple-300 font-mono font-bold bg-purple-900/40 px-3 py-1 rounded-full border border-purple-500/30">
                    الشريحة {activeSlideIndex + 1} من {slides.length}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400 text-xs">
                    <span>كبسولة المراجعة المركزة</span>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 min-h-[160px] flex items-center justify-center text-center">
                  <div className="space-y-3">
                    <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed max-w-xl">
                      {slides[activeSlideIndex]}
                    </p>
                    {/* Render KaTeX if formula symbols detected */}
                    {slides[activeSlideIndex]?.includes('∫') || slides[activeSlideIndex]?.includes('Σ') || slides[activeSlideIndex]?.includes('=') ? (
                      <div className="inline-block p-2 rounded-xl bg-slate-900 border border-slate-700/60 font-mono text-sm text-cyan-300 dir-ltr">
                        {slides[activeSlideIndex]}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Slide controls */}
              <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-800">
                <button
                  disabled={activeSlideIndex === 0}
                  onClick={() => {
                    setActiveSlideIndex((prev) => Math.max(0, prev - 1));
                    resilientAudio.playClickSound();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>الشريحة السابقة</span>
                </button>

                <div className="flex gap-1.5">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlideIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                        idx === activeSlideIndex
                          ? 'bg-purple-500 w-6'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    />
                  ))}
                </div>

                <button
                  disabled={activeSlideIndex === slides.length - 1}
                  onClick={() => {
                    setActiveSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
                    resilientAudio.playClickSound();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  <span>الشريحة التالية</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info & speed controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-white">السرعة:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono">
              {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleSpeedChange(rate)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] transition-all cursor-pointer ${
                    playbackSpeed === rate
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>المدة أو الصفحات: <strong className="text-slate-200">{item.durationOrPages}</strong></span>
            <span>التقييم: <strong className="text-amber-400">★ {item.rating}</strong></span>
            {item.isVerifiedByMinistry && (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                معتمد وزارياً
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

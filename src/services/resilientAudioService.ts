/**
 * Resilient Audio Service for Thanaweya Amma Math Copilot
 * Provides multi-tier fallback audio playback:
 * 1. Web Speech Synthesis (Arabic ar-EG/ar-SA with fallback voices for Windows OS)
 * 2. LaTeX Math Speech Parser (Converts \int, \frac, \lim, \sqrt to natural Arabic phonetics)
 * 3. Web Audio API Synthetic Sound Generator (Chimes, feedback tones, formula frequencies)
 * 4. Memory cleanup on component unmount
 */

export interface AudioDiagnosticResult {
  speechSynthesisSupported: boolean;
  availableVoicesCount: number;
  arabicVoiceFound: boolean;
  arabicVoiceName?: string;
  fallbackVoiceUsed?: string;
  webAudioSupported: boolean;
  audioElementSupported: boolean;
  isAutoplayAllowed: boolean;
  overallStatus: 'excellent' | 'good' | 'degraded' | 'unsupported';
  message: string;
}

/**
 * Parses raw LaTeX strings and math expressions into smooth Arabic phonetic text
 * for natural and accurate SpeechSynthesis pronunciation.
 */
export function parseLatexToArabicSpeech(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Integrals: \int_{a}^{b} or \int
  text = text.replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, 'تكامل من $1 إلى $2 لـ ');
  text = text.replace(/\\int_\{([^}]+)\}/g, 'تكامل بالنسبة لـ $1 ');
  text = text.replace(/\\int/g, 'تكامل ');

  // 2. Limits: \lim_{x \to a} ➔ "نهاية دالة عندما سين تؤول إلى"
  text = text.replace(/\\lim_\{([a-zA-Z\u0600-\u06FF]+)\s*\\to\s*([^}]+)\}/g, (_match, v, limit) => {
    const varAr = v === 'x' ? 'سين' : v === 'y' ? 'صاد' : v === 't' ? 'الزمن نون' : v;
    return `نهاية دالة عندما ${varAr} تؤول إلى ${limit} `;
  });
  text = text.replace(/\\lim_\{([^}]+)\}/g, 'نهاية دالة عندما $1 ');
  text = text.replace(/\\lim/g, 'نهاية دالة ');

  // 3. Fractions: \frac{A}{B} ➔ "أ مقسوماً على ب"
  let prev = '';
  while (prev !== text) {
    prev = text;
    text = text.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (_match, numerator, denominator) => {
      const numPhonetic = convertMathVariables(numerator.trim());
      const denPhonetic = convertMathVariables(denominator.trim());
      return `${numPhonetic} مقسوماً على ${denPhonetic}`;
    });
  }

  // 4. Square & N-th roots: \sqrt{x} ➔ "الجذر التربيعي لـ سين"
  text = text.replace(/\\sqrt\[(\d+)\]\{([^{}]+)\}/g, (_match, rootOrder, inner) => {
    const innerPhonetic = convertMathVariables(inner.trim());
    return `الجذر ذو الرتبة ${rootOrder} لـ ${innerPhonetic}`;
  });
  text = text.replace(/\\sqrt\{([^{}]+)\}/g, (_match, inner) => {
    const innerPhonetic = convertMathVariables(inner.trim());
    return `الجذر التربيعي لـ ${innerPhonetic}`;
  });

  // 5. Differential operators
  text = text.replace(/\\frac\{d([a-zA-Z])\}\{d([a-zA-Z])\}/g, (_m, v1, v2) => {
    const ar1 = v1 === 'y' ? 'صاد' : v1 === 'x' ? 'سين' : v1;
    const ar2 = v2 === 'x' ? 'سين' : v2 === 't' ? 'نون' : v2;
    return `مشتقة ${ar1} بالنسبة لـ ${ar2}`;
  });
  text = text.replace(/\bdf\b/g, 'دال ف');
  text = text.replace(/\bdx\b/g, 'بالنسبة لدال سين');
  text = text.replace(/\bdy\b/g, 'بالنسبة لدال صاد');
  text = text.replace(/\bdt\b/g, 'بالنسبة للزمن نون');
  text = text.replace(/f'\(x\)/g, 'المشتقة الأولى لدال سين');
  text = text.replace(/f''\(x\)/g, 'المشتقة الثانية لدال سين');

  // Trigonometric and logarithms
  text = text.replace(/\\sin/g, ' جا ');
  text = text.replace(/\\cos/g, ' جتا ');
  text = text.replace(/\\tan/g, ' ظا ');
  text = text.replace(/\\sec/g, ' قا ');
  text = text.replace(/\\csc/g, ' قتا ');
  text = text.replace(/\\cot/g, ' ظتا ');
  text = text.replace(/\\ln/g, ' اللوغاريتم الطبيعي لـ ');
  text = text.replace(/\\log/g, ' لوغاريتم ');

  // Symbols
  text = text.replace(/\\pi/g, ' باي ');
  text = text.replace(/\\theta/g, ' سيتا ');
  text = text.replace(/\\lambda/g, ' لامبدا ');
  text = text.replace(/\\omega/g, ' أوميجا ');
  text = text.replace(/\\infty/g, ' ما لا نهاية ');
  text = text.replace(/\\sum/g, ' مجموع ');
  text = text.replace(/\\pm/g, ' موجب أو سالب ');
  text = text.replace(/\\cdot/g, ' في ');
  text = text.replace(/\\times/g, ' ضرب ');
  text = text.replace(/\\approx/g, ' يساوي تقريباً ');
  text = text.replace(/\\neq/g, ' لا يساوي ');
  text = text.replace(/\\le/g, ' أقل من أو يساوي ');
  text = text.replace(/\\ge/g, ' أكبر من أو يساوي ');
  text = text.replace(/\\to/g, ' تؤول إلى ');
  text = text.replace(/\\vec\{([^{}]+)\}/g, ' المتجه $1 ');

  // Powers & Exponents
  text = text.replace(/\^2\b/g, ' تربيع ');
  text = text.replace(/\^3\b/g, ' تكعيب ');
  text = text.replace(/\^\{2\}/g, ' تربيع ');
  text = text.replace(/\^\{3\}/g, ' تكعيب ');
  text = text.replace(/\^\{([^}]+)\}/g, ' أس $1 ');
  text = text.replace(/\^([0-9a-zA-Z])/g, ' أس $1 ');

  // Variables
  text = convertMathVariables(text);

  // Clean remaining LaTeX syntax
  text = text
    .replace(/\\quad/g, ' ')
    .replace(/\\qquad/g, ' ')
    .replace(/\\text\{([^}]+)\}/g, ' $1 ')
    .replace(/\\\(/g, '')
    .replace(/\\\)/g, '')
    .replace(/\$+/g, '')
    .replace(/[{}\\_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}

/**
 * Converts common single-letter Latin math variables into Arabic phonetics
 */
function convertMathVariables(str: string): string {
  return str
    .replace(/\bx\b/g, 'سين')
    .replace(/\by\b/g, 'صاد')
    .replace(/\bz\b/g, 'عين')
    .replace(/\bn\b/g, 'نون')
    .replace(/\ba\b/g, 'أ')
    .replace(/\bb\b/g, 'ب')
    .replace(/\bc\b/g, 'جـ')
    .replace(/\br\b/g, 'نصف القطر نق');
}

export class ResilientAudioService {
  private audioCtx: AudioContext | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState: boolean = false;
  private listeners: Set<(isSpeaking: boolean) => void> = new Set();

  constructor() {
    // Lazy initialized
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        try {
          this.audioCtx = new AudioCtxClass();
        } catch (e) {
          console.warn('Web Audio API not supported or blocked:', e);
        }
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public subscribeSpeakingState(callback: (isSpeaking: boolean) => void): () => void {
    this.listeners.add(callback);
    callback(this.isSpeakingState);
    return () => this.listeners.delete(callback);
  }

  private setSpeakingState(speaking: boolean) {
    this.isSpeakingState = speaking;
    this.listeners.forEach((fn) => fn(speaking));
  }

  /**
   * Synthesize clean Arabic mathematical text into natural speech.
   * Parses LaTeX tokens (\int, \frac, \lim, \sqrt) into smooth Arabic phonetic text.
   * Handles Windows OS fallback voices gracefully if ar-EG / ar-SA are missing.
   */
  public speak(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (options?.onError) {
        options.onError(new Error('SpeechSynthesis is not supported in this environment'));
      }
      return false;
    }

    try {
      window.speechSynthesis.cancel();

      // Parse LaTeX formulas into smooth Arabic phonetics
      const phoneticArabicText = parseLatexToArabicSpeech(text);

      const utterance = new SpeechSynthesisUtterance(phoneticArabicText);
      utterance.rate = options?.rate || 0.95;
      utterance.pitch = options?.pitch || 1.0;

      // Select voice with robust Windows OS fallbacks
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) => v.lang.startsWith('ar-EG')) ||
        voices.find((v) => v.lang.startsWith('ar-SA')) ||
        voices.find((v) => v.lang.startsWith('ar')) ||
        voices.find((v) => v.name.toLowerCase().includes('arabic')) ||
        voices.find((v) => v.default) ||
        voices[0] ||
        null;

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        utterance.lang = preferredVoice.lang.startsWith('ar') ? preferredVoice.lang : 'ar-EG';
      } else {
        utterance.lang = 'ar-EG';
      }

      this.currentUtterance = utterance;

      utterance.onstart = () => {
        this.setSpeakingState(true);
      };

      utterance.onend = () => {
        this.setSpeakingState(false);
        this.currentUtterance = null;
        if (options?.onEnd) options.onEnd();
      };

      utterance.onerror = (e) => {
        this.setSpeakingState(false);
        this.currentUtterance = null;
        console.warn('SpeechSynthesis error:', e);
        this.playTone(330, 0.2, 'sawtooth');
        if (options?.onError) options.onError(e);
      };

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (e: any) {
      this.setSpeakingState(false);
      console.warn('SpeechSynthesis invocation error:', e);
      if (options?.onError) options.onError(e);
      return false;
    }
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('Stop error:', e);
      }
    }
    this.setSpeakingState(false);
    this.currentUtterance = null;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  /**
   * Synthesize purely acoustic feedback sound (Web Audio API)
   */
  public playTone(
    freq = 440,
    duration = 0.25,
    type: OscillatorType = 'sine',
    volume = 0.15
  ): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) {
          resolve(false);
          return;
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);

        osc.onended = () => {
          resolve(true);
        };
      } catch (err) {
        console.warn('Web Audio playTone error:', err);
        resolve(false);
      }
    });
  }

  public async playSuccessChime(): Promise<void> {
    await this.playTone(523.25, 0.12, 'sine', 0.2); // C5
    await this.playTone(659.25, 0.12, 'sine', 0.2); // E5
    await this.playTone(783.99, 0.25, 'sine', 0.25); // G5
  }

  public async playAttentionChime(): Promise<void> {
    await this.playTone(880, 0.1, 'triangle', 0.15); // A5
    await this.playTone(1046.5, 0.2, 'triangle', 0.18); // C6
  }

  public playClickSound(): void {
    this.playTone(750, 0.04, 'sine', 0.08);
  }

  /**
   * Diagnostic self-test of client audio capabilities
   */
  public async runDiagnostics(): Promise<AudioDiagnosticResult> {
    const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const hasWebAudio =
      typeof window !== 'undefined' &&
      (Boolean(window.AudioContext) || Boolean((window as any).webkitAudioContext));
    const hasAudioElement =
      typeof window !== 'undefined' && Boolean(window.HTMLAudioElement);

    let voicesCount = 0;
    let arabicVoiceFound = false;
    let arabicVoiceName: string | undefined;
    let fallbackVoiceUsed: string | undefined;

    if (hasSpeech) {
      const voices = window.speechSynthesis.getVoices();
      voicesCount = voices.length;
      const arV = voices.find(
        (v) =>
          v.lang.startsWith('ar') ||
          v.name.toLowerCase().includes('arabic')
      );
      if (arV) {
        arabicVoiceFound = true;
        arabicVoiceName = `${arV.name} (${arV.lang})`;
      } else if (voices.length > 0) {
        const fallback = voices.find((v) => v.default) || voices[0];
        fallbackVoiceUsed = `${fallback.name} (${fallback.lang})`;
      }
    }

    let isAutoplayAllowed = false;
    try {
      const ctx = this.getAudioContext();
      if (ctx) {
        isAutoplayAllowed = ctx.state === 'running';
      }
    } catch {
      isAutoplayAllowed = false;
    }

    let overallStatus: AudioDiagnosticResult['overallStatus'] = 'excellent';
    let message = 'كافة خدمات ومحركات الصوت الاصطناعي ومعالجة LaTeX تعمل بكفاءة تامة.';

    if (!hasSpeech && !hasWebAudio) {
      overallStatus = 'unsupported';
      message = 'المتصفح يفتقر لدعم واجهات برمجة الصوت (Web Audio & Speech).';
    } else if (!arabicVoiceFound && hasSpeech) {
      overallStatus = 'good';
      message = `يعمل محرك الصوت بالصوت الافتراضي لنظام Windows (${fallbackVoiceUsed || 'System Default'}) مع المعالجة الصوتية العربية لكلمات ومعادلات LaTeX.`;
    }

    return {
      speechSynthesisSupported: hasSpeech,
      availableVoicesCount: voicesCount,
      arabicVoiceFound,
      arabicVoiceName,
      fallbackVoiceUsed,
      webAudioSupported: hasWebAudio,
      audioElementSupported: hasAudioElement,
      isAutoplayAllowed,
      overallStatus,
      message
    };
  }

  /**
   * Component cleanup / unmount handler to prevent memory leaks during long study sessions
   */
  public cleanup(): void {
    this.stop();
    this.listeners.clear();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close().catch(() => {});
      } catch (e) {
        console.warn('AudioContext close error:', e);
      }
      this.audioCtx = null;
    }
  }
}

export const resilientAudio = new ResilientAudioService();

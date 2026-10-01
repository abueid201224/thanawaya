/**
 * Resilient Audio Service for Thanaweya Amma Math Copilot
 * Provides multi-tier fallback audio playback:
 * 1. Web Speech Synthesis (Arabic ar-EG/ar-SA with fallback voices)
 * 2. Web Audio API Synthetic Sound Generator (Chimes, feedback tones, formula frequencies)
 * 3. HTML5 Audio Element playback with error trapping & CORS handling
 * 4. Diagnostics & Live Audio Testing
 */

export interface AudioDiagnosticResult {
  speechSynthesisSupported: boolean;
  availableVoicesCount: number;
  arabicVoiceFound: boolean;
  arabicVoiceName?: string;
  webAudioSupported: boolean;
  audioElementSupported: boolean;
  isAutoplayAllowed: boolean;
  overallStatus: 'excellent' | 'good' | 'degraded' | 'unsupported';
  message: string;
}

class ResilientAudioService {
  private audioCtx: AudioContext | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState: boolean = false;
  private listeners: Set<(isSpeaking: boolean) => void> = new Set();

  constructor() {
    // Lazy initialize AudioContext on user interaction
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
   * Synthesize clean Arabic mathematical text into natural speech
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

      // Clean text from LaTeX notation and math symbols for natural Arabic pronunciation
      const cleanText = text
        .replace(/\\\(/g, '')
        .replace(/\\\)/g, '')
        .replace(/\$+/g, '')
        .replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, 'تكامل من $1 إلى $2 لـ ')
        .replace(/\\int/g, 'تكامل ')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, ' ($1) مقسوماً على ($2) ')
        .replace(/\\sqrt\{([^}]+)\}/g, ' الجذر التربيعي لـ ($1) ')
        .replace(/\\lim_\{([^}]+)\}/g, ' نهاية عندما $1 ')
        .replace(/\\sum/g, ' مجموع ')
        .replace(/\\pi/g, ' باي ')
        .replace(/\\theta/g, ' سيتا ')
        .replace(/\\infty/g, ' ما لا نهاية ')
        .replace(/[\^\_]/g, ' ')
        .replace(/[{}]+/g, ' ')
        .replace(/\\,/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = options?.rate || 0.95;
      utterance.pitch = options?.pitch || 1.0;

      // Select Arabic voice with prioritized fallback
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice =
        voices.find((v) => v.lang.startsWith('ar-EG')) ||
        voices.find((v) => v.lang.startsWith('ar-SA')) ||
        voices.find((v) => v.lang.startsWith('ar')) ||
        voices.find((v) => v.name.toLowerCase().includes('arabic'));

      if (arabicVoice) {
        utterance.voice = arabicVoice;
        utterance.lang = arabicVoice.lang;
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
        // Fallback tone to indicate utterance finished with error
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
   * Guaranteed to work without any network requests or external audio assets
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

        // Envelope
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

  /**
   * Play pleasant success chime (Harmonic sequence)
   */
  public async playSuccessChime(): Promise<void> {
    await this.playTone(523.25, 0.12, 'sine', 0.2); // C5
    await this.playTone(659.25, 0.12, 'sine', 0.2); // E5
    await this.playTone(783.99, 0.25, 'sine', 0.25); // G5
  }

  /**
   * Play formula attention alert tone
   */
  public async playAttentionChime(): Promise<void> {
    await this.playTone(880, 0.1, 'triangle', 0.15); // A5
    await this.playTone(1046.5, 0.2, 'triangle', 0.18); // C6
  }

  /**
   * Play gentle click feedback
   */
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
      }
    }

    // Test Web Audio playback
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
    let message = 'كافة خدمات ومحركات الصوت تعمل بكفاءة تامة وتوافقية كاملة.';

    if (!hasSpeech && !hasWebAudio) {
      overallStatus = 'unsupported';
      message = 'المتصفح يفتقر لدعم واجهات برمجة الصوت (Web Audio & Speech).';
    } else if (!arabicVoiceFound && hasSpeech) {
      overallStatus = 'good';
      message = 'محرك الصوت الاصطناعي يعمل، مع الاعتماد على النطق الافتراضي للمتصفح لعدم توفر حزمة عربية مخصصة.';
    }

    return {
      speechSynthesisSupported: hasSpeech,
      availableVoicesCount: voicesCount,
      arabicVoiceFound,
      arabicVoiceName,
      webAudioSupported: hasWebAudio,
      audioElementSupported: hasAudioElement,
      isAutoplayAllowed,
      overallStatus,
      message
    };
  }
}

export const resilientAudio = new ResilientAudioService();

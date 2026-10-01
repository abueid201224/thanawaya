/**
 * Voice Assistant & Speech Recognition for Math Copilot
 * Supports Speech-to-Text (Arabic Egypt ar-EG) and Text-to-Speech narration
 */

export interface VoiceRecognitionOptions {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export class VoiceAssistantService {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          this.recognition = new SpeechRecognition();
          this.recognition.lang = 'ar-EG';
          this.recognition.continuous = false;
          this.recognition.interimResults = false;
        } catch (e) {
          console.warn('Speech recognition init error:', e);
        }
      }
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public startListening(options: VoiceRecognitionOptions): void {
    if (!this.recognition) {
      if (options.onError) {
        options.onError('التعرف الصوتي المباشر غير مدعوم في هذا المتصفح. يمكنك كتابة السؤال مباشرة أو استخدام الأسئلة السريعة.');
      }
      return;
    }

    try {
      this.isListening = true;

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        options.onResult(transcript);
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        if (options.onError) {
          options.onError(event.error || 'حدث خطأ في التقاط الصوت');
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (options.onEnd) {
          options.onEnd();
        }
      };

      this.recognition.start();
    } catch (e: any) {
      this.isListening = false;
      if (options.onError) {
        options.onError(e.message || 'تعذر بدء الميكروفون');
      }
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Stop recognition error:', e);
      }
      this.isListening = false;
    }
  }

  public speak(text: string): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        // Remove LaTeX formatting symbols for smoother speech
        const cleanText = text
          .replace(/\$+/g, '')
          .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 مقسوم على $2')
          .replace(/\\int/g, 'تكامل')
          .replace(/\\lim/g, 'نهاية')
          .replace(/\\sqrt\{([^}]+)\}/g, 'الجذر التربيعي لـ $1');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'ar-EG';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis error:', e);
      }
    }
  }
}

export const voiceAssistant = new VoiceAssistantService();

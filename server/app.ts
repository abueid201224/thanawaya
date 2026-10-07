import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import net from 'net';
import { GoogleGenAI } from '@google/genai';

export interface AppServerOptions {
  staticDir?: string;
  initialApiKey?: string;
  preferredPort?: number;
  host?: string;
}

export interface RunningEmbeddedServer {
  app: express.Express;
  server: any;
  port: number;
  host: string;
  url: string;
  setApiKey: (key: string) => void;
  getApiKeyStatus: () => { isConfigured: boolean };
  close: () => Promise<void>;
}

/**
 * Finds an available TCP port on local loopback (127.0.0.1)
 * Starts from startPort and probes sequentially to avoid collisions.
 */
export async function findAvailablePort(startPort: number = 34567, host: string = '127.0.0.1'): Promise<number> {
  const maxAttempts = 100;
  for (let offset = 0; offset < maxAttempts; offset++) {
    const candidatePort = startPort + offset;
    const isFree = await new Promise<boolean>((resolve) => {
      const tester = net.createServer();
      tester.unref();
      tester.on('error', () => {
        resolve(false);
      });
      tester.listen(candidatePort, host, () => {
        tester.close(() => {
          resolve(true);
        });
      });
    });

    if (isFree) {
      return candidatePort;
    }
  }
  throw new Error(`No available port found in range ${startPort}-${startPort + maxAttempts} on ${host}`);
}

/**
 * Creates and configures the Express application with security middleware,
 * honest AI endpoints, and SPA static file serving.
 */
export function createExpressApp(options: {
  staticDir?: string;
  initialApiKey?: string;
}) {
  const app = express();
  let currentApiKey = options.initialApiKey || process.env.GEMINI_API_KEY || '';
  let aiClient: GoogleGenAI | null = currentApiKey ? createAiInstance(currentApiKey) : null;

  function createAiInstance(key: string): GoogleGenAI | null {
    if (!key) return null;
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'thanaweya-windows-copilot',
        },
      },
    });
  }

  function setApiKey(newKey: string) {
    currentApiKey = (newKey || '').trim();
    aiClient = currentApiKey ? createAiInstance(currentApiKey) : null;
  }

  function getApiKeyStatus() {
    return {
      isConfigured: Boolean(currentApiKey && currentApiKey.length > 5)
    };
  }

  // Security Headers for loopback protection
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Only accept connections from loopback 127.0.0.1 or localhost
    const remote = req.socket.remoteAddress || '';
    if (remote !== '127.0.0.1' && remote !== '::1' && remote !== '::ffff:127.0.0.1') {
      res.status(403).json({ error: 'Access denied: loopback interface only' });
      return;
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  // Body parser with payload limit for handwritten math scans
  app.use(express.json({ limit: '35mb' }));
  app.use(express.urlencoded({ extended: true, limit: '35mb' }));

  // 1. Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(currentApiKey),
      timestamp: new Date().toISOString(),
      server: 'Thanaweya Embedded Local Server (127.0.0.1)'
    });
  });

  // 2. Key Status endpoint (honest, no plaintext exposure)
  app.get('/api/key-status', (_req: Request, res: Response) => {
    res.json({
      isConfigured: Boolean(currentApiKey && currentApiKey.length > 5),
      prefix: currentApiKey ? currentApiKey.substring(0, 4) + '...' : null
    });
  });

  // 3. Math OCR & Scaffolding extraction endpoint (Strict Honest Error Handling)
  app.post('/api/ocr-math', async (req: Request, res: Response) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;
      if (!imageBase64) {
        return res.status(400).json({
          error: 'صورة المسألة مفقودة. يرجى التقاط أو رفع صورة واضحة للمسألة.',
          code: 'IMAGE_DATA_REQUIRED'
        });
      }

      if (!aiClient || !currentApiKey) {
        return res.status(503).json({
          error: 'مفتاح Gemini API غير مضبوط أو غير مفعل. يرجى إدخال مفتاح الذكاء الاصطناعي في إعدادات التطبيق الآمنة.',
          code: 'MISSING_API_KEY'
        });
      }

      const cleanData = imageBase64.replace(/^data:image\/[a-z0-9.+]+;base64,/, '');
      const imagePart = {
        inlineData: {
          mimeType,
          data: cleanData,
        },
      };

      const systemInstruction = `أنت خبير فائق في التعرف الضوئي على الرموز والمعادلات الرياضية (Math OCR & KaTeX) ومنهج الثانوية العامة المصرية علمي رياضة (التفاضل والتكامل، الجبر والهندسة الفراغية، الاستاتيكا، الديناميكا).
المهمة:
حلل صورة المسألة المرفقة واستخرج الصيغة الرياضية بدقة رياضية متناهية.
يجب أن ترجع الناتج بتنسيق JSON نظيف وصالح تماماً فقط:
{
  "latex": "صيغة المعادلة بصيغة KaTeX قياسية ونظيفة بدون علامات $ أو $$",
  "plainText": "صياغة المسألة بلغة عربية رياضية واضحة ومفهومة لطالب الثانوية العامة",
  "topic": "الفرع والموضوع الدراسي الدقيق",
  "confidence": 98.5,
  "scaffoldingSteps": [
    {
      "stepNumber": 1,
      "title": "عنوان الخطوة الأولى للحل",
      "guidingQuestion": "سؤال سقالي توجيهي للطالب لاكتشاف الخطوة الأولى بنفسه دون إعطاء الحل المباشر",
      "hintFormulaLatex": "صيغة مساعدة بصيغة LaTeX",
      "officialMinistryRule": "القاعدة الذهبية أو الملاحظة الامتحانية من كتيب المفاهيم الوزاري"
    }
  ],
  "finalAnswerVerification": "الناتج النهائي للتحقق فقط بصيغة LaTeX"
}`;

      const response: any = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            imagePart,
            { text: 'قم باستخراج المعادلة الرياضية من صورة المسألة المرفقة وتقديم الخطوات السقالية.' }
          ],
        },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text?.trim() || '';
      if (!responseText) {
        return res.status(500).json({
          error: 'لم يقدم النموذج استجابة صالحة لتحليل الصورة. يرجى المحاولة بصورة ذات إضاءة ووضوح أعلى.',
          code: 'EMPTY_OCR_RESPONSE'
        });
      }

      const parsed = JSON.parse(responseText);
      return res.json(parsed);
    } catch (err: any) {
      console.error('OCR Math error:', err);
      return res.status(500).json({
        error: `فشلت معالجة الصورة الرياضية: ${err?.message || 'خطأ غير معروف في خادم الذكاء الاصطناعي'}`,
        code: 'OCR_PROCESSING_FAILED'
      });
    }
  });

  // 4. AI Coding Coach Endpoint
  app.post('/api/coding-buddy', async (req: Request, res: Response) => {
    try {
      const { userPrompt, language = 'python' } = req.body;
      if (!userPrompt) {
        return res.status(400).json({ error: 'userPrompt is required', code: 'PROMPT_REQUIRED' });
      }

      if (!aiClient || !currentApiKey) {
        return res.status(503).json({
          error: 'مفتاح Gemini API غير مضبوط. يرجى إدخال مفتاح API في الإعدادات الآمنة لتفعيل المساعد البرمجي.',
          code: 'MISSING_API_KEY'
        });
      }

      const systemInstruction = `أنت "كود كوتش (Code Coach) 🚀": المساعد الذكي لتعليم البرمجة لطلاب الثانوية العامة علمي رياضة.
قدم شروحات ممتعة مع كود نظيف وتشبيهات واقعية وربط مع المفاهيم الرياضية بصيغة JSON نظيفة:
{
  "title": "عنوان جذاب للتريكة أو الإجابة",
  "funExplanation": "شرح لطيف ومبسط",
  "analogy": "تشبيه واقعي يثبت المفهوم",
  "codeSnippet": "كود برمجي خفيف",
  "codeLanguage": "${language}",
  "outputSimulation": "الناتج المتوقع",
  "goldenTrick": "تريكة سريعة أو فخ شائع",
  "mathConnection": "الربط بالرياضيات المدرسية",
  "recommendedResource": {
    "title": "اسم منصة تعليمية موثوقة",
    "url": "رابط المنصة",
    "type": "عربي مجاني"
  }
}`;

      const response: any = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const responseText = response.text?.trim() || '';
      const parsed = JSON.parse(responseText);
      return res.json(parsed);
    } catch (err: any) {
      console.error('Coding buddy error:', err);
      return res.status(500).json({
        error: `فشل مساعد البرمجة: ${err?.message || 'تعذر الاتصال بالنموذج'}`,
        code: 'CODING_BUDDY_FAILED'
      });
    }
  });

  // 5. Static file serving (Production dist directory)
  if (options.staticDir && fs.existsSync(options.staticDir)) {
    app.use(express.static(options.staticDir));

    // SPA Fallback: Serve index.html for all client-side routes
    app.get('*', (_req: Request, res: Response) => {
      const indexPath = path.join(options.staticDir!, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application bundle index.html not found');
      }
    });
  }

  return {
    app,
    setApiKey,
    getApiKeyStatus
  };
}

/**
 * Starts an embedded Express instance listening strictly on 127.0.0.1
 * with automatic fallback port resolution.
 */
export async function startEmbeddedServer(options: AppServerOptions = {}): Promise<RunningEmbeddedServer> {
  const host = options.host || '127.0.0.1';
  const preferredPort = options.preferredPort || 34567;
  const boundPort = await findAvailablePort(preferredPort, host);

  const { app, setApiKey, getApiKeyStatus } = createExpressApp({
    staticDir: options.staticDir,
    initialApiKey: options.initialApiKey
  });

  const server = await new Promise<any>((resolve, reject) => {
    const s = app.listen(boundPort, host, () => {
      resolve(s);
    });
    s.on('error', (err) => {
      reject(err);
    });
  });

  const url = `http://${host}:${boundPort}`;

  return {
    app,
    server,
    port: boundPort,
    host,
    url,
    setApiKey,
    getApiKeyStatus,
    close: async () => {
      return new Promise<void>((resolve, reject) => {
        server.close((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  };
}

export default createExpressApp;

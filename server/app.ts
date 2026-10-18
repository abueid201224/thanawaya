import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import net from 'net';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';

export interface AppServerOptions {
  staticDir?: string;
  initialApiKey?: string;
  preferredPort?: number;
  host?: string;
  loopbackOnly?: boolean;
}

export interface RunningEmbeddedServer {
  app: express.Express;
  server: any;
  port: number;
  host: string;
  url: string;
  setApiKey: (key: string) => void;
  getApiKeyStatus: () => { isConfigured: boolean };
  getModel: (overrideModel?: string) => string;
  setModel: (model: string) => void;
  close: () => Promise<void>;
}

// Zod Schemas for AI Response Validation
// OCR Math Response Schema
const ocrScaffoldingStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  title: z.string(),
  guidingQuestion: z.string(),
  hintFormulaLatex: z.string().optional(),
  officialMinistryRule: z.string().optional()
});

const ocrMathResponseSchema = z.object({
  latex: z.string().optional(),
  plainText: z.string(),
  confidence: z.number().min(0).max(100).optional(),
  scaffoldingSteps: z.array(ocrScaffoldingStepSchema).optional(),
  finalAnswerVerification: z.string().optional(),
  topic: z.string().optional()
});

// Coding Buddy Response Schema
const recommendedResourceSchema = z.object({
  title: z.string(),
  url: z.string().optional(),
  type: z.string().optional()
});

const codingBuddyResponseSchema = z.object({
  title: z.string(),
  funExplanation: z.string(),
  analogy: z.string(),
  codeSnippet: z.string(),
  codeLanguage: z.string(),
  outputSimulation: z.string(),
  goldenTrick: z.string(),
  mathConnection: z.string(),
  recommendedResource: recommendedResourceSchema.optional()
});



/**
 * Finds an available TCP port on local loopback (127.0.0.1)
 * Starts from startPort and probes sequentially to avoid collisions.
 */
export async function findAvailablePort(startPort: number = 47321, host: string = '127.0.0.1'): Promise<number> {
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
  loopbackOnly?: boolean;
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

  const MODEL_REGEX = /^[A-Za-z0-9._-]{3,80}$/;
  let userConfiguredModel: string = '';

  function getModel(overrideModel?: string): string {
    if (overrideModel && MODEL_REGEX.test(overrideModel.trim())) {
      return overrideModel.trim();
    }
    if (userConfiguredModel && MODEL_REGEX.test(userConfiguredModel.trim())) {
      return userConfiguredModel.trim();
    }
    const envModel = (process.env.GEMINI_MODEL || '').trim();
    if (envModel && MODEL_REGEX.test(envModel)) {
      return envModel;
    }
    return 'gemini-flash-latest';
  }

  function setModel(modelName: string) {
    const trimmed = (modelName || '').trim();
    if (!trimmed || MODEL_REGEX.test(trimmed)) {
      userConfiguredModel = trimmed;
    }
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

  // Security Headers: enforce loopback restriction when embedded on desktop
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (options.loopbackOnly) {
      // Only accept connections from loopback 127.0.0.1 or localhost
      const remote = req.socket.remoteAddress || '';
      if (remote !== '127.0.0.1' && remote !== '::1' && remote !== '::ffff:127.0.0.1') {
        res.status(403).json({ error: 'Access denied: loopback interface only' });
        return;
      }
      res.setHeader('X-Frame-Options', 'DENY');
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
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

  // 2. Key Status endpoint (honest, no plaintext exposure: never returns raw key or prefix)
  app.get('/api/key-status', (_req: Request, res: Response) => {
    res.json({
      isConfigured: Boolean(currentApiKey && currentApiKey.length > 5)
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

      const targetModel = getModel(req.body.model);
      const response: any = await aiClient.models.generateContent({
        model: targetModel,
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

      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (parseErr) {
        return res.status(502).json({
          error: '\u062e\u0637\u0623 \u0627\u0644\u062a\u062d\u0644\u0644: \u0627\u0644\u0627\u0633\u062a\u062c\u0627\u0628\u0629 \u063a\u064a\u0631 \u0635\u0627\u0648\u0644\u0629 \u0628\u0635\u064a\u063a\u0629 JSON.',
          code: 'INVALID_JSON_RESPONSE'
        });
      }

      // Validate AI response structure using Zod schema
      const validationResult = ocrMathResponseSchema.safeParse(parsed);
      if (!validationResult.success) {
        return res.status(502).json({
          error: '\u062e\u0637\u0623 \u0627\u0644\u062a\u062d\u0644\u0644: \u0644\u0645 \u064a\u062f\u0639\u0645 \u0627\u0644\u0647\u064a\u0624\u0644 \u0627\u0644\u0635\u0627\u062d\u0629 \u0627\u0644\u0645\u062a\u0648\u0642\u0639\u0629 \u0644\u0644\u0646\u0635\u064b.',
          code: 'INVALID_AI_RESPONSE_FORMAT',
          validationError: validationResult.error.message
        });
      }

      return res.json(validationResult.data);
    } catch (err: any) {
      console.error('[OCR Error Log]:', err);
      return res.status(500).json({
        error: 'تعذر التعرف على المسألة الرياضية من الصورة حالياً. يرجى التأكد من وضوح المعادلة والإضاءة ومراجعة اتصال الخدمة.',
        code: 'OCR_PROCESSING_FAILED'
      });
    }
  });

  // 4. AI Coding Coach Endpoint
  app.post('/api/coding-buddy', async (req: Request, res: Response) => {
    try {
      const { userPrompt, language = 'python', model } = req.body;
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

      const targetModel = getModel(model);
      const response: any = await aiClient.models.generateContent({
        model: targetModel,
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const responseText = response.text?.trim() || '';
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (parseErr) {
        return res.status(502).json({
          error: '\u062e\u0637\u0623 \u0627\u0644\u062a\u062d\u0644\u0644: \u0627\u0644\u0627\u0633\u062a\u062c\u0627\u0628\u0629 \u063a\u064e\u0631 \u0635\u0627\u0648\u0644\u0629 \u0628\u0635\u064e\u064a\u063a\u0629 JSON.',
          code: 'INVALID_JSON_RESPONSE'
        });
      }

      // Validate AI response structure using Zod schema
      const validationResult = codingBuddyResponseSchema.safeParse(parsed);
      if (!validationResult.success) {
        return res.status(502).json({
          error: '\u062e\u0637\u0623 \u0627\u0644\u062a\u062d\u0644\u0644: \u0644\u0645 \u064a\u062f\u0639\u0645 \u0627\u0644\u0647\u064e\u064a\u0624\u0644 \u0627\u0644\u0635\u0627\u062d\u0629 \u0627\u0644\u0645\u062a\u0648\u0642\u0639\u0629 \u0644\u0644\u0645\u062f\u064e\u0627\u0631.',
          code: 'INVALID_AI_RESPONSE_FORMAT',
          validationError: validationResult.error.message
        });
      }

      return res.json(validationResult.data);
    } catch (err: any) {
      console.error('[Coding Coach Error Log]:', err);
      return res.status(500).json({
        error: 'حدث تعثر أثناء إعداد الشرح البرمجي. يرجى التحقق من اتصال الإنترنت ومفتاح الخدمة والمحاولة لاحقاً.',
        code: 'CODING_BUDDY_FAILED'
      });
    }
  });

  // 5. Model Configuration Endpoint
  app.get('/api/model-config', (_req: Request, res: Response) => {
    res.json({
      currentModel: getModel(),
      defaultModel: 'gemini-flash-latest',
      userConfiguredModel: userConfiguredModel || null,
      envModel: process.env.GEMINI_MODEL || null
    });
  });

  app.post('/api/model-config', (req: Request, res: Response) => {
    const { model } = req.body;
    if (typeof model !== 'string') {
      return res.status(400).json({
        error: 'طلب غير صالح. يجب توفير حقل model كقيمة نصية.',
        currentModel: getModel()
      });
    }

    const clean = model.trim();
    if (!clean) {
      setModel('');
      return res.json({
        success: true,
        currentModel: getModel()
      });
    }

    if (!MODEL_REGEX.test(clean)) {
      return res.status(400).json({
        error: 'اسم النموذج غير صالح. يجب أن يتكون من 3 إلى 80 حرفاً ويحتوي فقط على أحرف وأرقام ونقاط وشرطات (^[A-Za-z0-9._-]{3,80}$).',
        currentModel: getModel()
      });
    }

    setModel(clean);
    return res.json({
      success: true,
      currentModel: getModel()
    });
  });

  // 6. Static file serving (Production dist directory)
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
    getApiKeyStatus,
    getModel,
    setModel
  };
}

/**
 * Starts an embedded Express instance listening strictly on 127.0.0.1
 * with automatic fallback port resolution.
 */
export async function startEmbeddedServer(options: AppServerOptions = {}): Promise<RunningEmbeddedServer> {
  const host = options.host || '127.0.0.1';
  const preferredPort = options.preferredPort || 47321;
  const boundPort = await findAvailablePort(preferredPort, host);

  const { app, setApiKey, getApiKeyStatus, getModel, setModel } = createExpressApp({
    staticDir: options.staticDir,
    initialApiKey: options.initialApiKey,
    loopbackOnly: options.loopbackOnly ?? true
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
    getModel,
    setModel,
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

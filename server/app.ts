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

  // 3. Math OCR & Scaffolding extraction endpoint (Strict Honest Error Handling & >=30s Timeout)
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
          error: 'مفتاح Gemini API غير مضبوط أو غير مفعل. يرجى إدخال مفتاح الذكاء الاصطناعي في إعدادات التطبيق الآمنة (Ctrl+,).',
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

      // Enforce at least 30-second timeout (32 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          const timeoutErr = new Error('TIMEOUT');
          timeoutErr.name = 'TimeoutError';
          reject(timeoutErr);
        }, 32000);
      });

      const ocrPromise = aiClient.models.generateContent({
        model: targetModel,
        contents: {
          parts: [
            imagePart,
            { text: 'قم باستخراج المعادلة الرياضية بدقة من صورة المسألة المرفقة وتقديم الخطوات السقالية.' }
          ],
        },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const response: any = await Promise.race([ocrPromise, timeoutPromise]);
      const responseText = response.text?.trim() || '';

      if (!responseText) {
        return res.status(500).json({
          error: 'لم يقدم النموذج استجابة صالحة لتحليل الصورة (Empty OCR Response). يرجى المحاولة بصورة ذات إضاءة ووضوح أعلى.',
          code: 'EMPTY_OCR_RESPONSE'
        });
      }

      const parsed = JSON.parse(responseText);
      return res.json(parsed);
    } catch (err: any) {
      console.error('[OCR Error Log]:', err?.message || err);

      if (err?.name === 'TimeoutError' || String(err?.message || '').includes('TIMEOUT')) {
        return res.status(504).json({
          error: 'استغرقت معالجة الصورة الرياضية أكثر من 30 ثانية. يرجى التأكد من اتصال الإنترنت وتجربة صورة بحجم أصغر.',
          code: 'TIMEOUT'
        });
      }

      const errMsg = String(err?.message || '').toLowerCase();
      if (err?.status === 429 || errMsg.includes('429') || errMsg.includes('rate limit') || errMsg.includes('resource_exhausted')) {
        return res.status(429).json({
          error: 'تم تجاوز معدل الطلبات المسموح به لخدمة الذكاء الاصطناعي (Rate Limited). يرجى الانتظار دقيقة والمحاولة مجدداً.',
          code: 'RATE_LIMITED'
        });
      }

      return res.status(500).json({
        error: 'تعذر التعرف على المسألة الرياضية من الصورة حالياً. يرجى التأكد من وضوح المعادلة والإضاءة ومراجعة اتصال الخدمة.',
        code: 'OCR_PROCESSING_FAILED'
      });
    }
  });

  // 4. AI Coding Coach Endpoint (with offlineSample fallback when key is unconfigured)
  app.post('/api/coding-buddy', async (req: Request, res: Response) => {
    try {
      const { userPrompt, language = 'python', model } = req.body;
      if (!userPrompt) {
        return res.status(400).json({ error: 'userPrompt is required', code: 'PROMPT_REQUIRED' });
      }

      // Offline Curated Samples when API key is missing
      if (!aiClient || !currentApiKey) {
        const query = userPrompt.toLowerCase();
        let sampleTitle = 'شرح الدوال البرمجية (Functions) بطريقة ممتعة';
        let sampleExplanation = 'الدالة في البرمجة تشبه آلة المصنع أو محل الأكل: تعطيها مدخلات محددة (Ingredients)، وتنفذ خطوات ثابتة، ثم ترجع لك ناتجاً جاهزاً (Output).';
        let sampleAnalogy = 'الدالة زي ماكينة الصراف الآلي: بتدخل البطاقة والرقم السري (Inputs) فتديلك الفلوس والوصل (Outputs).';
        let sampleCode = `# تعريف دالة حساب مساحة المثلث في بايثون\ndef calculate_triangle_area(base, height):\n    area = 0.5 * base * height\n    return area\n\n# تجربة الدالة\nresult = calculate_triangle_area(10, 6)\nprint(f"مساحة المثلث = {result} سم مربع")`;
        let sampleOutput = 'مساحة المثلث = 30.0 سم مربع';
        let sampleTrick = 'احذر من نسيان كلمة return؛ فبدونها ترجع الدالة القيمة None افتراضياً!';
        let sampleMath = 'الدالة البرمجية f(x) تطابق تماماً الدالة الرياضية ص = د(س) في الجبر وحساب المثلثات.';

        if (query.includes('شاورما') || query.includes('دوال') || query.includes('function')) {
          sampleTitle = 'الدوال Functions كأنها محل شاورما 🥙';
          sampleExplanation = 'الدالة هي "سيخ الشاورما والشف": تطلب ساندوتش حجم عائلي بالتومية (Arguments)، يقطّع ويلف ويسخن (Logic)، ويسلمك الساندوتش جاهز (Return)!';
          sampleAnalogy = 'الزبون يطلب الطلب (Input)، والمعلم يلف وينفذ (Process)، والساندوتش يخرج ساخن (Output).';
          sampleCode = `def make_shawarma(size="large", garlic_sauce=True):\n    price = 85 if size == "large" else 60\n    sauce = "مع تومية زيادة" if garlic_sauce else "بدون تومية"\n    return f"طلب شاورما {size} {sauce} - الحساب: {price} جنيه"\n\nprint(make_shawarma("large", True))`;
          sampleOutput = 'طلب شاورما large مع تومية زيادة - الحساب: 85 جنيه';
        } else if (query.includes('ميل') || query.includes('تفاضل') || query.includes('اشتقاق')) {
          sampleTitle = 'حساب ميل المماس والتفاضل العددي بكود بايثون 📐';
          sampleExplanation = 'التفاضل برمجياً هو حساب التغير الصغير جداً في ص مقسوماً على التغير في س عند اقتراب هـ من الصفر.';
          sampleAnalogy = 'التفاضل مثل عداد السرعة اللحظي للسيارة: يحسب المسافة المقطوعة في جزء من الثانية.';
          sampleCode = `def derivative(f, x, h=1e-5):\n    return (f(x + h) - f(x)) / h\n\n# دالة س تربيع f(x) = x^2\nf = lambda x: x**2\n\n# مشتقة س تربيع عند س = 3 هي 2*3 = 6\nprint(f"ميل المماس التقريبي = {derivative(f, 3):.4f}")`;
          sampleOutput = 'ميل المماس التقريبي = 6.0000';
          sampleMath = 'تطبيق مباشر لقانون تعريف المشتقة الأولى: دَ(س) = نها [د(س+هـ) - د(س)] / هـ';
        } else if (query.includes('لعبة') || query.includes('game') || query.includes('تخمين')) {
          sampleTitle = 'برمجة لعبة تخمين الأرقام الذكية 🕹️';
          sampleExplanation = 'لعبة ممتعة تطبق مفهوم الحلقات التكرارية والشرط المنطقي والمقارنات.';
          sampleAnalogy = 'مثل لعبة فك شفرة الخزينة: كل محاولة تعطيك تلميحاً هل الرقم أعلى أم أقل.';
          sampleCode = `import random\n\nsecret = 7\nguess = int(input("خمن رقم بين 1 و 10: ") or 7)\nif guess == secret:\n    print("🎉 برافو! خمنت الرقم الصحيح!")\nelse:\n    print(f"للأسف الرقم كان {secret}")`;
          sampleOutput = '🎉 برافو! خمنت الرقم الصحيح!';
        }

        return res.json({
          offlineSample: true,
          title: sampleTitle,
          funExplanation: sampleExplanation,
          analogy: sampleAnalogy,
          codeSnippet: sampleCode,
          codeLanguage: language,
          outputSimulation: sampleOutput,
          goldenTrick: sampleTrick,
          mathConnection: sampleMath,
          recommendedResource: {
            title: 'منصة هرمش لتعلم بايثون بالعربية مجاناً',
            url: 'https://harmash.com/tutorials/python',
            type: 'عربي مجاني'
          }
        });
      }

      const systemInstruction = `أنت "كود كوتش (Code Coach) 🚀": المساعد الذكي لتعليم البرمجة لطلاب الثانوية العامة علمي رياضة.
قدم شروحات ممتعة مع كود نظيف وتشبيهات واقعية وربط مع المفاهيم الرياضية بصيغة JSON نظيفة:
{
  "offlineSample": false,
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
      const parsed = JSON.parse(responseText);
      parsed.offlineSample = false;
      return res.json(parsed);
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

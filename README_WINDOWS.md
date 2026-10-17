# دليل تثبيت وتشغيل تطبيق Thanaweya Amma Math Copilot على Windows

تطبيق سطح مكتب احترافي مخصص لطلاب الثانوية العامة (شعبة علمي رياضة) مبني باستخدام Electron وReact وVite وTailwind CSS، ومدعوم بخادم Express محلي ومعالجة ذكاء اصطناعي آمنة ومصادقة سحابية عبر Supabase.

---

## 🚀 1. متطلبات وتشغيل المطوّر (Developer Workflow)

### المتطلبات الأساسية:
- Node.js الإصدار 20 أو 22 (LTS)
- مدير الحزم npm (الإصدار 10 أو أعلى)
- نظام تشغيل Windows 10/11 x64 (أو بيئة Linux/macOS للتجميع العابر)

### خطوات التثبيت والتشغيل المحلي:
```bash
# 1. تثبيت الاعتماديات مع معالجة حزم الأقران
npm ci --legacy-peer-deps

# 2. توليد الأيقونات المتعددة الدقة (16x16 حتى 256x256)
npm run icons

# 3. فحص الأنواع والتحقق من الشيفرة المصدرية
npm run lint
npm test

# 4. تشغيل التطبيق في وضع التطوير السريع
npm run dev

# 5. تجميع الواجهة وعملية Electron معاً
npm run build:all

# 6. التحقق من معايير الأمان ومكافحة الانحراف
npm run verify-build

# 7. تغليف المثبّت والنسخة المحمولة لويندوز
npm run package:win
```

المخرجات بعد التجميع تجدها في مجلد `release/`:
- **المثبّت التلقائي**: `ThanaweyaAmmaMathCopilot-Setup-1.0.0.exe` (NSIS perUser بدون الحاجة لصلاحيات مدير).
- **النسخة المحمولة**: `ThanaweyaAmmaMathCopilot-Portable-1.0.0.exe` (تعمل مباشرة بدون تثبيت).

---

## 👨‍🎓 2. دليل تثبيت وتشغيل الطالب (Student Guide)

1. قم بتحميل ملف المثبت `ThanaweyaAmmaMathCopilot-Setup-1.0.0.exe` أو النسخة المحمولة `Portable`.
2. شغّل المثبت؛ سيقوم بتثبيت البرنامج داخل مجلد المستخدم المحلي (`AppData\Local\Programs`) مما لا يتطلب صلاحيات الأدمن (Administrator).
3. سينشئ البرنامج اختصاراً رسمياً على سطح المكتب وفي قائمة "ابدأ" (Start Menu).
4. عند أول تشغيل، ستظهر نافذة المصادقة لتسجيل الدخول أو إنشاء حساب جديد.
5. يمكن إدخال مفتاح Gemini API المجاني الخاص بالطالب من نافذة الإعدادات الآمنة (أو عبر اختصار `Ctrl+,`) لتفعيل مساعد كود كوتش والمسح الضوئي للمعادلات الرياضية.

---

## 🛡️ 3. تحذير Windows SmartScreen (توضيح مهم)

> **ملاحظة أمنية شفافة:**  
> التطبيق غير موقّع بشهادة رقمية تجارية مدفوعة (EV Code Signing Certificate) نظراً للتكلفة السنوية المرتفعة لمشاريع الطلاب غير الربحية.  
> لذلك، عند تشغيل المثبّت للمرة الأولى قد تظهر نافذة الحماية الزرقاء من Windows Defender SmartScreen:  
> **"Windows protected your PC / وحمى Windows جهاز الكمبيوتر"**  
>
> **طريقة المتابعة الآمنة للطالب:**  
> 1. اضغط على رابط **"More info" / "معلومات إضافية"**.  
> 2. اضغط على زر **"Run anyway" / "تشغيل على أية حال"**.  
>  
> التطبيق محصن بالكامل ومعزول بـ Sandbox ولا يطلب أي صلاحيات إدارية خطرة (Runs strictly as standard user).

---

## ⚙️ 4. ضبط إعدادات Supabase والذكاء الاصطناعي (Gemini)

### أسرار وإعدادات Supabase للواجهة:
تعتمد مكتبة `@supabase/supabase-js` على متغيرات البيئة العامة التي تُثبَّت أثناء التجميع (`VITE_*`).
1. **في بيئة التطوير والبناء المحلي (Local Packaging):**
   - أنشئ ملفاً باسم `.env.production` (أو `.env.local`) في المجلد الرئيسي للتطبيق بجوار `package.json`.
   - أضف القيم الحقيقية:
     ```env
     VITE_SUPABASE_URL="https://your-project.supabase.co"
     VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     ```
   - تحقق من أن الرابط يبدأ بـ `https://` والمفتاح غير فارغ.
   - في حال غياب هذه المتغيرات وقت البناء، يعتمد العميل على آلية **التمهيد الكسول (Lazy Initialization)**، ولا ينهار التطبيق بصمت أو يعطل، بل يعرض رسالة واضحة بالعربية للطالب توضح ضرورة ضبط الاتصال بالسحابة.
2. **في سير العمل الآلي عبر GitHub Actions (`build-windows.yml`):**
   - توجه إلى إعدادات المستودع في GitHub: `Settings -> Secrets and variables -> Actions`.
   - أضف السرّين التاليين بدقة:
     - `VITE_SUPABASE_URL`: رابط مشروع Supabase الخاص بك.
     - `VITE_SUPABASE_ANON_KEY`: مفتاح `anon` العام فقط.
   - سير العمل الآلي سيفشل مباشرة مع إظهار رسالة تحذيرية صريحة إذا لم يتم تعيين هذه الأسرار في GitHub.
   *(تحذير أمني: يُمنع منعاً باتاً استخدام أو تمرير مفتاح `service_role` في أي كود أو إعدادات تخص الواجهة).*

### خيارات تأكيد البريد في Supabase:
في تطبيقات سطح المكتب، رابط التأكيد عبر البريد الإلكتروني يحتاج توجيهاً:
1. **الخيار الأول (الموصى به لسطح المكتب):** تعطيل خيار **"Confirm email"** في لوحة تحكم Supabase (`Authentication -> Email -> Disable Confirm Email`)، مما يمكن الطالب من الدخول فوراً بعد إنشاء الحساب دون انتظار فتح روابط في المتصفح.
2. **الخيار الثاني:** في حال تفعيل التأكيد، يتم ضبط **Redirect URLs** في Supabase لتوجيه الطالب لصفحة ويب توضح تأكيد الحساب بنجاح، ثم يعود الطالب للبرنامج ويسجل دخوله.

### مفتاح Gemini والخصوصية وتشفير DPAPI:
- **تشفير محلي صارم:** يتم تشفير المفتاح وحفظه محلياً باستخدام واجهة ويندوز العتادية **Windows DPAPI** عبر مكتبة Electron `safeStorage`.
- **منع حفظ النص الصريح:** في حال عدم توفر التشفير العتادي لنظام التشغيل، يتم رفض تخزين المفتاح بنص صريح صيانةً لأمان الطالب، وتظهر رسالة توضيحية بالعربية.
- **عزل المفتاح:** لا يُعاد المفتاح للواجهة إطلاقاً (بل يتم تأكيد الحالة `isConfigured` فقط)، ولا يُسجل في ملف السجلات `main.log`.
- **تنبيه الخصوصية:** تُعرض رسالة خصوصية واضحة للطالب تفيد بأن نصوص المسائل الرياضية والصور المرفوعة للاستخراج تُرسل حصرياً إلى خوادم Google لمعالجتها عبر Gemini API.
- **الوصول السريع:** تفتح نافذة الإعدادات تلقائياً عند أول تشغيل في حال عدم ضبط المفتاح، كما يمكن فتحها دائماً عبر الاختصار `Ctrl+,`.

### تسلسل أولوية اختيار نموذج Gemini:
يتم تحديد نموذج الذكاء الاصطناعي النشط وفق سلسلة الأسبقية التالية:
1. **إعداد المستخدم (User Setting):** النموذج الذي يختاره أو يكتبه الطالب في نافذة الإعدادات (`Ctrl+,`).
2. **متغير البيئة (GEMINI_MODEL):** القيمة الممررة عبر البيئة إن وُجدت.
3. **الافتراضي المعتمد (Default):** `gemini-flash-latest` (النموذج الرسمي الأسرع والأحدث).
- **التحقق النمطي:** يتم فحص أي اسم نموذج يدخله المستخدم بالنمط المعتمد `^[A-Za-z0-9._-]{3,80}$` لمنع حقن المعاملات غير الصالحة.

---

## 📂 5. مسارات السجلات والملفات (Log File Locations)

عند حدوث أي خطأ في تشغيل الخادم المحلي أو واجهة التطبيق، يتم تسجيل التفاصيل التقنية بدقة داخل ملف السجل الخاص دون إظهار استثناءات مزعجة للطالب:
- مسار سجل التشغيل:
  `%APPDATA%\thanaweya-amma-math-copilot\main.log`
  *(على سبيل المثال: `C:\Users\<Username>\AppData\Roaming\thanaweya-amma-math-copilot\main.log`)*
- مسار حفظ المفتاح المشفر:
  `%APPDATA%\thanaweya-amma-math-copilot\secure_keys.dat`

---

## ❓ 6. الأسئلة الشائعة (FAQ)

- **س: هل يعمل التطبيق بدون اتصال بالإنترنت؟**  
  **ج:** نعم! جميع المذكرات، كتيب المفاهيم الوزاري، الآلة الحاسبة، الراسم البياني، والألغاز البرمجية تعمل محلياً بنسبة 100% لأن كافة الخطوط ورموز KaTeX مدمجة محلياً بدون أي رابط خارجي. وظائف OCR والمساعد الذكي تتطلب اتصالاً.
- **س: ماذا يحدث إذا كان المنفذ 47321 مشغولاً في جهازي؟**  
  **ج:** يمتلك الخادم آلية فحص استباقية (Sequential Port Probing) تفحص حتى 100 منفذ متتالي على العنوان الآمن `127.0.0.1` لاختيار أول منفذ متاح تلقائياً.
- **س: ما هي الاختصارات المتاحة في لوحة المفاتيح؟**  
  - `Ctrl + P`: فتح نافذة طباعة وتصدير المستندات وكتيب المفاهيم (A4).  
  - `Ctrl + F`: التركيز المباشر على مربع البحث والاستكشاف.  
  - `Ctrl + ,`: فتح نافذة الإعدادات الآمنة ومفتاح الذكاء الاصطناعي.  
  - `Esc`: إغلاق النوافذ المنبثقة النشطة.

---

## 🌐 7. دليل إعداد قاعدة بيانات Supabase ونشر التحديثات (Release & Publish Guide)

### أ) خطوات إعداد مشروع Supabase وتنفيذ نصوص SQL:
1. اذهب إلى لوحة تحكم Supabase (`https://supabase.com/dashboard`).
2. أنشئ مشروعاً جديداً باسم: **`thanaweya-math-copilot`**.
3. من صفحة **Project Settings -> API**، انسخ:
   - **Project URL** (يبدأ بـ `https://YOUR-PROJECT-REF.supabase.co`).
   - **anon public key** (المفتاح العام فقط، واحذر نسخ `service_role`).
4. الاتصال بقاعدة البيانات عبر أداة `psql` وتنفيذ نصوص الهجرة المنظمة:
   ```bash
   # الاتصال بقاعدة البيانات المباشرة
   psql -h YOUR-PROJECT-REF.supabase.co -p 5432 -U postgres -d postgres

   # تنفيذ نصوص الجداول وسياسات الأمان
   \i database/supabase/001_create_student_profiles_table.sql
   \i database/supabase/002_enable_rls.sql
   \i database/supabase/003_seed_admin_user.sql
   ```
5. لتحديث وترقية حساب المشرف العام يدوياً في أي وقت:
   ```sql
   UPDATE auth.users 
   SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
   WHERE email = 'ahmed.hamada.gana.2012@gmail.com';
   ```
6. ضع القيم في ملف `.env.production` (أو أسرار مستودع GitHub):
   ```env
   VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### ب) خيارات نشر التحديثات والمثبتات (Auto-Updates & Publishing):

#### الخيار A (مستودع GitHub Releases - الأسهل والموصى به):
1. تم ضبط `electron-builder.yml` للإيداع المباشر في المستودع:
   ```yaml
   publish:
     - provider: "github"
       owner: "abueid201224"
       repo: "thanawaya"
       token: "${GITHUB_TOKEN}"
   ```
2. أنشئ رمز وصول شخصي (GitHub Personal Access Token) بصلاحيات `repo`.
3. قم بتنفيذ أمر التجميع والنشر التلقائي:
   ```bash
   # على أنظمة Linux/macOS
   GITHUB_TOKEN=your-token-here npm run build:all && electron-builder --win --x64 --config electron-builder.yml --publish always

   # أو على نظام Windows (PowerShell)
   $env:GITHUB_TOKEN="your-token-here"; npm run build:all; electron-builder --win --x64 --config electron-builder.yml --publish always
   ```

#### الخيار B (خادم تحديثات ذاتي - Self-Hosted Server):
في حال الرغبة في استضافة التحديثات على خادمك الخاص (Nginx / Apache):
1. عدّل إعدادات `publish` في `electron-builder.yml`:
   ```yaml
   publish:
     - provider: "generic"
       url: "https://updates.yourdomain.com/updates"
       channel: "stable"
   ```
2. ارفع ملفات `.exe` وملف `latest.yml` الناتج في مجلد `release/` إلى خادم التحديثات.


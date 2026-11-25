# دليل النشر والتوزيع الشامل (Production Deployment Guide)
# Thanaweya Amma Math Copilot (تطبيق ويندوز المكتبي للثانوية العامة)

---

## 📌 الفهرس
1. [متطلبات النظام والتطوير](#1-متطلبات-النظام-والتطوير)
2. [تهيئة قاعدة بيانات Supabase](#2-تهيئة-قاعدة-بيانات-supabase)
3. [بناء حزم ويندوز (NSIS Installer & Portable)](#3-بناء-حزم-ويندوز)
4. [التحديث التلقائي وتوزيع الإصدارات](#4-التحديث-التلقائي-وتوزيع-الإصدارات)
5. [أتمتة النشر عبر GitHub Actions](#5-أتمتة-النشر-عبر-github-actions)
6. [فحوصات الجودة والأمان (Verify Build)](#6-فحوصات-الجودة-والأمان)

---

## 1. متطلبات النظام والتطوير
- **نظام التشغيل**: Windows 10/11 64-bit (أو Linux/macOS مع بيئة Node.js 22+ لبناء الحزم).
- **Node.js**: الإصدار 22.x أو أحدث.
- **npm**: الإصدار 10.x أو أحدث.

---

## 2. تهيئة قاعدة بيانات Supabase
1. إنشاء مشروع على منصة Supabase.
2. تشغيل نصوص SQL الموجودة في:
   - `database/supabase/001_create_student_profiles_table.sql`
   - `database/supabase/002_enable_rls.sql`
   - `database/supabase/003_seed_admin_user.sql`
3. ضبط متغيرات البيئة في `.env.production`:
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJh......
   ```

---

## 3. بناء حزم ويندوز
```bash
# 1. تثبيت الحزم
npm install

# 2. فحص الأخطاء والنقاء البرمجي
npm run lint

# 3. بناء الواجهة وعملية Electron الأساسية
npm run build:all

# 4. التحقق من سلامة البناء
npm run verify-build

# 5. التغليف لإنتاج ملف التثبيت والنسخة المحمولة
npm run package:win
```

### ملفات المخرجات داخل مجلد `release/`:
- `ThanaweyaAmmaMathCopilot-Setup-1.0.0.exe`: برنامج تثبيت NSIS باللغة العربية مع إنشاء اختصارات سطح المكتب وقائمة ابدأ.
- `ThanaweyaAmmaMathCopilot-Portable-1.0.0.exe`: نسخة محمولة تعمل مباشرة بدون تثبيت.
- `latest.yml`: بيانات الإصدار والتحقق للتحديث التلقائي.

---

## 4. التحديث التلقائي وتوزيع الإصدارات
تم إعداد `electron-builder.yml` للنشر التلقائي عبر:
- **المستودع**: `abueid201224/thanawaya`
- **المزود**: `github`

للنشر المباشر:
```bash
GITHUB_TOKEN=ghp_your_token npm run package:win -- --publish always
```

---

## 5. أتمتة النشر عبر GitHub Actions
المستودع يحتوي على سير عمل متكامل:
- `.github/workflows/build-windows.yml`: يقوم بالبناء والتحقق ورفع الـ Artifacts عند كل Push.
- `.github/workflows/deploy-windows.yml`: يقوم بالنشر وإنشاء الإصدارات الرسمية عند دفع Tags بصيغة `v*`.

---

## 6. فحوصات الجودة والأمان
يتم تنفيذ فحص صارم ومضاد للانجراف بواسطة:
```bash
npm run verify-build
```
يتحقق الفحص من:
- جاهزية العمل دون اتصال (Offline-ready) بدون روابط CDN خارجية.
- خلو الحزم تماماً من تسريب مفاتيح `service_role` أو الأسرار.
- تطبيق سياسات CSP وقفل النسخة المفردة.
- تطبيق حماية التخزين المشفر DPAPI لمفاتيح API.

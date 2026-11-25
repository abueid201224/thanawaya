# دليل إعداد خادم التحديث التلقائي (Auto-Update Server)
# Thanaweya Amma Math Copilot - Updates Distribution Guide

يتيح هذا التكوين نشر وتوزيع التحديثات التلقائية لتطبيق الويندوز المكتبي للطلاب والمشرفين.

---

## الخيار 1: النشر المباشر عبر GitHub Releases (الأسهل والأكثر موثوقية)
يتم النشر تلقائياً عبر تكوين `electron-builder.yml`:

```yaml
publish:
  - provider: "github"
    owner: "abueid201224"
    repo: "thanawaya"
    token: "${GITHUB_TOKEN}"
```

### خطوات النشر:
1. توليد Personal Access Token (Classic) على GitHub مع صلاحية `repo`.
2. ضبط المتغير في بيئة العمل:
   ```bash
   export GITHUB_TOKEN="ghp_your_token_here" # على أنظمة Linux/Mac
   set GITHUB_TOKEN=ghp_your_token_here     # على أنظمة Windows
   ```
3. تنفيذ أمر البناء والنشر:
   ```bash
   npm run package:win -- --publish always
   ```

---

## الخيار 2: استضافة خاصة (Generic Server / Nginx / S3)
في حال الرغبة في خادم خاص بدون استخدام GitHub:

1. تحديث `electron-builder.yml`:
   ```yaml
   publish:
     - provider: "generic"
       url: "https://updates.yourdomain.com/updates"
       channel: "stable"
   ```
2. رفع الملفات الناتجة من مجلد `release/` إلى مسار الخادم:
   - `latest.yml` (يحتوي على رقم الإصدار وبصمة sha512)
   - ملف التثبيت: `ThanaweyaAmmaMathCopilot-Setup-X.Y.Z.exe`
   - ملف الحزمة: `ThanaweyaAmmaMathCopilot-Setup-X.Y.Z.exe.blockmap`
3. إعداد CORS وسياسات التخزين المؤقت (Cache-Control) بحيث لا يتم تخزين `latest.yml` مؤقتاً (`no-cache`).

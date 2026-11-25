# مشروع WPF المؤرشف (Archived)

تم أرشفة مجلد `ThanaweyaAmma/` بموجب قرار المعمارية رقم **ADR-001** (`docs/ADR-001-electron-first-and-local-truth.md`).

- المسار الرسمي والوحيد النشط لتطبيق Windows هو حزمة **Electron** في الجذر (`electron/`, `src/`, `server/`).
- تم إخراج مجلد WPF ونسخته المكررة من مخططات SQL (`ThanaweyaAmma/supabase/migrations/`) من التشغيل والبناء الآلي (CI).
- الشجرة المرجعية الوحيدة المعتمدة لترحيلات Supabase هي `supabase/migrations/` في جذر المستودع.

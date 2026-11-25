# ملاحظة توحيد أشجار الترحيل (Consolidated Migration Tree)

وفق قرار المعمارية **ADR-001**:
- الشجرة المرجعية الرسمية والوحيدة لترحيلات Supabase هي: `supabase/migrations/` (`001_student_auth.sql` و`002_learning_attempts_and_mistakes.sql`).
- تُبقى ملفات `database/supabase/` متطابقةً كمختصر مرجعي للتشغيل اليدوي عبر `psql` فقط، بينما تم أرشفة `ThanaweyaAmma/supabase/migrations/` مع مشروع WPF القديم.

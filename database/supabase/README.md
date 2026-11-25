# دليل إعداد وتهيئة قاعدة بيانات Supabase
# Thanaweya Amma Math Copilot - Supabase Setup Guide

هذا الدليل يوضح خطوات ربط تطبيق **مساعد الرياضيات للثانوية العامة** بقاعدة بيانات Supabase السحابية لإتاحة المزامنة وحفظ تقدم الطلاب بشكل آمن.

---

## 1. إنشاء المشروع على Supabase
1. سجل الدخول إلى [لوحة تحكم Supabase](https://supabase.com/dashboard).
2. انقر على **New Project**.
3. أدخل اسم المشروع: `thanaweya-math-copilot`.
4. حدد كلمة مرور قوية لقاعدة البيانات واختر أقرب منطقة جغرافية (مثل: `eu-central-1` فرانكفورت أو `me-central-1`).
5. بعد إنشاء المشروع، اذهب إلى: **Project Settings** → **API**.
6. انسخ:
   - **Project URL** (مثل: `https://xyzcompany.supabase.co`)
   - **anon public API Key** (مفتاح العميل العام فقط)
   - ⚠️ **تحذير أمني**: لا تضع أبداً مفتاح `service_role` السري داخل ملفات التطبيق أو واجهة المستخدم.

---

## 2. تنفيذ نصوص SQL لإنشاء الجداول وسياسات الأمان
يمكن تنفيذ الملفات إما عبر **SQL Editor** في لوحة تحكم Supabase أو عبر `psql`:

### عبر Supabase SQL Editor (الطريقة الأسهل):
1. افتح صفحة **SQL Editor** في لوحة تحكم المشروع.
2. أنشئ استعلاماً جديداً والصق محتوى الملف الأول:
   `database/supabase/001_create_student_profiles_table.sql` ثم اضغط **Run**.
3. أنشئ استعلاماً ثانياً والصق محتوى الملف الثاني لتفعيل الأمان وعزل البيانات:
   `database/supabase/002_enable_rls.sql` ثم اضغط **Run**.

### عبر سطر الأوامر (psql):
```bash
psql -h YOUR-PROJECT-REF.supabase.co -p 5432 -U postgres -d postgres

# تنفيذ الملفات
\i database/supabase/001_create_student_profiles_table.sql
\i database/supabase/002_enable_rls.sql
```

---

## 3. تعيين الحساب الإداري الرئيسي (Admin)
لترقية حساب المشرف الرئيسي `ahmed.hamada.gana.2012@gmail.com` إلى رتبة مسؤول كامل الصلاحيات، نفذ الاستعلام التالي في SQL Editor:

```sql
UPDATE auth.users 
SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'ahmed.hamada.gana.2012@gmail.com';

-- أو تنفيذ الملف الجاهز:
-- database/supabase/003_seed_admin_user.sql
```

---

## 4. تهيئة متغيرات البيئة في التطبيق
في ملف `.env.production` (وللتطوير المحلي في `.env`):

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh......your-anon-key-here
```

---

## 5. الجداول وسياسات RLS المطبقة
- **`student_profiles`**: يحتوي على بيانات الطالب، الشعبة (علمي رياضة)، رقم الهاتف، وعدد ساعات المذاكرة المستهدفة.
- **`student_subjects`**: يحتوي على المواد والاشتراكات المقررة.
- **سياسات الحماية (RLS Policies)**:
  - يسمح للطالب فقط بقراءة وتعديل ملفه الشخصي ومواده.
  - يمنع منعاً باتاً التعديل المباشر على حقل الصلاحيات `role` من قبل العميل العادي.
  - يسمح للمشرف (`role = 'admin'`) بإدارة جميع الملفات.

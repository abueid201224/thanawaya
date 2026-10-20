-- ==============================================================================
-- Thanaweya Amma Math Copilot - Supabase Admin User Setup
-- File: database/supabase/003_seed_admin_user.sql
-- Assigns Admin role and initial profile to ahmed.hamada.gana.2012@gmail.com
-- ==============================================================================

-- 1. Update auth.users metadata for admin account
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin", "full_name": "المهندس أحمد حمادة (مدير المنظومة)"}'::jsonb
WHERE email = 'ahmed.hamada.gana.2012@gmail.com';

-- 2. Update public.student_profiles to enforce admin role
UPDATE public.student_profiles
SET 
    role = 'admin',
    full_name = 'المهندس أحمد حمادة (مدير المنظومة)',
    school_name = 'الإدارة العامة لمنظومة المناهج',
    governorate = 'القاهرة',
    target_faculty = 'كلية الهندسة - جامعة القاهرة',
    updated_at = NOW()
WHERE email = 'ahmed.hamada.gana.2012@gmail.com';

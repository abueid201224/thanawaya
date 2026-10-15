-- ==============================================================================
-- Thanaweya Amma Math Copilot - Supabase Database Migration
-- Migration: 001_student_auth.sql
-- Academic Year: 2026/2027 (Egyptian Thanaweya Amma - Math Section)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Student Profiles Table
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(200) NOT NULL,
    phone_whatsapp VARCHAR(30),
    school_name VARCHAR(200),
    governorate VARCHAR(100),
    seating_number VARCHAR(20) DEFAULT '٤٨١٩٢٠',
    target_faculty VARCHAR(200) DEFAULT 'كلية الهندسة - جامعة القاهرة',
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    daily_streak INT NOT NULL DEFAULT 1,
    discipline_score INT NOT NULL DEFAULT 94,
    preferred_study_hours INT NOT NULL DEFAULT 7,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Student Subjects Progress Table
CREATE TABLE IF NOT EXISTS public.student_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_code VARCHAR(50) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'رياضيات بحتة',
    total_chapters INT NOT NULL DEFAULT 10,
    completed_chapters INT NOT NULL DEFAULT 0,
    quizzes_taken INT NOT NULL DEFAULT 0,
    average_score INT NOT NULL DEFAULT 0,
    mastery_percentage INT NOT NULL DEFAULT 0,
    color_hex VARCHAR(20) NOT NULL DEFAULT '#2563EB',
    last_studied_date VARCHAR(50) NOT NULL DEFAULT 'اليوم',
    learning_outcomes_total INT NOT NULL DEFAULT 24,
    learning_outcomes_mastered INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_subject UNIQUE (user_id, subject_code)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;

-- 5. Helper Function: Is User Admin
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 6. Row Level Security Policies for student_profiles
-- Strict RLS: Personal data access strictly limited to authenticated owner or verified admin.
CREATE POLICY "student_profiles_select_own_or_admin"
    ON public.student_profiles
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id OR public.is_app_admin()
    );

CREATE POLICY "student_profiles_insert_own"
    ON public.student_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = id
    );

CREATE POLICY "student_profiles_update_own"
    ON public.student_profiles
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = id OR public.is_app_admin()
    )
    WITH CHECK (
        -- Enforce that students cannot change their own user ID
        auth.uid() = id
    );

-- 7. Row Level Security Policies for student_subjects
CREATE POLICY "student_subjects_select_own"
    ON public.student_subjects
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id OR public.is_app_admin()
    );

CREATE POLICY "student_subjects_insert_own"
    ON public.student_subjects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
    );

CREATE POLICY "student_subjects_update_own"
    ON public.student_subjects
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id OR public.is_app_admin()
    )
    WITH CHECK (
        auth.uid() = user_id
    );

CREATE POLICY "student_subjects_delete_own"
    ON public.student_subjects
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id OR public.is_app_admin()
    );

-- 8. Security Trigger: Prevent student privilege escalation
-- Students CANNOT change role, id, or email through client queries
CREATE OR REPLACE FUNCTION public.enforce_student_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow admin or system to alter role or email
    IF (OLD.role <> NEW.role) AND NOT public.is_app_admin() THEN
        -- Check if it's the registered master admin account
        IF LOWER(NEW.email) = 'ahmed.hamada.gana.2012@gmail.com' THEN
            NEW.role := 'admin';
        ELSE
            NEW.role := OLD.role; -- Silently discard unauthorized role tampering
        END IF;
    END IF;

    -- Prevent modifying user id or email directly
    IF OLD.id <> NEW.id THEN
        RAISE EXCEPTION 'Modification of user ID is prohibited';
    END IF;

    IF OLD.email <> NEW.email THEN
        RAISE EXCEPTION 'Modification of profile email must be done via auth service';
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_student_security ON public.student_profiles;
CREATE TRIGGER trg_enforce_student_security
    BEFORE UPDATE ON public.student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_student_security();

-- 9. Automatic User Onboarding Trigger (Runs on auth.users INSERT)
CREATE OR REPLACE FUNCTION public.handle_new_student_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_full_name TEXT;
    user_phone TEXT;
    user_school TEXT;
    user_governorate TEXT;
    user_assigned_role TEXT;
BEGIN
    -- Extract metadata provided during registration
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    user_phone := COALESCE(NEW.raw_user_meta_data->>'phone_whatsapp', '');
    user_school := COALESCE(NEW.raw_user_meta_data->>'school_name', 'مدرسة المتفوقين الثانوية');
    user_governorate := COALESCE(NEW.raw_user_meta_data->>'governorate', 'القاهرة');

    -- Auto-grant admin role if the designated master administrator account signs up
    IF LOWER(NEW.email) = 'ahmed.hamada.gana.2012@gmail.com' THEN
        user_assigned_role := 'admin';
    ELSE
        user_assigned_role := 'student';
    END IF;

    -- Insert into public.student_profiles
    INSERT INTO public.student_profiles (
        id,
        full_name,
        email,
        phone_whatsapp,
        school_name,
        governorate,
        role,
        daily_streak,
        discipline_score,
        preferred_study_hours
    ) VALUES (
        NEW.id,
        user_full_name,
        NEW.email,
        user_phone,
        user_school,
        user_governorate,
        user_assigned_role,
        1,
        95,
        7
    ) ON CONFLICT (id) DO UPDATE SET
        role = CASE 
            WHEN LOWER(NEW.email) = 'ahmed.hamada.gana.2012@gmail.com' THEN 'admin' 
            ELSE public.student_profiles.role 
        END;

    -- Initialize standard Thanaweya Amma Math Curriculum Subjects for the new student
    INSERT INTO public.student_subjects (user_id, subject_code, name_ar, category, total_chapters, completed_chapters, average_score, mastery_percentage, color_hex)
    VALUES
        (NEW.id, 'CALCULUS', 'التفاضل والتكامل', 'رياضيات بحتة', 10, 4, 88, 40, '#2563EB'),
        (NEW.id, 'ALGEBRA_SOLID_GEO', 'الجبر والهندسة الفراغية', 'رياضيات بحتة', 8, 3, 91, 38, '#7C3AED'),
        (NEW.id, 'STATICS', 'الاستاتيكا (توازن الأجسام)', 'رياضيات تطبيقية', 6, 2, 85, 33, '#059669'),
        (NEW.id, 'DYNAMICS', 'الديناميكا (قوانين الحركة)', 'رياضيات تطبيقية', 7, 2, 82, 29, '#D97706'),
        (NEW.id, 'PHYSICS', 'الفيزياء للثانوية العامة', 'العلوم الفيزيائية', 12, 5, 87, 42, '#DC2626')
    ON CONFLICT (user_id, subject_code) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_student_signup();

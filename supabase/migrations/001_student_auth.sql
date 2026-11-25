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
    seating_number VARCHAR(20),
    target_faculty VARCHAR(200),
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    daily_streak INT NOT NULL DEFAULT 0,
    discipline_score INT NOT NULL DEFAULT 0,
    preferred_study_hours INT NOT NULL DEFAULT 2,
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
    last_studied_date VARCHAR(50) NOT NULL DEFAULT 'غير محدد',
    learning_outcomes_total INT NOT NULL DEFAULT 0,
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
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF auth.uid() IS NOT NULL AND NOT public.is_app_admin() THEN
            NEW.role := 'student';
            NEW.daily_streak := 0;
            NEW.discipline_score := 0;
        END IF;
        NEW.updated_at := NOW();
        RETURN NEW;
    END IF;

    IF auth.uid() IS NOT NULL AND NOT public.is_app_admin() AND OLD.id IS DISTINCT FROM NEW.id THEN
        RAISE EXCEPTION 'Modification of user ID is prohibited';
    END IF;
    IF auth.uid() IS NOT NULL AND NOT public.is_app_admin() AND OLD.email IS DISTINCT FROM NEW.email THEN
        RAISE EXCEPTION 'Modification of profile email must be done via auth service';
    END IF;
    IF auth.uid() IS NOT NULL AND NOT public.is_app_admin() AND OLD.role IS DISTINCT FROM NEW.role THEN
        RAISE EXCEPTION 'Only a trusted administrator may change application roles';
    END IF;
    IF auth.uid() IS NOT NULL AND NOT public.is_app_admin() AND (
        OLD.daily_streak IS DISTINCT FROM NEW.daily_streak OR
        OLD.discipline_score IS DISTINCT FROM NEW.discipline_score
    ) THEN
        RAISE EXCEPTION 'Authoritative progress metrics cannot be changed directly by a student';
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_student_security ON public.student_profiles;
CREATE TRIGGER trg_enforce_student_security
    BEFORE INSERT OR UPDATE ON public.student_profiles
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
BEGIN
    -- Extract metadata provided during registration
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    user_phone := COALESCE(NEW.raw_user_meta_data->>'phone_whatsapp', '');
    user_school := NULLIF(BTRIM(NEW.raw_user_meta_data->>'school_name'), '');
    user_governorate := NULLIF(BTRIM(NEW.raw_user_meta_data->>'governorate'), '');

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
        'student',
        0,
        0,
        2
    ) ON CONFLICT (id) DO NOTHING;

    -- Initialize standard Thanaweya Amma Math Curriculum Subjects for the new student
    INSERT INTO public.student_subjects (user_id, subject_code, name_ar, category, total_chapters, completed_chapters, average_score, mastery_percentage, color_hex)
    VALUES
        (NEW.id, 'CALCULUS', 'التفاضل والتكامل', 'رياضيات بحتة', 0, 0, 0, 0, '#2563EB'),
        (NEW.id, 'ALGEBRA_SOLID_GEO', 'الجبر والهندسة الفراغية', 'رياضيات بحتة', 0, 0, 0, 0, '#7C3AED'),
        (NEW.id, 'STATICS', 'الاستاتيكا', 'رياضيات تطبيقية', 0, 0, 0, 0, '#059669'),
        (NEW.id, 'DYNAMICS', 'الديناميكا', 'رياضيات تطبيقية', 0, 0, 0, 0, '#D97706')
    ON CONFLICT (user_id, subject_code) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_student_signup();

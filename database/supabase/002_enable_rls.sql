-- ==============================================================================
-- Thanaweya Amma Math Copilot - Supabase Database Migration
-- File: database/supabase/002_enable_rls.sql
-- Enables Row Level Security (RLS) & Security Policies
-- ==============================================================================

-- 1. Enable Row Level Security (RLS)
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;

-- 2. Helper Security Function: Is User Admin
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

-- 3. Row Level Security Policies for student_profiles
-- Drop existing policies if any
DROP POLICY IF EXISTS "student_profiles_select_own_or_admin" ON public.student_profiles;
DROP POLICY IF EXISTS "student_profiles_insert_own" ON public.student_profiles;
DROP POLICY IF EXISTS "student_profiles_update_own" ON public.student_profiles;

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
        auth.uid() = id
    );

-- 4. Row Level Security Policies for student_subjects
DROP POLICY IF EXISTS "student_subjects_select_own" ON public.student_subjects;
DROP POLICY IF EXISTS "student_subjects_insert_own" ON public.student_subjects;
DROP POLICY IF EXISTS "student_subjects_update_own" ON public.student_subjects;
DROP POLICY IF EXISTS "student_subjects_delete_own" ON public.student_subjects;

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

-- 5. Security Trigger: Prevent student privilege escalation
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

-- 6. Automatic User Onboarding Trigger (Runs on auth.users INSERT)
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
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    user_phone := COALESCE(NEW.raw_user_meta_data->>'phone_whatsapp', '');
    user_school := NULLIF(BTRIM(NEW.raw_user_meta_data->>'school_name'), '');
    user_governorate := NULLIF(BTRIM(NEW.raw_user_meta_data->>'governorate'), '');

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

    -- Initialize standard Thanaweya Amma Math Curriculum Subjects
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

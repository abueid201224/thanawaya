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

    -- Prevent modifying user id directly
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
    user_assigned_role TEXT;
BEGIN
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

    -- Initialize standard Thanaweya Amma Math Curriculum Subjects
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

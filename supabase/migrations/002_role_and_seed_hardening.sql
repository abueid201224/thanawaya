-- Security and data-integrity hardening for existing deployments.
-- Existing admin grants are revoked here: verify an operator out-of-band, then
-- promote that exact Supabase Auth UUID manually with the SQL Editor (see README).

-- Remove legacy roles that were assigned by a public email-address rule.
UPDATE public.student_profiles
SET role = 'student', updated_at = NOW()
WHERE role = 'admin';

ALTER TABLE public.student_profiles
  ALTER COLUMN seating_number DROP DEFAULT,
  ALTER COLUMN target_faculty DROP DEFAULT,
  ALTER COLUMN daily_streak SET DEFAULT 0,
  ALTER COLUMN discipline_score SET DEFAULT 0,
  ALTER COLUMN preferred_study_hours SET DEFAULT 2;

ALTER TABLE public.student_subjects
  ALTER COLUMN last_studied_date SET DEFAULT 'غير محدد',
  ALTER COLUMN learning_outcomes_total SET DEFAULT 0;

CREATE OR REPLACE FUNCTION public.enforce_student_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Client-created profiles can never self-assign a privileged role or invented scores.
    IF auth.uid() IS NOT NULL AND NOT public.is_app_admin() THEN
      NEW.role := 'student';
      NEW.daily_streak := 0;
      NEW.discipline_score := 0;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  -- Only a trusted database operator/admin may modify identity or authoritative scores.
  IF auth.uid() IS NOT NULL AND NOT public.is_app_admin() THEN
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Modification of user ID is prohibited';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Modification of profile email must be done via auth service';
    END IF;
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Only a trusted administrator may change application roles';
    END IF;
    IF NEW.daily_streak IS DISTINCT FROM OLD.daily_streak
       OR NEW.discipline_score IS DISTINCT FROM OLD.discipline_score THEN
      RAISE EXCEPTION 'Authoritative progress metrics cannot be changed directly by a student';
    END IF;
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
  user_full_name := COALESCE(NULLIF(BTRIM(NEW.raw_user_meta_data->>'full_name'), ''), split_part(NEW.email, '@', 1));
  user_phone := COALESCE(NEW.raw_user_meta_data->>'phone_whatsapp', '');
  user_school := NULLIF(BTRIM(NEW.raw_user_meta_data->>'school_name'), '');
  user_governorate := NULLIF(BTRIM(NEW.raw_user_meta_data->>'governorate'), '');

  INSERT INTO public.student_profiles (
    id, full_name, email, phone_whatsapp, school_name, governorate,
    role, daily_streak, discipline_score, preferred_study_hours
  ) VALUES (
    NEW.id, user_full_name, NEW.email, user_phone, user_school, user_governorate,
    'student', 0, 0, 2
  ) ON CONFLICT (id) DO NOTHING;

  -- New learners start with no claimed progress. Curriculum counts must be supplied by reviewed content.
  INSERT INTO public.student_subjects (
    user_id, subject_code, name_ar, category, total_chapters,
    completed_chapters, average_score, mastery_percentage, color_hex,
    last_studied_date, learning_outcomes_total, learning_outcomes_mastered
  ) VALUES
    (NEW.id, 'CALCULUS', 'التفاضل والتكامل', 'رياضيات بحتة', 0, 0, 0, 0, '#2563EB', 'غير محدد', 0, 0),
    (NEW.id, 'ALGEBRA_SOLID_GEO', 'الجبر والهندسة الفراغية', 'رياضيات بحتة', 0, 0, 0, 0, '#7C3AED', 'غير محدد', 0, 0),
    (NEW.id, 'STATICS', 'الاستاتيكا', 'رياضيات تطبيقية', 0, 0, 0, 0, '#059669', 'غير محدد', 0, 0),
    (NEW.id, 'DYNAMICS', 'الديناميكا', 'رياضيات تطبيقية', 0, 0, 0, 0, '#D97706', 'غير محدد', 0, 0)
  ON CONFLICT (user_id, subject_code) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_student_signup();

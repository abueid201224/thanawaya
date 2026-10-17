-- Supabase Database Schema for Thanaweya Amma Math Copilot
-- Version: 1.0.0
-- Description: Creates student_profiles table with all required fields

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create student_profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Authentication fields
  email TEXT NOT NULL UNIQUE,
  
  -- Profile fields
  full_name TEXT NOT NULL DEFAULT 'طالب ثانوية عامة',
  phone_whatsapp TEXT,
  school_name TEXT DEFAULT 'مدرسة الثانوية العامة',
  governorate TEXT DEFAULT 'القاهرة',
  seating_number TEXT DEFAULT '60000',
  target_faculty TEXT DEFAULT 'كلية الهندسة',
  
  -- Stats and preferences
  daily_streak INTEGER NOT NULL DEFAULT 1,
  discipline_score INTEGER NOT NULL DEFAULT 95,
  preferred_study_hours INTEGER NOT NULL DEFAULT 7,
  avatar_url TEXT,
  
  -- Role
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_student_profiles_email ON student_profiles(email);
CREATE INDEX IF NOT EXISTS idx_student_profiles_id ON student_profiles(id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_role ON student_profiles(role);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_student_profiles_updated_at ON student_profiles;
CREATE TRIGGER update_student_profiles_updated_at
  BEFORE UPDATE ON student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to authenticated users
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO authenticated;

-- Insert master admin profile (optional - can be created via auth)
-- Uncomment and update with actual admin email if needed
-- INSERT INTO student_profiles (id, email, full_name, role, school_name, governorate, seating_number, target_faculty, daily_streak, discipline_score, preferred_study_hours)
-- VALUES ('master_admin_root', 'ahmed.hamada.gana.2012@gmail.com', 'المهندس أحمد حمادة (مدير النظام)', 'admin', 'الإدارة التعليمية', 'القاهرة', 'ADMIN-001', 'كلية الهندسة', 1, 100, 8)
-- ON CONFLICT (email) DO UPDATE SET 
--   full_name = EXCLUDED.full_name, 
--   role = EXCLUDED.role, 
--   school_name = EXCLUDED.school_name, 
--   governorate = EXCLUDED.governorate, 
--   seating_number = EXCLUDED.seating_number, 
--   target_faculty = EXCLUDED.target_faculty, 
--   daily_streak = EXCLUDED.daily_streak, 
--   discipline_score = EXCLUDED.discipline_score, 
--   preferred_study_hours = EXCLUDED.preferred_study_hours;

COMMENT ON TABLE student_profiles IS 'Table for storing student profiles and preferences for Thanaweya Amma Math Copilot';
COMMENT ON COLUMN student_profiles.full_name IS 'Full name of the student in Arabic';
COMMENT ON COLUMN student_profiles.phone_whatsapp IS 'WhatsApp phone number (required for registration)';
COMMENT ON COLUMN student_profiles.school_name IS 'Name of the school';
COMMENT ON COLUMN student_profiles.governorate IS 'Egyptian governorate';
COMMENT ON COLUMN student_profiles.seating_number IS 'Seating number for exams';
COMMENT ON COLUMN student_profiles.target_faculty IS 'Target faculty for university admission';
COMMENT ON COLUMN student_profiles.role IS 'User role: student or admin';

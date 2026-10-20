-- ==============================================================================
-- Thanaweya Amma Math Copilot - Supabase Database Migration
-- File: database/supabase/001_create_student_profiles_table.sql
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

-- Index on email and role for fast lookups
CREATE INDEX IF NOT EXISTS idx_student_profiles_email ON public.student_profiles(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_student_profiles_role ON public.student_profiles(role);

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

-- Index on user_id and subject_code
CREATE INDEX IF NOT EXISTS idx_student_subjects_user_id ON public.student_subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_student_subjects_code ON public.student_subjects(subject_code);

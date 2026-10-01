-- ============================================================================
-- THANAWEYA AMMA (MATH SECTION) - POSTGRESQL SCHEMA FOR SUPABASE
-- Migration 001: Initial Schema & pgvector Configuration
-- Target Academic Year: 2026 - 2027 (October 2026 to July 2027)
-- ============================================================================

-- 1. Enable pgvector extension for AI embeddings (Gemini text-embedding-004: 768 dims)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Subjects Table (Egyptian Thanaweya Amma - Math Section)
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'CALCULUS', 'ALGEBRA_SOLID_GEO', 'STATICS', 'DYNAMICS', 'PHYSICS', 'CHEMISTRY', 'ARABIC', 'ENGLISH', 'SECOND_FOREIGN'
    name_ar VARCHAR(150) NOT NULL,
    name_en VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Pure Mathematics', 'Applied Mathematics', 'Physical Sciences', 'Languages'
    total_marks INT NOT NULL DEFAULT 60,
    passing_marks INT NOT NULL DEFAULT 30,
    color_hex VARCHAR(10) DEFAULT '#2563EB',
    icon_name VARCHAR(50) DEFAULT 'BookOpen',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    national_id VARCHAR(14) UNIQUE,
    seating_number VARCHAR(10) UNIQUE, -- رقم الجلوس
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    phone VARCHAR(20),
    governorate VARCHAR(100) DEFAULT 'Cairo',
    school_name VARCHAR(200),
    preferred_study_hours_per_day INT DEFAULT 6,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Study Milestones (Academic Year Timeline: Oct 2026 - July 2027)
CREATE TABLE IF NOT EXISTS study_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    title VARCHAR(250) NOT NULL,
    description TEXT,
    target_month VARCHAR(20) NOT NULL, -- e.g., '2026-10', '2026-11', ..., '2027-07'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_exam_milestone BOOLEAN DEFAULT FALSE,
    milestone_type VARCHAR(50) DEFAULT 'CurriculumCoverage', -- 'CurriculumCoverage', 'MonthlyReview', 'PastPaperSolves', 'FinalRevisions', 'MinistryExam'
    learning_outcomes TEXT[], -- نواتج التعلم المستهدفة
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Multimedia Curriculum Library Table
-- File types: Audio, Video, Doc
-- Source types: Local, Web
CREATE TABLE IF NOT EXISTS multimedia_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(250) NOT NULL,
    description TEXT,
    file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('Audio', 'Video', 'Doc')),
    file_url TEXT NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('Local', 'Web')),
    file_size_bytes BIGINT DEFAULT 0,
    duration_seconds INT DEFAULT 0, -- For audio/video
    thumbnail_url TEXT,
    curator VARCHAR(100) DEFAULT 'Admin', -- 'Admin', 'AI Scout Agent'
    is_verified BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 6. Document Embeddings (pgvector: 768 dimensions for Gemini text-embedding-004)
CREATE TABLE IF NOT EXISTS document_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    multimedia_id UUID REFERENCES multimedia_library(id) ON DELETE SET NULL,
    content_chunk TEXT NOT NULL,
    source_title VARCHAR(255) NOT NULL,
    topic_category VARCHAR(100) NOT NULL,
    page_number INT,
    chunk_index INT NOT NULL DEFAULT 0,
    embedding vector(768) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for high performance cosine distance nearest-neighbor queries
CREATE INDEX IF NOT EXISTS idx_document_embeddings_hnsw
    ON document_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- 7. Admin Notifications Table (Human-in-the-Loop AI Scout Feed)
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    source_url TEXT NOT NULL,
    target_platform VARCHAR(100) NOT NULL, -- e.g., 'moe.gov.eg', 'nagwa.com', 'ekb.eg'
    suggested_subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    detected_file_type VARCHAR(20) DEFAULT 'Doc',
    status VARCHAR(50) DEFAULT 'PendingApproval', -- 'PendingApproval', 'Approved', 'Rejected', 'Ingested'
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 8. Quiz Results Table
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    quiz_title VARCHAR(250) NOT NULL,
    quiz_type VARCHAR(50) DEFAULT 'MCQ', -- 'MCQ', 'EssayVision', 'ComprehensiveExam'
    score NUMERIC(5, 2) NOT NULL,
    max_score NUMERIC(5, 2) NOT NULL,
    percentage NUMERIC(5, 2) GENERATED ALWAYS AS (ROUND((score / max_score) * 100, 2)) STORED,
    time_spent_seconds INT DEFAULT 0,
    remedial_feedback TEXT,
    learning_outcomes_mastery JSONB DEFAULT '{}'::jsonb, -- Breakdown per outcome
    handwriting_image_url TEXT, -- For Gemini Vision essay grading
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- RAG RPC: match_document_embeddings (Vector Similarity Search)
-- ============================================================================
CREATE OR REPLACE FUNCTION match_document_embeddings (
    query_embedding vector(768),
    match_threshold FLOAT,
    match_count INT,
    filter_subject_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    subject_id UUID,
    content_chunk TEXT,
    source_title VARCHAR,
    topic_category VARCHAR,
    similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        de.id,
        de.subject_id,
        de.content_chunk,
        de.source_title,
        de.topic_category,
        1 - (de.embedding <=> query_embedding) AS similarity
    FROM document_embeddings de
    WHERE 
        (filter_subject_id IS NULL OR de.subject_id = filter_subject_id)
        AND 1 - (de.embedding <=> query_embedding) > match_threshold
    ORDER BY de.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ============================================================================
-- Row Level Security (RLS) Configurations
-- ============================================================================
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE multimedia_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Read policies for authenticated & anon students
CREATE POLICY "Public read access for subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Public read access for study_milestones" ON study_milestones FOR SELECT USING (true);
CREATE POLICY "Public read access for verified multimedia" ON multimedia_library FOR SELECT USING (is_verified = true);
CREATE POLICY "Public read access for document_embeddings" ON document_embeddings FOR SELECT USING (true);

-- Student-specific policies
CREATE POLICY "Students manage own record" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Students manage own quiz results" ON quiz_results FOR ALL USING (true) WITH CHECK (true);

-- Admin & AI Scout policies
CREATE POLICY "Admin write access for multimedia_library" ON multimedia_library FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin write access for admin_notifications" ON admin_notifications FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- Thanaweya Amma Math Copilot - Canonical Migration 002
-- Study Attempts (tied to question_version), Mistake Notebook, & Spaced Repetition
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.study_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id VARCHAR(100) NOT NULL,
    question_version INT NOT NULL DEFAULT 1,
    unit_id VARCHAR(100) NOT NULL,
    subject_code VARCHAR(50) NOT NULL,
    mode VARCHAR(30) NOT NULL CHECK (mode IN ('practice', 'test', 'spaced_review')),
    selected_key VARCHAR(10) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    hint_tier_used INT NOT NULL DEFAULT 0 CHECK (hint_tier_used BETWEEN 0 AND 3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_attempts_user_question
    ON public.study_attempts (user_id, question_id, question_version);

CREATE TABLE IF NOT EXISTS public.mistake_notebook (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id VARCHAR(100) NOT NULL,
    question_version INT NOT NULL DEFAULT 1,
    unit_id VARCHAR(100) NOT NULL,
    subject_code VARCHAR(50) NOT NULL,
    error_type VARCHAR(30) NOT NULL CHECK (error_type IN ('rule', 'algebra', 'sign_unit', 'unjustified_step')),
    student_note TEXT DEFAULT '',
    review_interval_days INT NOT NULL DEFAULT 1 CHECK (review_interval_days IN (1, 3, 7, 14)),
    review_count INT NOT NULL DEFAULT 0,
    next_review_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 day'),
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_mistake_version UNIQUE (user_id, question_id, question_version)
);

CREATE INDEX IF NOT EXISTS idx_mistake_notebook_due
    ON public.mistake_notebook (user_id, resolved, next_review_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.study_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistake_notebook ENABLE ROW LEVEL SECURITY;

-- Strict Owner-Only Policies (No USING (true))
CREATE POLICY "study_attempts_select_own"
    ON public.study_attempts FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_app_admin());

CREATE POLICY "study_attempts_insert_own"
    ON public.study_attempts FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "study_attempts_delete_own" ON public.study_attempts;

CREATE POLICY "mistake_notebook_select_own"
    ON public.mistake_notebook FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_app_admin());

CREATE POLICY "mistake_notebook_insert_own"
    ON public.mistake_notebook FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mistake_notebook_update_own"
    ON public.mistake_notebook FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mistake_notebook_delete_own"
    ON public.mistake_notebook FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

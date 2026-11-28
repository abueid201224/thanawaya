-- ==============================================================================
-- Thanaweya Amma Math Copilot - Canonical Migration 003
-- Hybrid Sync Schedules + Root-Cause Error Taxonomy + Conceptual Hint
-- ==============================================================================

ALTER TABLE public.mistake_notebook
    ADD COLUMN IF NOT EXISTS conceptual_hint TEXT NOT NULL DEFAULT '';

-- Normalize legacy error_type values to the root-cause taxonomy while keeping constraints strict
UPDATE public.mistake_notebook
SET error_type = CASE error_type
    WHEN 'rule' THEN 'FORMULA_SELECTION'
    WHEN 'algebra' THEN 'ALGEBRAIC_CALC'
    WHEN 'sign_unit' THEN 'MISREAD_GIVENS'
    WHEN 'unjustified_step' THEN 'CONCEPTUAL'
    ELSE error_type
END
WHERE error_type IN ('rule', 'algebra', 'sign_unit', 'unjustified_step');

ALTER TABLE public.mistake_notebook
    DROP CONSTRAINT IF EXISTS mistake_notebook_error_type_check;

ALTER TABLE public.mistake_notebook
    ADD CONSTRAINT mistake_notebook_error_type_check
    CHECK (
        error_type IN (
            'CONCEPTUAL',
            'FORMULA_SELECTION',
            'ALGEBRAIC_CALC',
            'MISREAD_GIVENS',
            'rule',
            'algebra',
            'sign_unit',
            'unjustified_step'
        )
    );

-- Student Schedules & Spaced Interval Settings (Last-Write-Wins via updated_at)
CREATE TABLE IF NOT EXISTS public.student_schedules (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    schedule_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    spaced_intervals_json JSONB NOT NULL DEFAULT '[1, 3, 7, 14]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.student_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_schedules_select_own"
    ON public.student_schedules FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_app_admin());

CREATE POLICY "student_schedules_insert_own"
    ON public.student_schedules FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "student_schedules_update_own"
    ON public.student_schedules FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "student_schedules_delete_own"
    ON public.student_schedules FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

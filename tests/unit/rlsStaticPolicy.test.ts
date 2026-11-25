import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

test('canonical Supabase migrations enforce RLS, owner checks, zero USING(true), and privilege protection', () => {
  const rootDir = path.resolve(process.cwd());
  const mig1Path = path.join(rootDir, 'supabase/migrations/001_student_auth.sql');
  const mig2Path = path.join(rootDir, 'supabase/migrations/002_learning_attempts_and_mistakes.sql');

  const mig1 = fs.readFileSync(mig1Path, 'utf8');
  const mig2 = fs.readFileSync(mig2Path, 'utf8');
  const combined = mig1 + '\n' + mig2;

  // All 4 personal tables enable RLS
  for (const table of ['student_profiles', 'student_subjects', 'study_attempts', 'mistake_notebook']) {
    assert.ok(
      combined.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`),
      `RLS not enabled for ${table}`
    );
  }

  // Strip SQL comments before scanning policy expressions
  const sqlOnly = combined
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '');

  // Zero permissive USING (true) or WITH CHECK (true)
  assert.equal(/USING\s*\(\s*true\s*\)/i.test(sqlOnly), false, 'Found forbidden USING (true)');
  assert.equal(/WITH\s+CHECK\s*\(\s*true\s*\)/i.test(sqlOnly), false, 'Found forbidden WITH CHECK (true)');

  // Update policy on student_profiles has WITH CHECK enforcing owner or admin
  assert.ok(/CREATE POLICY "student_profiles_update_own"[\s\S]*?WITH CHECK\s*\([\s\S]*?auth\.uid\(\)\s*=\s*id\s+OR\s+public\.is_app_admin\(\)/i.test(mig1));

  // Security trigger prevents role tampering and ID/email modification
  assert.ok(mig1.includes('trg_enforce_student_security'));
  assert.ok(mig1.includes('enforce_student_security'));

  // Attempts & mistakes enforce auth.uid() = user_id
  assert.ok(mig2.includes('WITH CHECK (auth.uid() = user_id)'));
});

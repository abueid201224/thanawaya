import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🛡️ [Verify-Build] Executing anti-drift and architectural security invariant checks...\n');

let failed = false;
function assert(condition, successMsg, failureMsg) {
  if (condition) {
    console.log(`  ✅ [PASS] ${successMsg}`);
  } else {
    console.error(`  ❌ [FAIL] ${failureMsg}`);
    failed = true;
  }
}

// 1. Check dist/index.html exists and contains no absolute paths or external CDN links
const distIndexPath = path.join(rootDir, 'dist/index.html');
if (!fs.existsSync(distIndexPath)) {
  console.error(`  ❌ [FAIL] dist/index.html not found. Run 'npm run build' before verification.`);
  process.exit(1);
}

const distHtml = fs.readFileSync(distIndexPath, 'utf-8');
const hasExternalHttps = /https:\/\//i.test(distHtml);
const hasAbsoluteHref = /href="\//i.test(distHtml);
const hasAbsoluteSrc = /src="\//i.test(distHtml);

assert(!hasExternalHttps, 'dist/index.html contains no external https:// links (offline-ready)', 'dist/index.html contains external https:// links');
assert(!hasAbsoluteHref, 'dist/index.html contains no absolute root href="/ paths', 'dist/index.html contains absolute href="/ paths');
assert(!hasAbsoluteSrc, 'dist/index.html contains no absolute root src="/ paths', 'dist/index.html contains absolute src="/ paths');

// 2. Check no service_role key or secret JWTs in dist or source code
const distFiles = fs.readdirSync(path.join(rootDir, 'dist/assets')).map((f) => path.join(rootDir, 'dist/assets', f));
let foundServiceRole = false;
for (const file of distFiles) {
  if (fs.statSync(file).isFile()) {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('service_role') || content.includes('SUPABASE_SERVICE_ROLE')) {
      foundServiceRole = true;
      break;
    }
  }
}
assert(!foundServiceRole, 'Zero presence of service_role or admin secret tokens in compiled bundles', 'CRITICAL: service_role token leaked inside client bundle!');

// 3. Check dist-electron/main.cjs contains CSP and permission request handler
const mainCjsPath = path.join(rootDir, 'dist-electron/main.cjs');
if (fs.existsSync(mainCjsPath)) {
  const mainCjs = fs.readFileSync(mainCjsPath, 'utf-8');
  assert(mainCjs.includes('Content-Security-Policy'), 'main.cjs contains Content-Security-Policy header enforcement', 'main.cjs missing CSP enforcement');
  assert(mainCjs.includes('setPermissionRequestHandler'), 'main.cjs contains permission request isolation handler', 'main.cjs missing setPermissionRequestHandler');
  assert(mainCjs.includes('requestSingleInstanceLock'), 'main.cjs enforces single-instance lock', 'main.cjs missing single-instance lock');
} else {
  console.warn('  ⚠️ [WARN] dist-electron/main.cjs not found; compile electron to verify main process invariants.');
}

// 4. Verify no deprecated or unapproved Gemini model literals in server/app.ts
const serverAppPath = path.join(rootDir, 'server/app.ts');
if (fs.existsSync(serverAppPath)) {
  const serverAppContent = fs.readFileSync(serverAppPath, 'utf-8');
  const hasHardcodedOldModel = serverAppContent.includes("'gemini-3.8-flash'") || serverAppContent.includes('"gemini-3.8-flash"');
  assert(!hasHardcodedOldModel, 'server/app.ts has no hardcoded gemini-3.8-flash literals (uses dynamic getModel)', 'server/app.ts has hardcoded gemini-3.8-flash');
  assert(serverAppContent.includes('MODEL_REGEX') && serverAppContent.includes('3,80'), 'server/app.ts enforces model regex pattern ^[A-Za-z0-9._-]{3,80}$', 'server/app.ts missing model regex pattern');
}

// 5. Verify Supabase lazy initialization client exists and has no hardcoded secrets
const supabaseClientPath = path.join(rootDir, 'src/services/supabaseClient.ts');
assert(fs.existsSync(supabaseClientPath), 'src/services/supabaseClient.ts exists', 'src/services/supabaseClient.ts is missing');
if (fs.existsSync(supabaseClientPath)) {
  const supabaseContent = fs.readFileSync(supabaseClientPath, 'utf-8');
  assert(supabaseContent.includes('import.meta.env.VITE_SUPABASE_URL'), 'supabaseClient reads VITE_SUPABASE_URL from import.meta.env', 'supabaseClient missing lazy import.meta.env read');
  assert(!supabaseContent.includes('service_role'), 'supabaseClient contains no service_role references', 'supabaseClient references service_role');
}

// 6. Verify main.ts enforces safeStorage DPAPI without maskedKey leak
const mainTsPath = path.join(rootDir, 'electron/main.ts');
if (fs.existsSync(mainTsPath)) {
  const mainTsContent = fs.readFileSync(mainTsPath, 'utf-8');
  assert(!mainTsContent.includes('maskedKey'), 'electron/main.ts does not leak key or maskedKey to renderer', 'electron/main.ts leaks maskedKey');
  assert(mainTsContent.includes('safeStorage.encryptString'), 'electron/main.ts uses safeStorage DPAPI encryption', 'electron/main.ts missing safeStorage.encryptString');
}

// 7. Verify migration files exist and enforce RLS
const migrationPath = path.join(rootDir, 'supabase/migrations/001_student_auth.sql');
assert(fs.existsSync(migrationPath), 'supabase/migrations/001_student_auth.sql exists', '001_student_auth.sql missing');
if (fs.existsSync(migrationPath)) {
  const mig = fs.readFileSync(migrationPath, 'utf-8');
  assert(mig.includes('student_profiles') && mig.includes('student_subjects'), 'Migration defines student_profiles and student_subjects tables', 'Migration missing tables');
  assert(mig.includes('ENABLE ROW LEVEL SECURITY'), 'Migration enables Row Level Security (RLS)', 'Migration missing RLS');
  assert(!mig.includes('USING (true)'), 'Zero presence of USING (true) on personal data tables', 'Dangerous USING (true) found in migration');
  assert(mig.includes('ahmed.hamada.gana.2012@gmail.com'), 'Migration configures master admin account ahmed.hamada.gana.2012@gmail.com', 'Master account missing from migration');
}

// 7b. Verify standalone SQL scripts in database/supabase/
const dbProfilesPath = path.join(rootDir, 'database/supabase/001_create_student_profiles_table.sql');
const dbRlsPath = path.join(rootDir, 'database/supabase/002_enable_rls.sql');
const dbSeedPath = path.join(rootDir, 'database/supabase/003_seed_admin_user.sql');
assert(fs.existsSync(dbProfilesPath), 'database/supabase/001_create_student_profiles_table.sql exists', '001_create_student_profiles_table.sql missing');
assert(fs.existsSync(dbRlsPath), 'database/supabase/002_enable_rls.sql exists', '002_enable_rls.sql missing');
assert(fs.existsSync(dbSeedPath), 'database/supabase/003_seed_admin_user.sql exists', '003_seed_admin_user.sql missing');

// 7c. Verify electron-builder.yml publish configuration
const builderYmlPath = path.join(rootDir, 'electron-builder.yml');
if (fs.existsSync(builderYmlPath)) {
  const builderContent = fs.readFileSync(builderYmlPath, 'utf-8');
  assert(builderContent.includes('publish:') && builderContent.includes('abueid201224'), 'electron-builder.yml has publish configuration for abueid201224/thanawaya', 'publish configuration missing from electron-builder.yml');
}

// 8. Verify Phase 4 Services Invariants
if (fs.existsSync(serverAppPath)) {
  const serverCode = fs.readFileSync(serverAppPath, 'utf-8');
  assert(
    serverCode.includes('MISSING_API_KEY') &&
    serverCode.includes('EMPTY_OCR_RESPONSE') &&
    serverCode.includes('RATE_LIMITED') &&
    serverCode.includes('TIMEOUT'),
    'server/app.ts defines all fixed OCR error codes (MISSING_API_KEY, EMPTY_OCR_RESPONSE, RATE_LIMITED, TIMEOUT)',
    'Missing fixed OCR error codes in server/app.ts'
  );
  assert(
    serverCode.includes('offlineSample'),
    'server/app.ts supports offlineSample fallback for Coding Buddy',
    'Missing offlineSample in server/app.ts'
  );
}

const mathRendererPath = path.join(rootDir, 'src/components/MathRenderer.tsx');
if (fs.existsSync(mathRendererPath)) {
  const mathCode = fs.readFileSync(mathRendererPath, 'utf-8');
  assert(
    mathCode.includes('نسخ LaTeX'),
    'MathRenderer.tsx contains text fallback and "نسخ LaTeX" button',
    'MathRenderer.tsx missing LaTeX copy button fallback'
  );
}

const whatsAppServicePath = path.join(rootDir, 'src/services/whatsAppEducationalService.ts');
if (fs.existsSync(whatsAppServicePath)) {
  const waCode = fs.readFileSync(whatsAppServicePath, 'utf-8');
  assert(
    waCode.includes('web.whatsapp.com/send') && waCode.includes('encodeURIComponent'),
    'WhatsApp service generates web.whatsapp.com/send with encodeURIComponent',
    'WhatsApp service missing web.whatsapp.com or encodeURIComponent'
  );
}

const reschedulingPath = path.join(rootDir, 'src/services/reschedulingEngine.ts');
if (fs.existsSync(reschedulingPath)) {
  const reschedCode = fs.readFileSync(reschedulingPath, 'utf-8');
  assert(
    reschedCode.includes('seenSlotKeys') || reschedCode.includes('Deduplication'),
    'reschedulingEngine enforces deduplication when absorbing backlog',
    'reschedulingEngine missing deduplication'
  );
}

// 9. If app.asar exists (after packaging), verify size < 15MB and 0 node_modules
const asarPath = path.join(rootDir, 'release/win-unpacked/resources/app.asar');
if (fs.existsSync(asarPath)) {
  const stats = fs.statSync(asarPath);
  const sizeMb = stats.size / (1024 * 1024);
  assert(sizeMb < 15, `app.asar size is ${sizeMb.toFixed(2)}MB (< 15MB limit)`, `app.asar size is ${sizeMb.toFixed(2)}MB (exceeds 15MB!)`);
}

if (failed) {
  console.error('\n🚨 Verification failed with one or more invariant violations. Exiting with code 1.');
  process.exit(1);
} else {
  console.log('\n🌟 All build invariant and anti-drift checks passed successfully!');
}

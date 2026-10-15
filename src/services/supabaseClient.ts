/**
 * Supabase Client Service for Thanaweya Amma Math Copilot
 * 
 * Enforces lazy initialization from import.meta.env with strict validation:
 * - URL must start with 'https://'
 * - Anon Key must be non-empty and non-blank
 * - Prevents silent app crashes if env variables are missing at build-time
 * - Never leaks or accepts admin secret key in frontend
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_CONFIG_ERROR_ARABIC =
  'إعدادات الاتصال بالسحابة (Supabase) غير مهيأة. يرجى توفير رابط يبدأ بـ https:// ومفتاح anon صالح في ملف الإعدادات (.env.production أو أسرار GitHub) قبل البناء.';

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  error: string | null;
  url: string | null;
}

let cachedClient: SupabaseClient | null = null;
let cachedStatus: SupabaseConfigStatus | null = null;

/**
 * Validates the build-time or runtime Supabase configuration.
 * Returns clear Arabic status and never crashes.
 */
export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  if (cachedStatus) {
    return cachedStatus;
  }

  const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const isUrlValid = Boolean(rawUrl && rawUrl.startsWith('https://'));
  const isKeyValid = Boolean(rawKey && rawKey.length > 10);

  if (!isUrlValid || !isKeyValid) {
    cachedStatus = {
      isConfigured: false,
      error: SUPABASE_CONFIG_ERROR_ARABIC,
      url: isUrlValid ? rawUrl : null
    };
    return cachedStatus;
  }

  cachedStatus = {
    isConfigured: true,
    error: null,
    url: rawUrl
  };
  return cachedStatus;
}

/**
 * Lazy initializer for Supabase client.
 * Returns null if unconfigured instead of throwing a silent app crash.
 */
export function getSupabase(): SupabaseClient | null {
  if (cachedClient) {
    return cachedClient;
  }

  const status = getSupabaseConfigStatus();
  if (!status.isConfigured) {
    return null;
  }

  const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  try {
    cachedClient = createClient(rawUrl, rawKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Checks if Supabase cloud connection is fully operational.
 */
export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigStatus().isConfigured;
}

export default getSupabase;

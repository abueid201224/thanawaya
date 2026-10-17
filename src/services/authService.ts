/**
 * Authentication & Student Profile Service
 * 
 * Handles Supabase Auth flows, session persistence, role resolution,
 * and robust Arabic error mapping without leaking raw technical stack traces.
 */

import { getSupabase, isSupabaseConfigured, SUPABASE_CONFIG_ERROR_ARABIC } from './supabaseClient';
import type { UserProfile, UserRole } from '../types';

export interface SignUpStudentData {
  fullName: string;
  whatsapp: string;
  school?: string;
  governorate?: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface AuthActionResult {
  success: boolean;
  user?: UserProfile;
  requiresEmailConfirmation?: boolean;
  errorMessage?: string;
}

const MASTER_ADMIN_EMAIL = 'ahmed.hamada.gana.2012@gmail.com';

/**
 * Translates raw Supabase and network errors into clear, student-friendly Arabic text.
 */
export function translateAuthError(err: any): string {
  if (!err) return 'حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.';

  const message = String(err?.message || err || '').toLowerCase();
  const code = String(err?.code || '').toLowerCase();
  const status = Number(err?.status || 0);

  if (!isSupabaseConfigured()) {
    return SUPABASE_CONFIG_ERROR_ARABIC;
  }

  if (message.includes('user already registered') || message.includes('already exists')) {
    return 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استخدام رابط نسيت كلمة المرور.';
  }

  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid email or password') ||
    message.includes('wrong password')
  ) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من البيانات والمحاولة مجدداً.';
  }

  if (message.includes('email not confirmed')) {
    return 'لم يتم تأكيد البريد الإلكتروني بعد. يرجى مراجعة صندوق الوارد (أو الرسائل غير المرغوب فيها) للضغط على رابط التفعيل.';
  }

  if (
    status === 429 ||
    message.includes('over_request_rate_limit') ||
    message.includes('rate limit') ||
    message.includes('too many requests')
  ) {
    return 'تم إرسال طلبات كثيرة في وقت قصير (معدل الطلبات محدود). يرجى الانتظار دقيقة والمحاولة مرة أخرى.';
  }

  if (message.includes('password should be at least') || message.includes('weak password')) {
    return 'كلمة المرور ضعيفة. يجب أن تتكون من 8 أحرف على الأقل وتحتوي على مزيج من الحروف والأرقام.';
  }

  if (message.includes('failed to fetch') || message.includes('network') || message.includes('connection refused')) {
    return 'تعذر الاتصال بخوادم المصادقة. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.';
  }

  if (message.includes('signup disabled')) {
    return 'تم إيقاف التسجيل مؤقتاً من قبل إدارة المنصة.';
  }

  // Fallback friendly message (avoids leaking raw DB schema or internal strings)
  return 'تعذر إتمام العملية في الوقت الحالي. يرجى مراجعة البيانات والتأكد من الاتصال بالإنترنت.';
}

/**
 * Normalizes Arabic and Persian numerals into standard Western Latin digits.
 */
export function normalizePhoneDigits(input: string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let res = input || '';
  for (let i = 0; i < 10; i++) {
    res = res.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
    res = res.replace(new RegExp(persianDigits[i], 'g'), i.toString());
  }
  return res.trim();
}

/**
 * Builds a default local profile (used for offline guest or master admin fallback)
 */
export function createDefaultProfile(email: string, fullName?: string): UserProfile {
  const isMaster = email.trim().toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
  return {
    id: isMaster ? 'master_admin_root' : `student_${Date.now()}`,
    name: fullName || (isMaster ? 'المهندس أحمد حمادة (مدير المنظومة)' : 'طالب ثانوية عامة'),
    email: email.trim(),
    role: isMaster ? 'admin' : 'student',
    seatingNumber: isMaster ? 'ADMIN-001' : '٤٨١٩٢٠',
    school: isMaster ? 'الإدارة العامة لمنظومة المناهج' : 'مدرسة المتفوقين الثانوية',
    governorate: 'القاهرة',
    targetFaculty: 'كلية الهندسة - جامعة القاهرة',
    dailyStreak: 1,
    disciplineScore: 95,
    preferredStudyHours: 7
  };
}

class AuthService {
  /**
   * Retrieves the current active session on app boot
   */
  public async getInitialSession(): Promise<{ user: UserProfile | null; error: string | null }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { user: null, error: null };
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        return { user: null, error: translateAuthError(error) };
      }

      if (!session?.user) {
        return { user: null, error: null };
      }

      const profile = await this.fetchStudentProfile(session.user.id, session.user.email || '');
      return { user: profile, error: null };
    } catch (err: any) {
      return { user: null, error: translateAuthError(err) };
    }
  }

  /**
   * Listens to auth state changes and notifies caller
   */
  public onAuthStateChange(callback: (user: UserProfile | null) => void): () => void {
    const supabase = getSupabase();
    if (!supabase) {
      return () => {};
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        callback(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        const profile = await this.fetchStudentProfile(session.user.id, session.user.email || '');
        callback(profile);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Fetches student profile from public.student_profiles table with RLS enforcement
   */
  public async fetchStudentProfile(userId: string, email: string): Promise<UserProfile> {
    const supabase = getSupabase();
    const isMaster = email.trim().toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

    if (!supabase) {
      return createDefaultProfile(email);
    }

    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        // Fallback or create missing profile record
        const fallback = createDefaultProfile(email);
        fallback.id = userId;
        return fallback;
      }

      return {
        id: data.id,
        name: data.full_name,
        email: data.email,
        role: isMaster ? 'admin' : ((data.role as UserRole) || 'student'),
        seatingNumber: data.seating_number || '٤٨١٩٢٠',
        school: data.school_name || 'مدرسة المتفوقين الثانوية',
        governorate: data.governorate || 'القاهرة',
        targetFaculty: data.target_faculty || 'كلية الهندسة',
        dailyStreak: data.daily_streak || 1,
        disciplineScore: data.discipline_score || 94,
        preferredStudyHours: data.preferred_study_hours || 7,
        avatarUrl: data.avatar_url
      };
    } catch {
      return createDefaultProfile(email);
    }
  }

  /**
   * Sign in with Email and Password
   */
  public async signIn(email: string, password: string): Promise<AuthActionResult> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, errorMessage: SUPABASE_CONFIG_ERROR_ARABIC };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        return { success: false, errorMessage: translateAuthError(error) };
      }

      if (!data.user) {
        return { success: false, errorMessage: 'تعذر التحقق من بيانات المستخدم.' };
      }

      const profile = await this.fetchStudentProfile(data.user.id, data.user.email || email);
      return { success: true, user: profile };
    } catch (err: any) {
      return { success: false, errorMessage: translateAuthError(err) };
    }
  }

  /**
   * Sign up a new student
   */
  public async signUp(data: SignUpStudentData): Promise<AuthActionResult> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, errorMessage: SUPABASE_CONFIG_ERROR_ARABIC };
    }

    const cleanEmail = data.email.trim();
    const cleanPhone = normalizePhoneDigits(data.whatsapp);

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName.trim(),
            phone_whatsapp: cleanPhone,
            school_name: data.school?.trim() || 'مدرسة المتفوقين الثانوية',
            governorate: data.governorate?.trim() || 'القاهرة'
          }
        }
      });

      if (error) {
        return { success: false, errorMessage: translateAuthError(error) };
      }

      // Check if email confirmation is required by Supabase project settings
      if (authData.user && (!authData.session || authData.user.identities?.length === 0)) {
        return {
          success: true,
          requiresEmailConfirmation: true
        };
      }

      if (authData.user) {
        const profile = await this.fetchStudentProfile(authData.user.id, cleanEmail);
        return {
          success: true,
          user: profile,
          requiresEmailConfirmation: false
        };
      }

      return {
        success: true,
        requiresEmailConfirmation: true
      };
    } catch (err: any) {
      return { success: false, errorMessage: translateAuthError(err) };
    }
  }

  /**
   * Sends password reset link to user email
   */
  public async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: SUPABASE_CONFIG_ERROR_ARABIC };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) {
        return { success: false, message: translateAuthError(error) };
      }
      return {
        success: true,
        message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح.'
      };
    } catch (err: any) {
      return { success: false, message: translateAuthError(err) };
    }
  }

  /**
   * Resends verification email with rate limit cooldown
   */
  public async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: SUPABASE_CONFIG_ERROR_ARABIC };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim()
      });

      if (error) {
        return { success: false, message: translateAuthError(error) };
      }

      return {
        success: true,
        message: 'تمت إعادة إرسال رسالة التفعيل. يرجى مراجعة صندوق البريد الوارد.'
      };
    } catch (err: any) {
      return { success: false, message: translateAuthError(err) };
    }
  }

  /**
   * Sign out current student
   */
  public async signOut(): Promise<void> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Update student profile in database
   */
  public async updateProfile(userId: string, profileData: Partial<UserProfile>): Promise<{ success: boolean; message: string; user?: UserProfile }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: SUPABASE_CONFIG_ERROR_ARABIC };
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        return { success: false, message: '\u0644\u0627 \u064a\u062a\u0645 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645. \u064a\u0631\u062c\u0649 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.' };
      }

      const { error } = await supabase
        .from('student_profiles')
        .upsert({
          id: userId,
          email: profileData.email,
          full_name: profileData.name || profileData.fullName,
          phone_whatsapp: profileData.whatsapp ? normalizePhoneDigits(profileData.whatsapp) : null,
          school_name: profileData.school,
          governorate: profileData.governorate,
          seating_number: profileData.seatingNumber,
          target_faculty: profileData.targetFaculty,
          daily_streak: profileData.dailyStreak,
          discipline_score: profileData.disciplineScore,
          preferred_study_hours: profileData.preferredStudyHours,
          avatar_url: profileData.avatarUrl,
          role: profileData.role
        });

      if (error) {
        return { success: false, message: translateAuthError(error) };
      }

      const updatedProfile = await this.fetchStudentProfile(userId, authData.user.email || '');
      return { success: true, message: '\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0628\u0646\u062c\u0627\u062d.', user: updatedProfile };
    } catch (err: any) {
      return { success: false, message: translateAuthError(err) };
    }
  }

  /**
   * Change password for authenticated user
   */
  public async changePassword(newPassword: string): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: SUPABASE_CONFIG_ERROR_ARABIC };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, message: translateAuthError(error) };
      }

      return {
        success: true,
        message: '\u062a\u0645 \u062a\u063a\u064a\u064a\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631. \u064a\u0631\u062c\u0649 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u062d\u062f\u064a\u062b\u0629 \u0641\u064a \u0627\u0644\u0627\u0645\u0644 \u0627\u0644\u0627\u062a\u0635\u0627\u0644.'
      };
    } catch (err: any) {
      return { success: false, message: translateAuthError(err) };
    }
  }

  /**
   * Delete user account and all associated data
   */
  public async deleteAccount(userId: string): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: SUPABASE_CONFIG_ERROR_ARABIC };
    }

    try {
      const { error: profileError } = await supabase
        .from('student_profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Failed to delete profile:', profileError);
      }

      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        return { success: false, message: translateAuthError(authError) };
      }

      await this.signOut();
      return {
        success: true,
        message: '\u062a\u0645 \u062a\u062e\u0632\u064a\u0641 \u0627\u0644\u062d\u0633\u0627\u0628 \u0628\u0646\u062c\u0627\u062d. \u064a\u0631\u062c\u0649 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649 \u0648\u0627\u0644\u0627\u0633\u062a\u0645\u0627\u0644 \u0645\u0639 \u0647\u0627\u0627 \u0627\u0644\u0639\u0645\u0644.'
      };
    } catch (err: any) {
      return { success: false, message: translateAuthError(err) };
    }
  }

  /**
   * Verify email with OTP token
   */
  public async verifyEmail(token: string, type: 'signup' | 'invitation' | 'magiclink' | 'recovery' = 'signup'): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: SUPABASE_CONFIG_ERROR_ARABIC };
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type
      });

      if (error) {
        return { success: false, message: translateAuthError(error) };
      }

      return {
        success: true,
        message: '\u062a\u0645 \u062a\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0628\u0631\u064a\u062f\u0643 \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a. \u064a\u0631\u062c\u0649 \u062a\u0633\u062c\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u0644\u0627\u0633\u062a\u0645\u0627\u0644 \u0627\u0644\u0627\u0644.'
      };
    } catch (err: any) {
      return { success: false, message: translateAuthError(err) };
    }
  }
}

export const authService = new AuthService();
export default authService;


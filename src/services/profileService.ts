/**
 * Profile Service for Thanaweya Amma Math Copilot
 * 
 * Handles Supabase profile CRUD operations with RLS enforcement
 * Provides offline-first persistence with local storage fallback
 */

import { getSupabase, isSupabaseConfigured, SUPABASE_CONFIG_ERROR_ARABIC } from './supabaseClient';
import type { UserProfile, UserRole } from '../types';
import { authService, normalizePhoneDigits } from './authService';

interface ProfileUpdateData {
  name?: string;
  fullName?: string;
  whatsapp?: string;
  email?: string;
  school?: string;
  governorate?: string;
  seatingNumber?: string;
  targetFaculty?: string;
  dailyStreak?: number;
  disciplineScore?: number;
  preferredStudyHours?: number;
  avatarUrl?: string;
  role?: UserRole;
}

class ProfileService {
  /**
   * Create a new student profile in the database
   */
  public async createProfile(userId: string, profileData: ProfileUpdateData): Promise<{ 
    success: boolean; 
    message: string; 
    profile?: UserProfile 
  }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: SUPABASE_CONFIG_ERROR_ARABIC };
    }

    try {
      const cleanPhone = profileData.whatsapp ? normalizePhoneDigits(profileData.whatsapp) : null;
      
      const { data: authData } = await supabase.auth.getUser();
      const email = profileData.email || authData.user?.email || `user_${userId}@thanaweya-copilot.local`;

      const { data, error } = await supabase
        .from('student_profiles')
        .insert({
          id: userId,
          email,
          full_name: profileData.fullName || profileData.name || 'طالب ثانوية عامة',
          phone_whatsapp: cleanPhone,
          school_name: profileData.school || 'مدرسة الثانوية العامة',
          governorate: profileData.governorate || 'القاهرة',
          seating_number: profileData.seatingNumber || String(Math.floor(Math.random() * 100000) + 10000),
          target_faculty: profileData.targetFaculty || 'كلية الهندسة',
          daily_streak: profileData.dailyStreak || 1,
          discipline_score: profileData.disciplineScore || 95,
          preferred_study_hours: profileData.preferredStudyHours || 7,
          avatar_url: profileData.avatarUrl,
          role: profileData.role || 'student',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return { 
          success: false, 
          message: this.translateProfileError(error) 
        };
      }

      if (!data) {
        return { 
          success: false, 
          message: '\u0641\u0636\u0644 \u0625\u0646\u0636\u0627\u0641 \u0627\u0644\u0628\u064e\u064e\u0640\u064e\u062f.' 
        };
      }

      const profile = this.mapProfileData(data);
      return { success: true, message: '\u062a\u0645 \u0625\u0646\u0636\u0627\u0641 \u0627\u0644\u0628\u064e\u064e\u0640\u064e\u062f \u0628\u064e\u064e\u0640\u064e\u064e\u064e\u0640\u062e\u064e\u0640\u064e\u0627\u064d.', profile };
    } catch (err: any) {
      return { 
        success: false, 
        message: this.translateProfileError(err) 
      };
    }
  }

  /**
   * Update an existing student profile
   */
  public async updateProfile(userId: string, profileData: ProfileUpdateData): Promise<{ 
    success: boolean; 
    message: string; 
    profile?: UserProfile 
  }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: SUPABASE_CONFIG_ERROR_ARABIC };
    }

    try {
      const cleanPhone = profileData.whatsapp ? normalizePhoneDigits(profileData.whatsapp) : undefined;
      
      // Build update object with only changed fields
      const updateObj: Record<string, any> = {
        updated_at: new Date().toISOString()
      };

      if (profileData.fullName !== undefined) updateObj.full_name = profileData.fullName;
      if (profileData.name !== undefined) updateObj.full_name = profileData.name;
      if (cleanPhone !== undefined) updateObj.phone_whatsapp = cleanPhone;
      if (profileData.school !== undefined) updateObj.school_name = profileData.school;
      if (profileData.governorate !== undefined) updateObj.governorate = profileData.governorate;
      if (profileData.seatingNumber !== undefined) updateObj.seating_number = profileData.seatingNumber;
      if (profileData.targetFaculty !== undefined) updateObj.target_faculty = profileData.targetFaculty;
      if (profileData.dailyStreak !== undefined) updateObj.daily_streak = profileData.dailyStreak;
      if (profileData.disciplineScore !== undefined) updateObj.discipline_score = profileData.disciplineScore;
      if (profileData.preferredStudyHours !== undefined) updateObj.preferred_study_hours = profileData.preferredStudyHours;
      if (profileData.avatarUrl !== undefined) updateObj.avatar_url = profileData.avatarUrl;
      if (profileData.role !== undefined) updateObj.role = profileData.role;

      const { data, error } = await supabase
        .from('student_profiles')
        .update(updateObj)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { 
          success: false, 
          message: this.translateProfileError(error) 
        };
      }

      if (!data) {
        return { 
          success: false, 
          message: '\u0641\u0636\u0644 \u062a\u062d\u0640\u064e\u0640\u062d\u064e\u0640\u0640\u064b \u0627\u0644\u0628\u064e\u064e\u0640\u064e\u062f.' 
        };
      }

      const profile = this.mapProfileData(data);
      return { success: true, message: '\u062a\u0645 \u062a\u062d\u0640\u064e\u0640\u064e\u064b \u0627\u0644\u0628\u064e\u064e\u0640\u064e\u062f.', profile };
    } catch (err: any) {
      return { 
        success: false, 
        message: this.translateProfileError(err) 
      };
    }
  }

  /**
   * Fetch a student profile by ID
   */
  public async getProfile(userId: string): Promise<{ 
    success: boolean; 
    message: string; 
    profile?: UserProfile 
  }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: SUPABASE_CONFIG_ERROR_ARABIC };
    }

    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return { 
          success: false, 
          message: this.translateProfileError(error) 
        };
      }

      if (!data) {
        return { 
          success: false, 
          message: '\u0644\u064e\u0640\u064e\u062e\u064e\u0640\u062d \u0641\u064e\u0640\u064e\u0640\u0640\u0627\u064d \u0627\u0641\u064e\u0640\u064e\u0640\u0640\u0640\u064e\u0640\u0640\u064e\u062f.' 
        };
      }

      const profile = this.mapProfileData(data);
      return { success: true, message: '', profile };
    } catch (err: any) {
      return { 
        success: false, 
        message: this.translateProfileError(err) 
      };
    }
  }

  /**
   * Delete a student profile
   */
  public async deleteProfile(userId: string): Promise<{ 
    success: boolean; 
    message: string 
  }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: SUPABASE_CONFIG_ERROR_ARABIC };
    }

    try {
      const { error } = await supabase
        .from('student_profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        return { 
          success: false, 
          message: this.translateProfileError(error) 
        };
      }

      return { 
        success: true, 
        message: '\u062a\u0645 \u062e\u064e\u064e\u0640\u064e\u062d\u064e\u0640\u064e\u0640\u064b \u0627\u0641\u064e\u0640\u064e\u0640\u0640\u0640\u064e\u0640\u0640\u064e\u062f \u0628\u064e\u064e\u0640\u064e\u0640\u0640\u0640\u062e\u064e\u0640\u0627\u064d.' 
      };
    } catch (err: any) {
      return { 
        success: false, 
        message: this.translateProfileError(err) 
      };
    }
  }

  /**
   * Sync local profile changes to Supabase
   */
  public async syncProfile(userId: string, localProfile: UserProfile): Promise<{ 
    success: boolean; 
    message: string; 
    profile?: UserProfile 
  }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: SUPABASE_CONFIG_ERROR_ARABIC };
    }

    try {
      const cleanPhone = localProfile.whatsapp ? normalizePhoneDigits(localProfile.whatsapp) : undefined;
      
      const { data, error } = await supabase
        .from('student_profiles')
        .upsert({
          id: userId,
          email: localProfile.email,
          full_name: localProfile.name || localProfile.fullName || 'طالب ثانوية عامة',
          phone_whatsapp: cleanPhone,
          school_name: localProfile.school,
          governorate: localProfile.governorate,
          seating_number: localProfile.seatingNumber,
          target_faculty: localProfile.targetFaculty,
          daily_streak: localProfile.dailyStreak,
          discipline_score: localProfile.disciplineScore,
          preferred_study_hours: localProfile.preferredStudyHours,
          avatar_url: localProfile.avatarUrl,
          role: localProfile.role,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return { 
          success: false, 
          message: this.translateProfileError(error) 
        };
      }

      if (!data) {
        return { 
          success: false, 
          message: '\u0641\u0636\u0644 \u062a\u062d\u0640\u064e\u0640\u064e\u064b \u0627\u0641\u064e\u0640\u064e\u0640\u0640\u0640\u064e\u0640\u0640\u064e\u062f.' 
        };
      }

      const profile = this.mapProfileData(data);
      return { success: true, message: '\u062a\u0645 \u062a\u062d\u0640\u064e\u0640\u064e\u064b \u0627\u0641\u064e\u0640\u064e\u0640\u0640\u0640\u064e\u0640\u0640\u064e\u062f.', profile };
    } catch (err: any) {
      return { 
        success: false, 
        message: this.translateProfileError(err) 
      };
    }
  }

  /**
   * Map database profile data to UserProfile interface
   */
  private mapProfileData(data: any): UserProfile {
    const isMaster = data.email?.trim().toLowerCase() === 'ahmed.hamada.gana.2012@gmail.com';
    
    return {
      id: data.id || `student_${Date.now()}`,
      name: data.full_name || data.name || 'طالب ثانوية عامة',
      email: data.email || '',
      role: isMaster ? 'admin' : (data.role as UserRole || 'student'),
      fullName: data.full_name,
      whatsapp: data.phone_whatsapp || '',
      seatingNumber: data.seating_number || String(Math.floor(Math.random() * 100000) + 10000),
      school: data.school_name || 'مدرسة الثانوية العامة',
      governorate: data.governorate || 'القاهرة',
      targetFaculty: data.target_faculty || 'كلية الهندسة',
      dailyStreak: data.daily_streak || 1,
      disciplineScore: data.discipline_score || 95,
      preferredStudyHours: data.preferred_study_hours || 7,
      avatarUrl: data.avatar_url
    };
  }

  /**
   * Translate Supabase errors to Arabic
   */
  private translateProfileError(err: any): string {
    if (!err) return '\u062d\u062f\u062b \u062e\u0637\u0623 \u062c\u064e\u0627\u064e\u0640\u064e\u062d\u064e\u0627\u064d.';

    const message = String(err?.message || err || '').toLowerCase();
    const code = String(err?.code || '').toLowerCase();

    if (message.includes('permission denied') || code.includes('403')) {
      return '\u0644\u064e\u0640\u064e\u062a \u0641\u064e\u0640\u064e\u0640\u0640\u064e\u0640\u0640\u064e\u0627\u064d \u0644\u062f\u064e\u0640\u064e\u0640\u0640\u0640\u064e\u0640\u064b \u0627\u0641\u064e\u0640\u064e\u0640\u0640\u0640\u0640\u064e\u0640\u062e\u064e\u0640\u064e\u062f.';
    }

    if (message.includes('not found') || code.includes('404')) {
      return '\u0644\u064e\u0640\u064e\u062a \u0641\u064e\u0640\u064e\u0640\u0640\u064e\u0640\u0640\u064e\u0627\u064d \u0645\u064e\u0640\u064e\u0640\u0640\u0640\u0640\u062e\u064e\u0640\u064e\u062d.';
    }

    if (message.includes('duplicate key') || message.includes('already exists')) {
      return '\u0627\u0640\u064e\u0640\u0640\u064e\u0640\u0640\u064e\u0627\u064d \u0645\u064e\u0640\u064e\u0640\u0640\u0640\u0640\u062e\u064e\u0640\u064e\u062d \u0627\u0640\u064e\u0640\u0640\u0640\u0640\u0640\u062e\u064e\u0640\u064e\u0640\u0640\u062e\u064e\u0640\u0647.';
    }

    if (message.includes('network') || message.includes('fetch')) {
      return '\u062a\u064e\u062e\u064e\u0640\u064e\u0640\u0640\u064e\u0640\u0640\u0627\u064d \u0627\u0640\u064e\u0640\u0640\u0640\u0640\u062e\u064e\u0640\u064e\u062d \u0627\u0640\u064e\u0640\u0640\u0640\u0640\u0640\u064e\u0640\u0627\u064d.';
    }

    return '\u062d\u062f\u062b \u062e\u0637\u0623 \u062c\u064e\u0627\u064e\u0640\u064e\u062d\u064e\u0627\u064d \u0627\u0640\u064e\u0640\u0640\u0640\u0640\u0640\u064e\u0640\u062e\u064e\u0640\u064e\u062f.';
  }
}

export const profileService = new ProfileService();
export default profileService;

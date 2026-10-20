import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Lock,
  Mail,
  School,
  MapPin,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  Sparkles,
  X,
  ExternalLink
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { authService, normalizePhoneDigits } from '../services/authService';
import { isSupabaseConfigured, SUPABASE_CONFIG_ERROR_ARABIC } from '../services/supabaseClient';
import { resilientAudio } from '../services/resilientAudioService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  initialTab?: 'login' | 'register';
}

export const EGYPTIAN_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'القليوبية',
  'الدقهلية',
  'الشرقية',
  'المنوفية',
  'الغربية',
  'كفر الشيخ',
  'البحيرة',
  'دمياط',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'شمال سيناء',
  'جنوب سيناء',
  'بني سويف',
  'الفيوم',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'الوادي الجديد',
  'مطروح'
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  initialTab = 'login'
}) => {
  // Tab State: remembered in localStorage
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(() => {
    try {
      const saved = localStorage.getItem('thanaweya_last_auth_tab');
      if (saved === 'login' || saved === 'register') return saved;
    } catch {
      // fallback
    }
    return initialTab;
  });

  // Mode: form, forgot_password, email_verification_pending
  const [viewState, setViewState] = useState<'form' | 'forgot_password' | 'email_pending'>('form');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState(
    currentUser.email !== 'student@thanaweya-copilot.local' ? currentUser.email : ''
  );
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form State
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerWhatsapp, setRegisterWhatsapp] = useState('');
  const [registerSchool, setRegisterSchool] = useState('');
  const [registerGovernorate, setRegisterGovernorate] = useState('القاهرة');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // Password reset & email verification state
  const [resetEmail, setResetEmail] = useState('');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // UI & Validation State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  // Form input references for auto-focusing on invalid field
  const loginEmailRef = useRef<HTMLInputElement>(null);
  const loginPasswordRef = useRef<HTMLInputElement>(null);
  const regFullNameRef = useRef<HTMLInputElement>(null);
  const regWhatsappRef = useRef<HTMLInputElement>(null);
  const regEmailRef = useRef<HTMLInputElement>(null);
  const regPasswordRef = useRef<HTMLInputElement>(null);
  const regPrivacyRef = useRef<HTMLInputElement>(null);

  // Remember active tab preference
  useEffect(() => {
    try {
      localStorage.setItem('thanaweya_last_auth_tab', activeTab);
    } catch {
      // ignore
    }
  }, [activeTab]);

  // Resend cooldown timer
  useEffect(() => {
    let timer: any = null;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Password strength calculation
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) || /[a-z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 25, label: 'ضعيفة', color: 'bg-rose-500' };
    if (score === 2) return { score: 50, label: 'مقبولة', color: 'bg-amber-500' };
    if (score === 3) return { score: 75, label: 'جيدة جداً', color: 'bg-blue-500' };
    return { score: 100, label: 'ممتازة وقوية', color: 'bg-emerald-500' };
  };

  const handleKeyModifier = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLockOn(e.getModifierState('CapsLock'));
  };

  // Field validation on Blur
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'loginEmail':
      case 'registerEmail':
      case 'resetEmail': {
        const clean = value.trim();
        if (!clean) return 'البريد الإلكتروني مطلوب.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return 'صيغة البريد الإلكتروني غير صحيحة.';
        return '';
      }
      case 'loginPassword': {
        if (!value) return 'كلمة المرور مطلوبة.';
        return '';
      }
      case 'registerFullName': {
        const clean = value.trim();
        if (!clean) return 'الاسم الكامل مطلوب.';
        if (clean.length < 2 || clean.length > 80) return 'يجب أن يكون الاسم بين 2 و80 حرفاً.';
        return '';
      }
      case 'registerWhatsapp': {
        const clean = normalizePhoneDigits(value).replace(/[\s+-]/g, '');
        if (!clean) return 'رقم واتساب مطلوب للتواصل الأكاديمي.';
        if (clean.length < 8 || clean.length > 15) return 'رقم الهاتف يجب أن يتكون من 8 إلى 15 رقماً.';
        return '';
      }
      case 'registerPassword': {
        if (!value) return 'كلمة المرور مطلوبة.';
        if (value.length < 8) return 'يجب ألا تقل كلمة المرور عن 8 أحرف.';
        return '';
      }
      case 'agreePrivacy': {
        if (!agreePrivacy) return 'يجب الموافقة على سياسة الخصوصية للمتابعة.';
        return '';
      }
      default:
        return '';
    }
  };

  const handleBlur = (field: string, val: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, val);
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
  };

  // Login Submit Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setGeneralSuccess(null);

    const emailErr = validateField('loginEmail', loginEmail);
    const pwdErr = validateField('loginPassword', loginPassword);

    if (emailErr || pwdErr) {
      setFieldErrors({ loginEmail: emailErr, loginPassword: pwdErr });
      if (emailErr) loginEmailRef.current?.focus();
      else if (pwdErr) loginPasswordRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.signIn(loginEmail, loginPassword);
      if (res.success && res.user) {
        resilientAudio.playSuccessChime();
        onUpdateUser(res.user);
        onClose();
      } else {
        setGeneralError(res.errorMessage || 'فشل تسجيل الدخول.');
        resilientAudio.playAttentionChime();
        // Clear password on failed attempt
        setLoginPassword('');
        loginPasswordRef.current?.focus();
      }
    } catch (err: any) {
      setGeneralError(err?.message || 'حدث خطأ أثناء الاتصال بالخادم.');
      setLoginPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Register Submit Handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setGeneralSuccess(null);

    const nameErr = validateField('registerFullName', registerFullName);
    const phoneErr = validateField('registerWhatsapp', registerWhatsapp);
    const emailErr = validateField('registerEmail', registerEmail);
    const pwdErr = validateField('registerPassword', registerPassword);
    const privacyErr = !agreePrivacy ? 'يجب الموافقة على سياسة الخصوصية للاستمرار.' : '';

    const errors: Record<string, string> = {
      registerFullName: nameErr,
      registerWhatsapp: phoneErr,
      registerEmail: emailErr,
      registerPassword: pwdErr,
      agreePrivacy: privacyErr
    };

    setFieldErrors(errors);

    // Auto-focus first invalid field
    if (nameErr) {
      regFullNameRef.current?.focus();
      return;
    }
    if (phoneErr) {
      regWhatsappRef.current?.focus();
      return;
    }
    if (emailErr) {
      regEmailRef.current?.focus();
      return;
    }
    if (pwdErr) {
      regPasswordRef.current?.focus();
      return;
    }
    if (privacyErr) {
      regPrivacyRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.signUp({
        fullName: registerFullName,
        whatsapp: registerWhatsapp,
        school: registerSchool,
        governorate: registerGovernorate,
        email: registerEmail,
        password: registerPassword
      });

      if (res.success) {
        resilientAudio.playSuccessChime();
        if (res.requiresEmailConfirmation) {
          setPendingVerificationEmail(registerEmail.trim());
          setResendCooldown(60);
          setViewState('email_pending');
        } else if (res.user) {
          onUpdateUser(res.user);
          onClose();
        }
      } else {
        setGeneralError(res.errorMessage || 'فشلت عملية إنشاء الحساب.');
        resilientAudio.playAttentionChime();
        // Clear password only
        setRegisterPassword('');
        regPasswordRef.current?.focus();
      }
    } catch (err: any) {
      setGeneralError(err?.message || 'حدث خطأ أثناء التسجيل.');
      setRegisterPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot password submit
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateField('resetEmail', resetEmail);
    if (err) {
      setFieldErrors({ resetEmail: err });
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);
    setGeneralSuccess(null);
    try {
      const res = await authService.resetPassword(resetEmail);
      if (res.success) {
        setGeneralSuccess(res.message);
        resilientAudio.playSuccessChime();
      } else {
        setGeneralError(res.message);
      }
    } catch (err: any) {
      setGeneralError(err?.message || 'فشل إرسال الرابط.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend verification email
  const handleResendVerification = async () => {
    if (resendCooldown > 0 || !pendingVerificationEmail) return;
    setIsSubmitting(true);
    try {
      const res = await authService.resendVerificationEmail(pendingVerificationEmail);
      if (res.success) {
        setGeneralSuccess(res.message);
        setResendCooldown(60);
        resilientAudio.playSuccessChime();
      } else {
        setGeneralError(res.message);
      }
    } catch {
      setGeneralError('تعذر إعادة إرسال رسالة التفعيل حالياً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fill Registered Master Account helper for convenient instant testing
  const handleFillMasterAccount = () => {
    setActiveTab('login');
    setViewState('form');
    setLoginEmail('ahmed.hamada.gana.2012@gmail.com');
    setLoginPassword('');
    loginPasswordRef.current?.focus();
  };

  const strength = getPasswordStrength(registerPassword);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-slate-900">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-base font-bold text-slate-900">
                منظومة ثانوية عامة (علمي رياضة)
              </h2>
              <p className="text-xs text-slate-500">
                المصادقة السحابية الآمنة وحفظ السجلات التراكمية
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Account Quick Banner */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-blue-900">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>الحساب المسجل المعتمد:</span>
            <span className="font-mono font-bold text-[11px] text-blue-700 dir-ltr">
              ahmed.hamada.gana.2012@gmail.com
            </span>
          </div>
          <button
            type="button"
            onClick={handleFillMasterAccount}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
          >
            تعبئة سريعة
          </button>
        </div>

        {/* State: Pending Email Verification */}
        {viewState === 'email_pending' && (
          <div className="p-8 space-y-6 text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 border border-blue-200 mx-auto flex items-center justify-center shadow-inner">
              <Mail className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                تحقق من صندوق بريدك الإلكتروني ✉️
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                أرسلنا رسالة تأكيد إلى البريد الإلكتروني{' '}
                <strong className="font-mono text-slate-800 dir-ltr">{pendingVerificationEmail}</strong>.
                يرجى فتح الرابط لتأكيد حسابك، ثم العودة لتسجيل الدخول.
              </p>
            </div>

            {generalSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{generalSuccess}</span>
              </div>
            )}

            {generalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isSubmitting || resendCooldown > 0}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>
                  {resendCooldown > 0
                    ? `إعادة الإرسال بعد (${resendCooldown} ثانية)`
                    : 'إعادة إرسال رسالة التفعيل'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewState('form');
                  setActiveTab('login');
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                العودة لتسجيل الدخول
              </button>
            </div>
          </div>
        )}

        {/* State: Forgot Password Form */}
        {viewState === 'forgot_password' && (
          <form onSubmit={handleForgotPasswordSubmit} className="p-8 space-y-5 animate-in fade-in">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                استعادة كلمة المرور المفقودة
              </h3>
              <p className="text-xs text-slate-500">
                أدخل عنوان بريدك الإلكتروني المسجل لنرسل لك رابط إعادة تعيين كلمة المرور.
              </p>
            </div>

            {generalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2" role="alert">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            {generalSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{generalSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  onBlur={() => handleBlur('resetEmail', resetEmail)}
                  placeholder="student@example.com"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                    fieldErrors.resetEmail
                      ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                  }`}
                  aria-describedby="reset-email-error"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              {fieldErrors.resetEmail && (
                <p id="reset-email-error" className="text-[11px] text-rose-600 mt-1">
                  {fieldErrors.resetEmail}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setViewState('form')}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
              >
                العودة
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>إرسال رابط الاستعادة</span>
              </button>
            </div>
          </form>
        )}

        {/* State: Main Form (Login / Register Tabs) */}
        {viewState === 'form' && (
          <div>
            {/* Tab Header with role="tablist" and arrow navigation */}
            <div
              className="flex border-b border-slate-200 bg-slate-100/70 p-1.5 gap-1.5"
              role="tablist"
              aria-label="خيارات تسجيل الدخول وإنشاء الحساب"
            >
              <button
                id="tab-login"
                role="tab"
                aria-selected={activeTab === 'login'}
                aria-controls="panel-login"
                tabIndex={activeTab === 'login' ? 0 : -1}
                onClick={() => {
                  setActiveTab('login');
                  setGeneralError(null);
                  setFieldErrors({});
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    setActiveTab('register');
                  }
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>تسجيل الدخول</span>
              </button>

              <button
                id="tab-register"
                role="tab"
                aria-selected={activeTab === 'register'}
                aria-controls="panel-register"
                tabIndex={activeTab === 'register' ? 0 : -1}
                onClick={() => {
                  setActiveTab('register');
                  setGeneralError(null);
                  setFieldErrors({});
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    setActiveTab('login');
                  }
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>إنشاء حساب طالب جديد</span>
              </button>
            </div>

            {/* Error Summary Alert */}
            {generalError && (
              <div
                className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{generalError}</div>
              </div>
            )}

            {/* Tab 1: Login Form Panel */}
            {activeTab === 'login' && (
              <form
                id="panel-login"
                role="tabpanel"
                aria-labelledby="tab-login"
                onSubmit={handleLoginSubmit}
                className="p-6 space-y-4 animate-in fade-in"
              >
                {/* Email field */}
                <div>
                  <label htmlFor="login-email-input" className="block text-xs font-bold text-slate-700 mb-1.5">
                    البريد الإلكتروني <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="login-email-input"
                      ref={loginEmailRef}
                      type="email"
                      dir="ltr"
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      onBlur={() => handleBlur('loginEmail', loginEmail)}
                      placeholder="name@example.com"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                        fieldErrors.loginEmail
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-500/20'
                          : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                      }`}
                      aria-describedby={fieldErrors.loginEmail ? 'login-email-error' : undefined}
                      aria-invalid={Boolean(fieldErrors.loginEmail)}
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  {fieldErrors.loginEmail && (
                    <p id="login-email-error" className="text-[11px] text-rose-600 mt-1">
                      {fieldErrors.loginEmail}
                    </p>
                  )}
                </div>

                {/* Password field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-password-input" className="block text-xs font-bold text-slate-700">
                      كلمة المرور <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setViewState('forgot_password')}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password-input"
                      ref={loginPasswordRef}
                      type={showLoginPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      onKeyDown={handleKeyModifier}
                      onKeyUp={handleKeyModifier}
                      onBlur={() => handleBlur('loginPassword', loginPassword)}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                        fieldErrors.loginPassword
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-500/20'
                          : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                      }`}
                      aria-describedby={fieldErrors.loginPassword ? 'login-pwd-error' : undefined}
                      aria-invalid={Boolean(fieldErrors.loginPassword)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label={showLoginPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.loginPassword && (
                    <p id="login-pwd-error" className="text-[11px] text-rose-600 mt-1">
                      {fieldErrors.loginPassword}
                    </p>
                  )}
                  {isCapsLockOn && (
                    <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>تنبيه: زر Caps Lock مفعّل حالياً</span>
                    </p>
                  )}
                </div>

                {/* Remember me checkbox */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span>تذكرني على هذا الجهاز</span>
                  </label>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري تسجيل الدخول...</span>
                      </>
                    ) : (
                      <>
                        <span>تسجيل الدخول إلى حسابي</span>
                        <ArrowRight className="w-4 h-4 rotate-180" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Register Form Panel */}
            {activeTab === 'register' && (
              <form
                id="panel-register"
                role="tabpanel"
                aria-labelledby="tab-register"
                onSubmit={handleRegisterSubmit}
                className="p-6 space-y-3.5 animate-in fade-in"
              >
                {/* Full name */}
                <div>
                  <label htmlFor="reg-name-input" className="block text-xs font-bold text-slate-700 mb-1">
                    الاسم بالكامل (طالب الثانوية العامة) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="reg-name-input"
                    ref={regFullNameRef}
                    type="text"
                    value={registerFullName}
                    onChange={(e) => setRegisterFullName(e.target.value)}
                    onBlur={() => handleBlur('registerFullName', registerFullName)}
                    placeholder="مثال: أحمد محمد علي"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                      fieldErrors.registerFullName
                        ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                    }`}
                    aria-describedby={fieldErrors.registerFullName ? 'reg-name-error' : undefined}
                  />
                  {fieldErrors.registerFullName && (
                    <p id="reg-name-error" className="text-[11px] text-rose-600 mt-1">
                      {fieldErrors.registerFullName}
                    </p>
                  )}
                </div>

                {/* WhatsApp & Phone */}
                <div>
                  <label htmlFor="reg-whatsapp-input" className="block text-xs font-bold text-slate-700 mb-1">
                    رقم الواتساب (للتنبيهات والتقارير) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reg-whatsapp-input"
                      ref={regWhatsappRef}
                      type="tel"
                      dir="ltr"
                      inputMode="tel"
                      value={registerWhatsapp}
                      onChange={(e) => setRegisterWhatsapp(e.target.value)}
                      onBlur={() => handleBlur('registerWhatsapp', registerWhatsapp)}
                      placeholder="+20 10 1234 5678"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 ${
                        fieldErrors.registerWhatsapp
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-500/20'
                          : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                      }`}
                      aria-describedby={fieldErrors.registerWhatsapp ? 'reg-phone-error' : undefined}
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  {fieldErrors.registerWhatsapp && (
                    <p id="reg-phone-error" className="text-[11px] text-rose-600 mt-1">
                      {fieldErrors.registerWhatsapp}
                    </p>
                  )}
                </div>

                {/* School & Governorate (2 Columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-school-input" className="block text-xs font-bold text-slate-700 mb-1">
                      المدرسة (اختياري)
                    </label>
                    <input
                      id="reg-school-input"
                      type="text"
                      value={registerSchool}
                      onChange={(e) => setRegisterSchool(e.target.value)}
                      placeholder="مدرسة المتفوقين الثانوية"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-gov-select" className="block text-xs font-bold text-slate-700 mb-1">
                      المحافظة (قائمة 27 محافظة)
                    </label>
                    <select
                      id="reg-gov-select"
                      value={registerGovernorate}
                      onChange={(e) => setRegisterGovernorate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    >
                      {EGYPTIAN_GOVERNORATES.map((gov) => (
                        <option key={gov} value={gov}>
                          {gov}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="reg-email-input" className="block text-xs font-bold text-slate-700 mb-1">
                    البريد الإلكتروني <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reg-email-input"
                      ref={regEmailRef}
                      type="email"
                      dir="ltr"
                      autoComplete="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      onBlur={() => handleBlur('registerEmail', registerEmail)}
                      placeholder="student@example.com"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                        fieldErrors.registerEmail
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-500/20'
                          : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                      }`}
                      aria-describedby={fieldErrors.registerEmail ? 'reg-email-error' : undefined}
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  {fieldErrors.registerEmail && (
                    <p id="reg-email-error" className="text-[11px] text-rose-600 mt-1">
                      {fieldErrors.registerEmail}
                    </p>
                  )}
                </div>

                {/* Password with Strength Meter and Caps Lock Warning */}
                <div>
                  <label htmlFor="reg-pwd-input" className="block text-xs font-bold text-slate-700 mb-1">
                    كلمة المرور (8 أحرف على الأقل) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reg-pwd-input"
                      ref={regPasswordRef}
                      type={showRegisterPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      onKeyDown={handleKeyModifier}
                      onKeyUp={handleKeyModifier}
                      onBlur={() => handleBlur('registerPassword', registerPassword)}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                        fieldErrors.registerPassword
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-500/20'
                          : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                      }`}
                      aria-describedby={fieldErrors.registerPassword ? 'reg-pwd-error' : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label={showRegisterPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {registerPassword && (
                    <div className="mt-1.5 space-y-1">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${strength.color}`}
                          style={{ width: `${strength.score}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>قوة كلمة المرور:</span>
                        <span className="font-bold">{strength.label}</span>
                      </div>
                    </div>
                  )}

                  {fieldErrors.registerPassword && (
                    <p id="reg-pwd-error" className="text-[11px] text-rose-600 mt-1">
                      {fieldErrors.registerPassword}
                    </p>
                  )}
                  {isCapsLockOn && (
                    <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>تنبيه: زر Caps Lock مفعّل حالياً</span>
                    </p>
                  )}
                </div>

                {/* Privacy agreement checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                    <input
                      ref={regPrivacyRef}
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={(e) => {
                        setAgreePrivacy(e.target.checked);
                        if (e.target.checked) {
                          setFieldErrors((prev) => ({ ...prev, agreePrivacy: '' }));
                        }
                      }}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-slate-600 leading-relaxed text-[11px]">
                      أوافق على{' '}
                      <strong className="text-slate-900">سياسة الخصوصية وحماية بيانات الطلاب القاصرين</strong>
                      ، وأوافق على معالجة البيانات للأغراض التعليمية والإحصائية داخل التطبيق.
                    </span>
                  </label>
                  {fieldErrors.agreePrivacy && (
                    <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.agreePrivacy}</p>
                  )}
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري إنشاء الحساب السحابي...</span>
                      </>
                    ) : (
                      <>
                        <span>إنشاء الحساب وبدء الخطة الدراسية</span>
                        <ArrowRight className="w-4 h-4 rotate-180" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;

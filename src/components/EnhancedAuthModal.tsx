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
  ExternalLink,
  UserPlus,
  LogIn,
  UserCheck,
  Crown,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { authService, normalizePhoneDigits } from '../services/authService';
import { isSupabaseConfigured, SUPABASE_CONFIG_ERROR_ARABIC } from '../services/supabaseClient';
import { resilientAudio } from '../services/resilientAudioService';

interface EnhancedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onOpenSettings?: () => void;
  initialTab?: 'login' | 'register' | 'guest';
}

export const EGYPTIAN_GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الدقهلية', 'الشرقية', 'المنوفية', 'الغربية',
  'كفر الشيخ', 'البحيرة', 'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس', 'قنا', 'أسيوط',
  'سوهاج', 'المنيا', 'أسيوط', 'الوادي الجديد', 'المطروح', 'شمال سيناء', 'جنوب سيناء', 'البحر الأحمر'
];

export const EnhancedAuthModal: React.FC<EnhancedAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onOpenSettings,
  initialTab = 'login'
}) => {
  // Tab State
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'guest'>('login');
  
  // Form State
  const [loginEmail, setLoginEmail] = useState('');
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
  
  // Guest mode state
  const [isProcessingGuest, setIsProcessingGuest] = useState(false);
  
  // Password Reset & Email Verification State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  
  // UI & Validation State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  
  // Form input references
  const loginEmailRef = useRef<HTMLInputElement>(null);
  const loginPasswordRef = useRef<HTMLInputElement>(null);
  const regFullNameRef = useRef<HTMLInputElement>(null);
  const regWhatsappRef = useRef<HTMLInputElement>(null);
  const regEmailRef = useRef<HTMLInputElement>(null);
  const regPasswordRef = useRef<HTMLInputElement>(null);
  const regPrivacyRef = useRef<HTMLInputElement>(null);
  const resetEmailRef = useRef<HTMLInputElement>(null);
  const verificationEmailRef = useRef<HTMLInputElement>(null);
  const tokenRef = useRef<HTMLInputElement>(null);

  // Password strength calculation
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) || /[a-z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 25, label: 'ضعيفة', color: 'bg-rose-500' };
    if (score === 2) return { score: 50, label: 'متوسطة', color: 'bg-amber-500' };
    if (score === 3) return { score: 75, label: 'جيدة', color: 'bg-blue-500' };
    return { score: 100, label: 'ممتازة وقوية', color: 'bg-emerald-500' };
  };

  const handleKeyModifier = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLockOn(e.getModifierState('CapsLock'));
  };

  // Field validation
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'loginEmail':
      case 'registerEmail': {
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
        if (clean.length < 2 || clean.length > 80) return 'يجب أن يكون الاسم بين 2 و80 حرفًا.';
        return '';
      }
      case 'registerWhatsapp': {
        const clean = normalizePhoneDigits(value).replace(/[\s+-]/g, '');
        if (!clean) return 'رقم واتساب مطلوب.';
        if (clean.length < 8 || clean.length > 15) return 'يجب أن يكون رقم الهاتف بين 8 و15 رقمًا.';
        return '';
      }
      case 'registerPassword': {
        if (!value) return 'كلمة المرور مطلوبة.';
        if (value.length < 8) return 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.';
        return '';
      }
      case 'agreePrivacy': {
        if (!agreePrivacy) return 'يجب الموافقة على سياسة الخصوصية وشروط الاستخدام.';
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
        setLoginPassword('');
        loginPasswordRef.current?.focus();
      }
    } catch (err: any) {
      setGeneralError(err?.message || 'حدث خطأ أثناء محاولة تسجيل الدخول.');
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
    const privacyErr = !agreePrivacy ? 'يجب الموافقة على سياسة الخصوصية' : '';

    const errors: Record<string, string> = {
      registerFullName: nameErr,
      registerWhatsapp: phoneErr,
      registerEmail: emailErr,
      registerPassword: pwdErr,
      agreePrivacy: privacyErr
    };

    setFieldErrors(errors);

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

      if (res.success && res.user) {
        resilientAudio.playSuccessChime();
        onUpdateUser(res.user);
        onClose();
      } else {
        setGeneralError(res.errorMessage || 'فشل إنشاء الحساب.');
        resilientAudio.playAttentionChime();
        setRegisterPassword('');
        regPasswordRef.current?.focus();
      }
    } catch (err: any) {
      setGeneralError(err?.message || 'حدث خطأ أثناء إنشاء الحساب.');
      setRegisterPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password Reset Handler
  const handlePasswordReset = async () => {
    setGeneralError(null);
    setResetSuccess(false);
    
    if (!resetEmail.trim()) {
      setFieldErrors((prev) => ({ ...prev, resetEmail: '\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064b \u0645\u0637\u0644\u0648\u0628.' }));
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.trim())) {
      setFieldErrors((prev) => ({ ...prev, resetEmail: '\u0635\u064a\u063a\u0629 \u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064b \u062c\u064a\u062f\u0629.' }));
      return;
    }

    setIsSendingReset(true);
    try {
      const res = await authService.resetPassword(resetEmail.trim());
      if (res.success) {
        setResetSuccess(true);
        setGeneralSuccess(res.message);
        resilientAudio.playSuccessChime();
      } else {
        setGeneralError(res.message);
        resilientAudio.playAttentionChime();
      }
    } catch (err: any) {
      setGeneralError(err?.message || '\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0625\u0639\u0627\u062f\u0629 \u0643\u0644\u0645\u0629.');
    } finally {
      setIsSendingReset(false);
    }
  };

  // Email Verification Handler
  const handleResendVerification = async () => {
    setGeneralError(null);
    setVerificationSuccess(false);
    
    if (!verificationEmail.trim()) {
      setFieldErrors((prev) => ({ ...prev, verificationEmail: '\u0627\u0648\u062f\u0629 \u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064b \u0645\u0637\u0644\u0648\u0628\u0629.' }));
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(verificationEmail.trim())) {
      setFieldErrors((prev) => ({ ...prev, verificationEmail: '\u0635\u064a\u063a\u0629 \u0627\u0640\u0628\u0631\u064e\u064a\u062f \u0627\u0644\u0625\u0644\u064e\u0643\u062a\u0631\u0648\u0646\u064b \u062c\u064e\u0627\u062e\u062f\u0629.' }));
      return;
    }

    setIsSendingVerification(true);
    try {
      const res = await authService.resendVerificationEmail(verificationEmail.trim());
      if (res.success) {
        setVerificationSuccess(true);
        setGeneralSuccess(res.message);
        resilientAudio.playSuccessChime();
      } else {
        setGeneralError(res.message);
        resilientAudio.playAttentionChime();
      }
    } catch (err: any) {
      setGeneralError(err?.message || '\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0625\u0639\u0627\u062f\u0629 \u0628\u0631\u064e\u0647\u0629 \u0627\u0644\u062a\u0641\u0639\u064e\u0644.');
    } finally {
      setIsSendingVerification(false);
    }
  };

  // Token Verification Handler
  const handleVerifyToken = async () => {
    setGeneralError(null);
    
    if (!verificationToken.trim()) {
      setFieldErrors((prev) => ({ ...prev, verificationToken: '\u0627\u0644\u0631\u0645\u064e\u0632 \u0627\u0644\u062a\u0641\u0639\u064e\u0644 \u0645\u0637\u0644\u0648\u0628.' }));
      return;
    }

    setIsVerifyingToken(true);
    try {
      const res = await authService.verifyEmail(verificationToken.trim(), 'signup');
      if (res.success) {
        setVerificationSuccess(true);
        setGeneralSuccess(res.message);
        resilientAudio.playSuccessChime();
        setTimeout(() => {
          setShowForgotPassword(false);
          setVerificationToken('');
        }, 3000);
      } else {
        setGeneralError(res.message);
        resilientAudio.playAttentionChime();
      }
    } catch (err: any) {
      setGeneralError(err?.message || '\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u062a\u0641\u0639\u064e\u0644.');
    } finally {
      setIsVerifyingToken(false);
    }
  };

  // Guest mode handler
  const handleGuestMode = () => {
    setIsProcessingGuest(true);
    setGeneralError(null);
    
    try {
      // Create a guest user
      const guestUser: UserProfile = {
        id: `guest_${Date.now()}`,
        name: 'ضيف',
        dailyStreak: 0,
        email: `guest_${Date.now()}@thanaweya-copilot.local`,
        disciplineScore: 0,
        preferredStudyHours: 2,
        role: 'student',
        whatsapp: '',
        school: '',
        governorate: ''
      };
      
      onUpdateUser(guestUser);
      resilientAudio.playSuccessChime();
      setGeneralSuccess('مرحبًا بك كضيف! يمكنك الاستمتاع بجميع ميزات التطبيق.');
      
      // Close after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setGeneralError(err?.message || 'فشل في إنشاء وضع الضيف.');
    } finally {
      setIsProcessingGuest(false);
    }
  };

  // Fill Master Account helper
  const handleFillMasterAccount = () => {
    setActiveTab('login');
    setLoginEmail('ahmed.hamada.gana.2012@gmail.com');
    setLoginPassword('');
    loginPasswordRef.current?.focus();
  };

  const strength = getPasswordStrength(registerPassword);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-slate-900">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-blue-500/20 ring-2 ring-blue-500/10">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-base font-bold text-slate-900">
                منصة ثانوية الأزهري للذكي للرياضة
              </h2>
              <p className="text-xs text-slate-500">
                منصة شاملة لتعليم ودراسة رياضيات ثانوية عامة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="إغلاق نافذة المصادقة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Account Quick Banner */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-blue-900">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>حساب المشرف التجريبي:</span>
            <span className="font-mono font-bold text-[11px] text-blue-700 dir-ltr">
              ahmed.hamada.gana.2012@gmail.com
            </span>
          </div>
          <button
            type="button"
            onClick={handleFillMasterAccount}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
          >
            تجربة سريعه
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-slate-100 flex gap-1">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'login' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <LogIn className="w-4 h-4" />
            تسجيل الدخول
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'register' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            تسجيل جديد
          </button>
          <button
            onClick={() => setActiveTab('guest')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'guest' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            الاستمرار كضيف
          </button>
        </div>

        {/* Error & Success Messages */}
        {generalError && (
          <div className="px-6 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 mx-6 mt-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {generalError}
          </div>
        )}
        {generalSuccess && (
          <div className="px-6 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2 mx-6 mt-4">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {generalSuccess}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Login Tab */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email-input" className="block text-xs font-bold text-slate-700 mb-1">
                  البريد الإلكتروني
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
                    placeholder="ادخل بريدك الإلكتروني"
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

              <div>
                <label htmlFor="login-password-input" className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة المرور
                </label>
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
                    placeholder="ادخل كلمة المرور"
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
                    <span>تنبيه: زر Caps Lock مفعل</span>
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
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                >
                  ليس لديك حساب؟
                </button>
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
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    <>
                      <span>تسجيل الدخول إلى المنصة</span>
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </>
                  )}
                </button>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 text-center">
                <p className="text-xs text-slate-500 mb-2">أو</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('guest')}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    الاستمرار كضيف
                  </button>
                  {onOpenSettings && (
                    <button
                      type="button"
                      onClick={onOpenSettings}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <SettingsIcon className="w-4 h-4" />
                      الإعدادات
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* Register Tab */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label htmlFor="reg-name-input" className="block text-xs font-bold text-slate-700 mb-1">
                  الاسم الكامل <span className="text-rose-500">*</span>
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

              <div>
                <label htmlFor="reg-whatsapp-input" className="block text-xs font-bold text-slate-700 mb-1">
                  رقم واتساب <span className="text-rose-500">*</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-school-input" className="block text-xs font-bold text-slate-700 mb-1">
                    المدرسة
                  </label>
                  <input
                    id="reg-school-input"
                    type="text"
                    value={registerSchool}
                    onChange={(e) => setRegisterSchool(e.target.value)}
                    placeholder="مدرسة الثانوية العامة"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label htmlFor="reg-gov-select" className="block text-xs font-bold text-slate-700 mb-1">
                    المحافظة
                  </label>
                  <select
                    id="reg-gov-select"
                    value={registerGovernorate}
                    onChange={(e) => setRegisterGovernorate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    {EGYPTIAN_GOVERNORATES.map((gov) => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>
              </div>

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

              <div>
                <label htmlFor="reg-pwd-input" className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة المرور <span className="text-rose-500">*</span>
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
                    <span>تنبيه: زر Caps Lock مفعل</span>
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
                    <strong className="text-slate-900">سياسة الخصوصية وشروط الاستخدام</strong>
                    ، وأتعهد باستخدام المنصة لأغراض تعليمية فقط.
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
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري إنشاء الحساب...
                    </>
                  ) : (
                    <>
                      <span>إنشاء حساب جديد</span>
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </>
                  )}
                </button>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 text-center">
                <p className="text-xs text-slate-500 mb-2">أو</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    تسجيل الدخول
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('guest')}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    الاستمرار كضيف
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Guest Tab */}
          {activeTab === 'guest' && (
            <div className="space-y-4 text-center">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <UserCheck className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">مرحبًا بك كضيف!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                يمكنك الاستمتاع بجميع ميزات المنصة دون الحاجة إلى تسجيل الدخول. 
                سيتم حفظ تقدمك محليًا على الجهاز.
              </p>
              
              <div className="space-y-3 pt-4">
                <button
                  onClick={handleGuestMode}
                  disabled={isProcessingGuest}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isProcessingGuest ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري إعداد وضع الضيف...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      الاستمرار كضيف
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <span>أو</span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    تسجيل الدخول
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    إنشاء حساب
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
          <p className="text-[10px] text-slate-400">
            منصة ثانوية الأزهري الذكي © 2026-2027 | جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  );
};

// Import SettingsIcon from lucide-react
import { Settings } from 'lucide-react';
const SettingsIcon = Settings;

export default EnhancedAuthModal;

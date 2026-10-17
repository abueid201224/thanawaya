import React, { useState, useRef } from 'react';
import {
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { authService } from '../services/authService';
import { resilientAudio } from '../services/resilientAudioService';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSwitchToReset: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
  onSwitchToReset
}) => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ email?: boolean; token?: boolean }>({});
  const [mode, setMode] = useState<'resend' | 'verify'>('resend');
  
  const emailRef = useRef<HTMLInputElement>(null);
  const tokenRef = useRef<HTMLInputElement>(null);

  const validateEmail = (email: string): string => {
    const clean = email.trim();
    if (!clean) return '\u0627\u0648\u062f\u0629 \u0627\u0644\u0628\u0631\u064e\u0649\u062f \u0627\u0644\u0625\u0644\u064e\u0643\u062a\u0631\u0648\u0646\u064b \u0645\u0637\u0644\u0648\u0628\u0629.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return '\u0635\u064e\u064a\u063a\u0629 \u0627\u0640\u0628\u0631\u064e\u0649\u064f\u062f \u0627\u0644\u0625\u0644\u064e\u0643\u062a\u0631\u0648\u0646\u064b \u062c\u064e\u0627\u062e\u062f\u0629.';
    return '';
  };

  const validateToken = (token: string): string => {
    if (!token.trim()) return '\u0627\u0644\u0631\u064e\u0645\u0646 \u0627\u0644\u062a\u0641\u0639\u064e\u0644 \u0645\u0637\u0644\u0648\u0628.';
    return '';
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    const emailError = validateEmail(email);
    if (emailError) {
      setTouched((prev) => ({ ...prev, email: true }));
      setError(emailError);
      emailRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.resendVerificationEmail(email.trim());
      if (res.success) {
        setSuccess(true);
        setMode('verify');
        resilientAudio.playSuccessChime();
      } else {
        setError(res.message);
        resilientAudio.playAttentionChime();
      }
    } catch (err: any) {
      setError(err?.message || '\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0625\u0639\u0627\u062f\u0629 \u0628\u0631\u064e\u0649\u062f \u0627\u0644\u062a\u0641\u0639\u064e\u0644.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const tokenError = validateToken(token);
    if (tokenError) {
      setTouched((prev) => ({ ...prev, token: true }));
      setError(tokenError);
      tokenRef.current?.focus();
      return;
    }

    setIsVerifying(true);
    try {
      const res = await authService.verifyEmail(token.trim(), 'signup');
      if (res.success) {
        setSuccess(true);
        resilientAudio.playSuccessChime();
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(res.message);
        resilientAudio.playAttentionChime();
      }
    } catch (err: any) {
      setError(err?.message || '\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u062a\u0641\u0639\u064e\u0644.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setToken('');
    setSuccess(false);
    setError(null);
    setTouched({});
    setMode('resend');
    onClose();
  };

  if (!isOpen) return null;

  if (success && mode === 'verify') {
    return (
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              \u062a\u0645 \u0627\u0644\u062a\u0641\u0639\u064e\u0644 \u0628\u0646\u062c\u0627\u062d
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              \u0644\u0642\u062f \u062a\u0645 \u062a\u0641\u0639\u064e\u0644 \u0628\u0631\u064e\u0649\u062f\u0643 \u0628\u0646\u062c\u0627\u062d. \u064a\u0645\u0643\u0646\u0643 \u0627\u0644\u0627 \u0627\u0633\u062a\u0645\u0627\u0644 \u0627\u0644\u062a\u0641\u0639\u064e\u0644 \u0648\u0627\u0644\u0627\u0646 \u0644\u062f\u062e\u0648\u0644 \u0627\u0644\u0627\u0645.
            </p>
            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              \u0625\u0644\u062e\u0627\u0635 \u0628\u0627\u0644\u0628\u0631\u064e\u0649\u062f
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success && mode === 'resend') {
    return (
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              \u062a\u0645 \u0625\u0639\u0627\u062f\u0629 \u0625\u0641\u0639\u064e\u0644 \u0627\u0644\u0628\u0631\u064e\u0649\u062f
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              \u0644\u0642\u062f \u062a\u0645 \u0625\u0639\u0627\u062f\u0629 \u0625\u0641\u0639\u064e\u0644 \u0627\u0644\u0628\u0631\u064e\u0649\u062f \u0625\u0644\u0649 \u0628\u0631\u064e\u0649\u062f\u0643. \u064a\u0631\u062c\u0649 \u0645\u0631\u0627\u062c\u0639\u0629 \u0635\u0646\u062f\u0648\u0642 \u0627\u0644\u0628\u0631\u064e\u0649\u062f \u0627\u0644\u062a\u0641\u0639\u064e\u0644.
            </p>
            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              \u0625\u0644\u062e\u0627\u0635 \u0628\u0627\u0646\u062a\u0638\u0627\u0631
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {mode === 'resend' ? '\u0625\u0639\u0627\u062f\u0629 \u0628\u0631\u064e\u0649\u062f \u0627\u0644\u062a\u0641\u0639\u064e\u0644' : '\u062a\u0641\u0639\u064e\u0644 \u0627\u0644\u0628\u0631\u064e\u0649\u062f'}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === 'resend' 
                  ? '\u0625\u0639\u0627\u062f\u0629 \u0625\u0641\u0639\u064e\u0644 \u0627\u0644\u0628\u0631\u064e\u0649\u062f \u0645\u0631\u0648\u0631 \u0627\u0644\u0627\u0645\u0644'
                  : '\u0625\u062f\u0631 \u0631\u0645 \u0627\u0644\u0631\u062e\u0635 \u0627\u0644\u062a\u0641\u0639\u064e\u0644 \u0628\u0627\u0644\u0631\u0631\u064e\u0649\u062f'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="\u0625\u063e\u0644\u0627\u0642"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {mode === 'resend' ? (
            <form onSubmit={handleResend} className="space-y-4">
              <div>
                <label htmlFor="verify-email" className="block text-xs font-bold text-slate-700 mb-1">
                  \u0628\u0631\u064e\u0649\u064f\u062f \u0627\u0644\u0625\u0644\u064e\u0643\u062a\u0631\u0648\u0646\u064b
                </label>
                <div className="relative">
                  <input
                    id="verify-email"
                    ref={emailRef}
                    type="email"
                    dir="ltr"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (touched.email) {
                        setError(validateEmail(e.target.value));
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, email: true }));
                      setError(validateEmail(email));
                    }}
                    placeholder="student@example.com"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                      error && touched.email
                        ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                    }`}
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {touched.email && error && (
                  <p className="text-[11px] text-rose-600 mt-1">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    \u062c\u0627\u0631\u064e \u0625\u0639\u0627\u062f\u0629 \u0628\u0631\u064e\u0649\u062f...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    \u0625\u0639\u0627\u062f\u0629 \u0625\u0641\u0639\u064e\u0644 \u0628\u0631\u064e\u0649\u062f
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label htmlFor="verify-token" className="block text-xs font-bold text-slate-700 mb-1">
                  \u0631\u0645\u064e\u0647 \u0627\u0644\u062a\u0641\u0639\u064e\u0644
                </label>
                <div className="relative">
                  <input
                    id="verify-token"
                    ref={tokenRef}
                    type="text"
                    dir="ltr"
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value);
                      if (touched.token) {
                        setError(validateToken(e.target.value));
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, token: true }));
                      setError(validateToken(token));
                    }}
                    placeholder="\u0625\u062f\u062e\u0644 \u0631\u064e\u0647\u064f\u062f \u0627\u0644\u062a\u0641\u0639\u064e\u0644"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                      error && touched.token
                        ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                    }`}
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {touched.token && error && (
                  <p className="text-[11px] text-rose-600 mt-1">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    \u062c\u0627\u0631\u064e \u0627\u0644\u062a\u0641\u0639\u064e\u0644...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    \u062a\u0641\u0639\u064e\u0644 \u0627\u0644\u0628\u0631\u064e\u0649\u062f
                  </>
                )}
              </button>
            </form>
          )}

          <div className="pt-4 text-center">
            <p className="text-xs text-slate-500 mb-2">\u0623\u0648</p>
            <div className="flex gap-2">
              {mode === 'resend' ? (
                <>
                  <button
                    onClick={onSwitchToReset}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    \u0646\u0633\u064e\u0649 \u0643\u0644\u0645\u0629
                  </button>
                  <button
                    onClick={onSwitchToLogin}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    \u062a\u0633\u062c\u064e\u0644 \u0627\u0644\u062f\u062e\u0648\u0644
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setMode('resend')}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    \u0625\u0639\u0627\u062f\u0629 \u0645\u0631\u0648\u0631
                  </button>
                  <button
                    onClick={onSwitchToLogin}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    \u062a\u0633\u062c\u064e\u0644 \u0627\u0644\u062f\u062e\u0648\u0644
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationModal;

import React, { useState, useEffect } from 'react';
import { MailCheck, RefreshCw, AlertCircle, CheckCircle2, Loader2, X, Send } from 'lucide-react';
import { authService } from '../services/authService';

export interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerified?: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  onVerified
}) => {
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    setNotice(null);
    setError(null);

    try {
      const res = await authService.resendVerificationEmail(email);
      if (res.success) {
        setNotice(res.message);
        setCooldown(60);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err?.message || 'فشل في إعادة إرسال رسالة التفعيل');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-right">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <MailCheck className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 id="verify-modal-title" className="text-lg font-bold">تأكيد البريد الإلكتروني</h2>
              <p className="text-xs text-emerald-100">خطوة ضرورية لتأمين حسابك السحابي</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="text-center py-2 space-y-2">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <MailCheck className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">تم إرسال رابط التحقق إلى بريدك</h3>
            <p className="text-xs font-mono font-bold text-blue-700 bg-blue-50 py-1.5 px-3 rounded-lg inline-block" dir="ltr">
              {email || '—'}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              يرجى النقر على الرابط في الرسالة لتفعيل حسابك ومزامنة جداول المذاكرة ودرجات الامتحانات.
            </p>
          </div>

          {error && (
            <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div role="status" className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{notice}</span>
            </div>
          )}

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={handleResend}
              disabled={isResending || cooldown > 0}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ إعادة الإرسال...</span>
                </>
              ) : cooldown > 0 ? (
                <span>إعادة الإرسال بعد ({cooldown}) ثانية</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>إعادة إرسال رسالة التفعيل</span>
                </>
              )}
            </button>

            {onVerified && (
              <button
                onClick={onVerified}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>تحققت بالفعل، قم بالمتابعة</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationModal;

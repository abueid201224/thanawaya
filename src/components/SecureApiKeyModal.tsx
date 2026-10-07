import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Lock,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Cpu,
  Sparkles,
  ExternalLink,
  HelpCircle,
  X
} from 'lucide-react';
import { nativeDesktop } from '../services/nativeDesktopBridge';
import type { ApiKeyStatus, ApiKeyTestResult } from '../../electron/types';
import { resilientAudio } from '../services/resilientAudioService';

interface SecureApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: () => void;
}

export const SecureApiKeyModal: React.FC<SecureApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyUpdated
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<ApiKeyStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<ApiKeyTestResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const status = await nativeDesktop.getApiKeyStatus();
      setKeyStatus(status);
    } catch {
      // ignore
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setTestResult(null);
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    setIsTesting(true);
    setTestResult(null);
    setStatusMessage(null);
    try {
      const result = await nativeDesktop.testApiKey(apiKeyInput.trim() || undefined);
      setTestResult(result);
      if (result.success) {
        resilientAudio.playSuccessChime();
      } else {
        resilientAudio.playAttentionChime();
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'فشل الاتصال بالنموذج'
      });
      resilientAudio.playAttentionChime();
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKeyInput.trim();
    if (!cleanKey) {
      setStatusMessage({ text: 'يرجى إدخال مفتاح API صالح أولاً', isError: true });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);
    try {
      const res = await nativeDesktop.saveApiKey(cleanKey);
      if (res.success) {
        setApiKeyInput('');
        setStatusMessage({ text: 'تم تشفير وحفظ مفتاح API بنجاح في حماية Windows DPAPI!', isError: false });
        resilientAudio.playSuccessChime();
        await fetchStatus();
        if (onKeyUpdated) onKeyUpdated();
      } else {
        setStatusMessage({ text: res.error || 'فشل حفظ المفتاح المشفر', isError: true });
        resilientAudio.playAttentionChime();
      }
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'خطأ أثناء الحفظ', isError: true });
      resilientAudio.playAttentionChime();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveKey = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف مفتاح API المخزن؟')) return;

    try {
      await nativeDesktop.removeApiKey();
      setApiKeyInput('');
      setTestResult(null);
      setStatusMessage({ text: 'تمت إزالة مفتاح API بنجاح.', isError: false });
      resilientAudio.playClickSound();
      await fetchStatus();
      if (onKeyUpdated) onKeyUpdated();
    } catch {
      setStatusMessage({ text: 'تعذر حذف المفتاح', isError: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                إدارة أمان مفتاح الذكاء الاصطناعي (Gemini API)
              </h2>
              <p className="text-xs text-slate-500">
                تشفير محلي عتادي باستخدام Windows Data Protection (DPAPI)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status Banner */}
          <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 flex items-start gap-3">
            {keyStatus?.isConfigured ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <span>حالة المفتاح:</span>
                {keyStatus?.isConfigured ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[11px]">
                    مفعل ومحمي ({keyStatus.maskedKey || 'مخزن بأمان'})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px]">
                    غير مضبوط - الميزات الذكية معطلة
                  </span>
                )}
              </div>
              <p className="text-slate-500">
                {keyStatus?.isEncryptionAvailable
                  ? '🔒 التشفير العتادي لنظام ويندوز (SafeStorage DPAPI) نشط ويعمل بكفاءة.'
                  : 'ℹ️ وضع التخزين القياسي للمتصفح.'}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveKey} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                مفتاح Google Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={
                    keyStatus?.isConfigured
                      ? 'أدخل مفتاحاً جديداً للاستبدال...'
                      : 'AIzaSy...'
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                لا يتم إرسال هذا المفتاح لأي خوادم خارجية؛ يتم تشفيره محلياً في مجلد بيانات المستخدم فقط.
              </p>
            </div>

            {/* Test result display */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Notice display */}
            {statusMessage && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  statusMessage.isError
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={isTesting || (!apiKeyInput.trim() && !keyStatus?.isConfigured)}
                  className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'جاري الفحص...' : 'اختبار الاتصال'}</span>
                </button>

                {keyStatus?.isConfigured && (
                  <button
                    type="button"
                    onClick={handleRemoveKey}
                    className="px-3 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    title="حذف المفتاح المشفر"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>حذف</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !apiKeyInput.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'جاري التشفير...' : 'حفظ مشفراً'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Helper link */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>هل تحتاج إلى مفتاح مجاني؟</span>
            <button
              onClick={() => nativeDesktop.openExternalUrl('https://aistudio.google.com/app/apikey')}
              className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
            >
              <span>إنشاء مفتاح في Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureApiKeyModal;

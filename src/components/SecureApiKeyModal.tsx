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
  AlertTriangle,
  Info,
  Sliders,
  Check,
  X
} from 'lucide-react';
import { nativeDesktop } from '../services/nativeDesktopBridge';
import type { ApiKeyStatus, ApiKeyTestResult, ModelConfig } from '../../electron/types';
import { resilientAudio } from '../services/resilientAudioService';

interface SecureApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: () => void;
}

export const MODEL_VALIDATION_REGEX = /^[A-Za-z0-9._-]{3,80}$/;

export const SecureApiKeyModal: React.FC<SecureApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'key' | 'model' | 'privacy'>('key');

  // Key state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<ApiKeyStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<ApiKeyTestResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Model state
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
  const [customModelInput, setCustomModelInput] = useState('');
  const [isSavingModel, setIsSavingModel] = useState(false);
  const [modelStatusMessage, setModelStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const [status, mConfig] = await Promise.all([
        nativeDesktop.getApiKeyStatus(),
        nativeDesktop.getModelConfig()
      ]);
      setKeyStatus(status);
      setModelConfig(mConfig);
      setCustomModelInput(mConfig.userConfiguredModel || '');
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
      setModelStatusMessage(null);
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
        setStatusMessage({
          text: 'تم تشفير وحفظ مفتاح API بنجاح في حماية Windows DPAPI!',
          isError: false
        });
        resilientAudio.playSuccessChime();
        await fetchStatus();
        if (onKeyUpdated) onKeyUpdated();
      } else {
        setStatusMessage({
          text: res.error || 'فشل حفظ المفتاح المشفر. التشفير العتادي غير متاح.',
          isError: true
        });
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

  const handleSaveModel = async (modelToSave: string) => {
    const clean = modelToSave.trim();
    if (clean && !MODEL_VALIDATION_REGEX.test(clean)) {
      setModelStatusMessage({
        text: 'اسم النموذج غير صالح. يجب أن يتكون من 3 إلى 80 حرفاً ولا يحتوي إلا على رموز مقبولة (^[A-Za-z0-9._-]{3,80}$).',
        isError: true
      });
      return;
    }

    setIsSavingModel(true);
    setModelStatusMessage(null);
    try {
      const res = await nativeDesktop.saveModelConfig(clean);
      if (res.success) {
        setModelStatusMessage({
          text: clean ? `تم اعتماد النموذج: ${clean}` : 'تمت إعادة تعيين النموذج إلى الافتراضي.',
          isError: false
        });
        resilientAudio.playSuccessChime();
        await fetchStatus();
      } else {
        setModelStatusMessage({
          text: res.error || 'تعذر حفظ النموذج المحدد.',
          isError: true
        });
        resilientAudio.playAttentionChime();
      }
    } catch (err: any) {
      setModelStatusMessage({ text: err?.message || 'حدث خطأ أثناء ضبط النموذج', isError: true });
    } finally {
      setIsSavingModel(false);
    }
  };

  const recommendedModels = [
    { id: 'gemini-flash-latest', label: 'gemini-flash-latest (الافتراضي الموصى به)', desc: 'أسرع نموذج لمسائل الرياضيات والـ OCR' },
    { id: 'gemini-2.5-flash', label: 'gemini-2.5-flash', desc: 'إصدار ثابت عالي السرعة والكفاءة' },
    { id: 'gemini-2.5-pro', label: 'gemini-2.5-pro', desc: 'دقة استدلال متقدمة للمسائل المعقدة' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                إعدادات الذكاء الاصطناعي والأمان (Gemini)
              </h2>
              <p className="text-xs text-slate-500">
                تشفير عتادي محلي (DPAPI) مع تنبيه خصوصية وضبط مرن للنماذج
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1 gap-1">
          <button
            onClick={() => setActiveTab('key')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'key'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>مفتاح API والتشفير</span>
          </button>

          <button
            onClick={() => setActiveTab('model')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'model'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>ضبط النموذج</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>تنبيه الخصوصية</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* TAB 1: API Key & Encryption */}
          {activeTab === 'key' && (
            <div className="space-y-4">
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
                        مضبوط ومحمي بتشفير DPAPI
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px]">
                        غير مضبوط - يرجى إدخال المفتاح لتفعيل الميزات الذكية
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500">
                    {keyStatus?.isEncryptionAvailable
                      ? '🔒 التشفير العتادي لنظام ويندوز (SafeStorage DPAPI) نشط. لا يُحفظ أي نص صريح على القرص.'
                      : '⚠️ تنبيه: تشفير DPAPI غير متاح في بيئة التشغيل هذه. لن يُحفظ المفتاح كنص صريح حفاظاً على الأمان.'}
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
                    لا يتم كشف المفتاح للواجهة أو تسجيله في ملفات السجلات، ويُخزن مشفراً عبر واجهات النظام فقط.
                  </p>
                </div>

                {/* Test Result Display */}
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

                {/* Status Message */}
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
                      <span>{isTesting ? 'جاري الفحص...' : 'اختبار المفتاح'}</span>
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
                      إغلاق
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

              {/* Helper Links */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>احصل على مفتاح مجاني:</span>
                <button
                  onClick={() => nativeDesktop.openExternalUrl('https://aistudio.google.com/app/apikey')}
                  className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  <span>Google AI Studio API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Model Configuration */}
          {activeTab === 'model' && (
            <div className="space-y-4">
              {/* Model Priority Explanation Banner */}
              <div className="p-3.5 rounded-xl border bg-blue-50/70 border-blue-200 text-xs text-blue-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>تسلسل أولوية اختيار نموذج الذكاء الاصطناعي:</span>
                </div>
                <div className="font-mono text-[11px] bg-white/80 p-2 rounded-lg border border-blue-100 space-y-0.5">
                  <p>1. إعداد المستخدم المخصص: {modelConfig?.userConfiguredModel || '(غير محدد)'}</p>
                  <p>2. متغير البيئة GEMINI_MODEL: {modelConfig?.envModel || '(غير محدد)'}</p>
                  <p>3. الافتراضي المعتمد: {modelConfig?.defaultModel || 'gemini-flash-latest'}</p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="font-bold">النموذج النشط حالياً:</span>
                  <span className="px-2 py-0.5 bg-blue-600 text-white rounded-md font-mono text-[11px]">
                    {modelConfig?.currentModel || 'gemini-flash-latest'}
                  </span>
                </div>
              </div>

              {/* Recommended Preset Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  نماذج سريعة موصى بها للثانوية العامة:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {recommendedModels.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setCustomModelInput(item.id);
                        handleSaveModel(item.id);
                      }}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                        modelConfig?.currentModel === item.id
                          ? 'border-blue-500 bg-blue-50/40 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold font-mono">{item.label}</div>
                        <div className="text-[11px] text-slate-500">{item.desc}</div>
                      </div>
                      {modelConfig?.currentModel === item.id && (
                        <Check className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Model Input */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  أو كتابة اسم نموذج يدوي (متحقق بالنمط ^[A-Za-z0-9._-]{'{3,80}'}$):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customModelInput}
                    onChange={(e) => setCustomModelInput(e.target.value)}
                    placeholder="مثال: gemini-flash-latest"
                    dir="ltr"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveModel(customModelInput)}
                    disabled={isSavingModel || !customModelInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingModel ? 'جاري الحفظ...' : 'تطبيق'}
                  </button>
                  {modelConfig?.userConfiguredModel && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomModelInput('');
                        handleSaveModel('');
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
                      title="استعادة الافتراضي"
                    >
                      استعادة
                    </button>
                  )}
                </div>
              </div>

              {/* Model Status Message */}
              {modelStatusMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    modelStatusMessage.isError
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  {modelStatusMessage.text}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Privacy Notice */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border bg-amber-50 border-amber-200 text-amber-900 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>تنبيه الخصوصية وحماية بيانات الطلاب</span>
                </div>
                <p className="text-xs leading-relaxed text-amber-900">
                  عند استخدام الميزات الذكية داخل التطبيق (مثل: <strong>المساعد الرياضي التفاعلي</strong>، و<strong>المسح الضوئي للمسائل اليدوية OCR</strong>، و<strong>مساعد البرمجة التعليمي</strong>)، يتم إرسال نصوص المسائل والرموز الرياضية والصور المرفوعة إلى خوادم شركة <strong>Google</strong> لمعالجتها عبر واجهات برمجية <strong>Gemini API</strong>.
                </p>
                <ul className="text-xs space-y-1 list-disc list-inside text-amber-800">
                  <li>لا يتم إرسال أي كلمات مرور أو مفاتيح خاصة للطلاب خارج جهازك.</li>
                  <li>مفتاح Gemini API يُشفر عتادياً داخل بيئة ويندوز (DPAPI) في حسابك المحلي.</li>
                  <li>تجنب إرسال أي صور تحتوي على معلومات شخصية أو وثائق رسمية في خانة المسح الضوئي.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 space-y-1.5">
                <div className="font-bold text-slate-800">اختصار فتح الإعدادات السريع:</div>
                <p>
                  يمكنك فتح هذه النافذة في أي وقت أثناء تصفح التطبيق بالضغط على الاختصار{' '}
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[11px] text-slate-800">
                    Ctrl+,
                  </kbd>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span>اختصار سريع:</span>
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700 shadow-2xs">
              Ctrl+,
            </kbd>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecureApiKeyModal;

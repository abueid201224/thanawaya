import React, { useState, useEffect } from 'react';
import {
  Settings,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  User,
  Sliders,
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
  Check,
  X,
  Database,
  Keyboard,
  Award,
  School,
  MapPin,
  Phone
} from 'lucide-react';
import { nativeDesktop } from '../services/nativeDesktopBridge';
import type { ApiKeyStatus, ApiKeyTestResult, ModelConfig } from '../../electron/types';
import { resilientAudio } from '../services/resilientAudioService';
import { UserProfile, UserRole } from '../types';
import { getSupabaseConfigStatus } from '../services/supabaseClient';
import { EGYPTIAN_GOVERNORATES } from './AuthModal';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser?: (updated: UserProfile) => void;
  onSwitchRole?: (newRole: UserRole) => void;
}

export const MODEL_VALIDATION_REGEX = /^[A-Za-z0-9._-]{3,80}$/;

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onSwitchRole
}) => {
  const [activeTab, setActiveTab] = useState<'ai_key' | 'profile_role' | 'supabase' | 'shortcuts'>('ai_key');

  // Gemini Key state
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

  // Profile Edit State
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileSchool, setProfileSchool] = useState(currentUser.school);
  const [profileGovernorate, setProfileGovernorate] = useState(currentUser.governorate);
  const [profileSeating, setProfileSeating] = useState(currentUser.seatingNumber);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Supabase Status State
  const supabaseStatus = getSupabaseConfigStatus();

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
      setProfileName(currentUser.name);
      setProfileSchool(currentUser.school);
      setProfileGovernorate(currentUser.governorate);
      setProfileSeating(currentUser.seatingNumber);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Handle Testing Gemini Key
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

  // Handle Saving Gemini Key
  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) {
      setStatusMessage({ text: 'يرجى إدخال مفتاح صالح أو الضغط على مسح المفتاح.', isError: true });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);
    try {
      const result = await nativeDesktop.saveApiKey(apiKeyInput.trim());
      if (result.success) {
        setStatusMessage({ text: 'تم حفظ وتشفير مفتاح Gemini بنجاح عبر Windows DPAPI.' });
        setApiKeyInput('');
        resilientAudio.playSuccessChime();
        await fetchStatus();
      } else {
        setStatusMessage({ text: result.error || 'تعذر حفظ المفتاح.', isError: true });
        resilientAudio.playAttentionChime();
      }
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'تعذر حفظ المفتاح.', isError: true });
      resilientAudio.playAttentionChime();
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Deleting Gemini Key
  const handleDeleteKey = async () => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف المفتاح المخزن في الجهاز؟')) return;

    setIsSaving(true);
    try {
      const result = await nativeDesktop.removeApiKey();
      setStatusMessage({
        text: result.success ? 'تم حذف المفتاح من الجهاز بنجاح.' : 'فشل حذف المفتاح.',
        isError: !result.success
      });
      setTestResult(null);
      setApiKeyInput('');
      await fetchStatus();
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'فشل حذف المفتاح', isError: true });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Saving Model Selection
  const handleSaveModel = async (overrideValue?: string) => {
    const val = (overrideValue !== undefined ? overrideValue : customModelInput).trim();
    if (val && !MODEL_VALIDATION_REGEX.test(val)) {
      setModelStatusMessage({
        text: 'اسم النموذج غير صالح. يجب أن يتكون من 3-80 حرفاً ويتضمن فقط أحرفاً إنجليزية، أرقاماً، شرطات أو نقاط.',
        isError: true
      });
      return;
    }

    setIsSavingModel(true);
    setModelStatusMessage(null);
    try {
      const saveRes = await nativeDesktop.saveModelConfig(val);
      if (saveRes.success) {
        const updated = await nativeDesktop.getModelConfig();
        setModelConfig(updated);
        setCustomModelInput(updated.userConfiguredModel || '');
        setModelStatusMessage({
          text: val ? `تم اعتماد النموذج: ${val}` : `تمت إعادة التعيين للنموذج الافتراضي: ${updated.defaultModel}`
        });
        resilientAudio.playSuccessChime();
      } else {
        setModelStatusMessage({ text: saveRes.error || 'فشل تحديث إعدادات النموذج.', isError: true });
        resilientAudio.playAttentionChime();
      }
    } catch (err: any) {
      setModelStatusMessage({ text: err?.message || 'فشل تحديث إعدادات النموذج.', isError: true });
      resilientAudio.playAttentionChime();
    } finally {
      setIsSavingModel(false);
    }
  };

  // Handle Profile Update
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateUser) return;

    const updated: UserProfile = {
      ...currentUser,
      name: profileName?.trim() || currentUser.name,
      school: profileSchool?.trim() || currentUser.school,
      governorate: profileGovernorate || currentUser.governorate,
      seatingNumber: profileSeating?.trim() || currentUser.seatingNumber
    };

    onUpdateUser(updated);
    setProfileSuccessMsg('تم حفظ وتحديث بيانات الملف الشخصي بنجاح.');
    resilientAudio.playSuccessChime();
    setTimeout(() => setProfileSuccessMsg(null), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="settings-modal-title" className="text-base font-bold text-white">
                  إعدادات المنظومة ولوحة التحكم
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                  Ctrl + ,
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تأمين المفاتيح عبر Windows DPAPI، إدارة النموذج، الصلاحيات، والاتصال السحابي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-slate-950/70 border-b border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('ai_key')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ai_key'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>مفتاح Gemini والذكاء الاصطناعي</span>
          </button>

          <button
            onClick={() => setActiveTab('profile_role')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'profile_role'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>الملف الشخصي والصلاحيات</span>
          </button>

          <button
            onClick={() => setActiveTab('supabase')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'supabase'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>الاتصال السحابي (Supabase)</span>
          </button>

          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'shortcuts'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>اختصارات النظام</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {/* TAB 1: GEMINI AI & DPAPI SECURITY */}
          {activeTab === 'ai_key' && (
            <div className="space-y-5">
              {/* Privacy Warning */}
              <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-600/30 text-blue-200 flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white">تنبيه الخصوصية والأمان:</span>
                  <p className="text-[11px] leading-relaxed text-blue-200/90">
                    عند استخدام المساعد الذكي أو المسح الضوئي (OCR)، يتم إرسال نصوص المسائل وصور المعادلات إلى خوادم Google لمعالجتها عبر نماذج Gemini الرسمية. مفتاحك محمي ومحفوظ محلياً فقط.
                  </p>
                </div>
              </div>

              {/* DPAPI Security Status Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-slate-200">حالة التشفير العتادي (Windows DPAPI):</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    {keyStatus?.isEncryptionAvailable ? 'مفعل ومشفر عتادياً' : 'بيئة الويب المباشرة'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {keyStatus?.isConfigured
                    ? 'المفتاح مفعل ومخزن بتشفير عالي الأمان عبر Electron SafeStorage في نظام ويندوز، ولا يتم تسجيله بنص صريح أبداً.'
                    : 'لم يتم حفظ مفتاح Gemini بعد. يمكنك إدخال مفتاح مجاني من Google AI Studio لتفعيل المساعد وكاميرا المعادلات.'}
                </p>
              </div>

              {/* Key Input Section */}
              <div className="space-y-2">
                <label className="font-bold text-slate-300 flex items-center justify-between">
                  <span>إدخال أو تعديل مفتاح Gemini API:</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 underline font-normal"
                  >
                    <span>الحصول على مفتاح مجاني</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={keyStatus?.isConfigured ? 'المفتاح مخزن ومشفر بنجاح (أدخل قيمة جديدة لتحديثه)...' : 'AIzaSy...'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 dir-ltr text-left"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Key Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveKey}
                  disabled={isSaving || !apiKeyInput.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-40 cursor-pointer shadow-md shadow-blue-600/30"
                >
                  {isSaving ? 'جارٍ الحفظ المشفر...' : 'حفظ المفتاح بتشفير DPAPI'}
                </button>

                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={isTesting}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'جارٍ اختبار الاتصال...' : 'اختبار صلاحية المفتاح'}</span>
                </button>

                {keyStatus?.isConfigured && (
                  <button
                    type="button"
                    onClick={handleDeleteKey}
                    disabled={isSaving}
                    className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-bold border border-rose-800/40 transition-all cursor-pointer flex items-center gap-1 mr-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>حذف المفتاح</span>
                  </button>
                )}
              </div>

              {/* Messages */}
              {statusMessage && (
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2 ${
                    statusMessage.isError
                      ? 'bg-rose-950/30 border-rose-600/40 text-rose-200'
                      : 'bg-emerald-950/30 border-emerald-600/40 text-emerald-200'
                  }`}
                >
                  {statusMessage.isError ? <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {testResult && (
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-950/30 border-emerald-600/40 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-600/40 text-rose-200'
                  }`}
                >
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Model Configuration Priority Section */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-blue-400" />
                    <span>تحديد نموذج الذكاء الاصطناعي النشط:</span>
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">
                    النموذج النشط: {modelConfig?.currentModel || 'gemini-flash-latest'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'gemini-flash-latest', label: 'Flash Latest (الأسرع والأدق)', desc: 'الموصى به' },
                    { id: 'gemini-pro-latest', label: 'Pro Latest (للمسائل المعقدة)', desc: 'تحليل متقدم' },
                    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', desc: 'إصدار حديث' }
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSaveModel(preset.id)}
                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                        modelConfig?.currentModel === preset.id
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs truncate">{preset.label}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{preset.id}</div>
                    </button>
                  ))}
                </div>

                {/* Custom Model Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customModelInput}
                    onChange={(e) => setCustomModelInput(e.target.value)}
                    placeholder="اسم نموذج مخصص (regex: ^[A-Za-z0-9._-]{3,80}$)..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 dir-ltr text-left"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveModel()}
                    disabled={isSavingModel}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 cursor-pointer"
                  >
                    تطبيق
                  </button>
                </div>

                {modelStatusMessage && (
                  <div
                    className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                      modelStatusMessage.isError
                        ? 'bg-rose-950/30 border-rose-600/40 text-rose-200'
                        : 'bg-emerald-950/30 border-emerald-600/40 text-emerald-200'
                    }`}
                  >
                    {modelStatusMessage.isError ? <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{modelStatusMessage.text}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE & RBAC ROLE SWITCHER */}
          {activeTab === 'profile_role' && (
            <div className="space-y-5">
              {/* Role Switcher Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-blue-950/40 border border-purple-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-white">الرتبة الأكاديمية والصلاحية (RBAC):</span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                      currentUser.role === 'admin'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    }`}
                  >
                    {currentUser.role === 'admin' ? 'مشرف أكاديمي / مدير المنظومة' : 'طالب ثانوية عامة'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  الحساب المعتمد للمشرف العام في النظام هو <strong className="text-white font-mono">ahmed.hamada.gana.2012@gmail.com</strong>.
                  يمكنك التبديل بين واجهة الطالب ولوحة تحكم المشرف للمعاينة والاختبار.
                </p>

                {onSwitchRole && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onSwitchRole('student');
                        resilientAudio.playClickSound();
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                        currentUser.role === 'student'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      صلاحية طالب (Student)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSwitchRole('admin');
                        resilientAudio.playClickSound();
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                        currentUser.role === 'admin'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      صلاحية مشرف عام (Admin)
                    </button>
                  </div>
                )}
              </div>

              {/* Profile Fields Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">الاسم الكامل:</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">المدرسة:</label>
                    <input
                      type="text"
                      value={profileSchool}
                      onChange={(e) => setProfileSchool(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">المحافظة:</label>
                    <select
                      value={profileGovernorate}
                      onChange={(e) => setProfileGovernorate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      {EGYPTIAN_GOVERNORATES.map((gov) => (
                        <option key={gov} value={gov}>
                          {gov}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">رقم الجلوس الافتراضي:</label>
                    <input
                      type="text"
                      value={profileSeating}
                      onChange={(e) => setProfileSeating(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    البريد المسجل: <strong className="text-white font-mono">{currentUser.email}</strong>
                  </span>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all cursor-pointer shadow-md shadow-blue-600/30"
                  >
                    حفظ التعديلات
                  </button>
                </div>

                {profileSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-600/40 text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* TAB 3: SUPABASE & CLOUD SYNC */}
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-slate-200">حالة الربط السحابي (Supabase Cloud):</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      supabaseStatus.isConfigured
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {supabaseStatus.isConfigured ? 'مهيأ ومتصل' : 'تمهيد كسول / غير مهيأ'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {supabaseStatus.isConfigured
                    ? `رابط المشروع المعتمد: ${supabaseStatus.url}`
                    : supabaseStatus.error || 'يرجى تهيئة متغيرات البيئة VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env.production.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300">ملاحظات مزامنة البيانات والأمان:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>يتم حفظ الجلسة محلياً عبر التخزين المشفر ولا يُعاد طلب كلمة المرور في كل تشغيل.</li>
                  <li>كافة استعلامات قاعدة البيانات محمية بـ Row Level Security (RLS).</li>
                  <li>الحساب الأساسي المسجل: ahmed.hamada.gana.2012@gmail.com.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: KEYBOARD SHORTCUTS */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              <span className="font-bold text-slate-300">اختصارات لوحة المفاتيح السريعة في التطبيق:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { keys: 'Ctrl + ,', label: 'فتح نافذة الإعدادات ومفتاح Gemini' },
                  { keys: 'Ctrl + P', label: 'فتح نافذة طباعة وتصدير المستندات A4' },
                  { keys: 'Ctrl + F', label: 'التركيز على مربع البحث والاستكشاف' },
                  { keys: 'Esc', label: 'إغلاق النوافذ المنبثقة النشطة' }
                ].map((s, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300 font-medium">{s.label}</span>
                    <kbd className="px-2.5 py-1 rounded-lg bg-slate-800 text-blue-300 font-mono text-[11px] font-bold border border-slate-700">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400 mt-4 flex items-center justify-between">
                <span>إصدار التطبيق: 1.0.0 (Windows x64 Desktop)</span>
                <span>بيئة التشغيل: Electron + Local Server 127.0.0.1</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>اختصار الإغلاق السريع: مفتاح Esc</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

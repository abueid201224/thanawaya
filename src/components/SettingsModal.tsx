import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  ShieldCheck,
  Bell,
  Globe,
  Moon,
  Sun,
  Palette,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  Eye,
  EyeOff,
  Settings as SettingsIcon,
  Crown
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onSwitchRole: (newRole: UserRole) => void;
}

export const EGYPTIAN_GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الدقهلية', 'الشرقية', 'المنوفية', 'الغربية',
  'كفر الشيخ', 'البحيرة', 'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس', 'قنا', 'أسيوط',
  'سوهاج', 'المنيا', 'البحر الأحمر', 'شمال سيناء', 'جنوب سيناء'
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onSwitchRole
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'notifications' | 'admin'>('profile');
  
  const [fullName, setFullName] = useState(currentUser.name || '');
  const [whatsapp, setWhatsapp] = useState(currentUser.whatsapp || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [school, setSchool] = useState(currentUser.school || '');
  const [governorate, setGovernorate] = useState(currentUser.governorate || 'القاهرة');
  
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xl'>('normal');
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [breakReminders, setBreakReminders] = useState(true);
  const [examNotifications, setExamNotifications] = useState(true);
  
  const [adminFullName, setAdminFullName] = useState('');
  const [adminWhatsapp, setAdminWhatsapp] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminCode, setAdminCode] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFullName(currentUser.name || '');
      setWhatsapp(currentUser.whatsapp || '');
      setEmail(currentUser.email || '');
      setSchool(currentUser.school || '');
      setGovernorate(currentUser.governorate || 'القاهرة');
    }
  }, [isOpen, currentUser]);
  
  if (!isOpen) return null;

  const handleSaveProfile = () => {
    setIsSaving(true);
    setError(null);
    
    try {
      const updatedUser = {
        ...currentUser,
        name: fullName,
        whatsapp,
        email,
        school,
        governorate
      };
      
      onUpdateUser(updatedUser);
      setSuccess('تم حفظ التغيرات بنجاح');
    } catch (err: any) {
      setError(err?.message || 'فشل حفظ التغيرات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-slate-900">
        <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-blue-500/20 ring-2 ring-blue-500/10">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-base font-bold text-slate-900">
                الإعدادات
              </h2>
              <p className="text-xs text-slate-500">إدارة حسابك وتفضيلاتك</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="إغلاق الإعدادات"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 flex gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'profile' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <User className="w-4 h-4 inline-block mx-1" />
            الملف الشخصي
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'appearance' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Palette className="w-4 h-4 inline-block mx-1" />
            المظهر
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'notifications' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Bell className="w-4 h-4 inline-block mx-1" />
            الإشعارات
          </button>
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'admin' 
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <Crown className="w-4 h-4 inline-block mx-1" />
              إدارة المشرفين
            </button>
          )}
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ادخل اسمك الكامل"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم واتساب
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    dir="ltr"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+20 10 1234 5678"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المدرسة
                  </label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="مدرسة الثانوية العامة"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المحافظة
                  </label>
                  <select
                    value={governorate}
                    onChange={(e) => setGovernorate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    {EGYPTIAN_GOVERNORATES.map((gov) => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      حفظ التغيرات
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">الوضع</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      theme === 'light'
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Sun className="w-5 h-5 mx-auto text-amber-500" />
                    <p className="text-xs mt-1 font-medium">مضيء</p>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Moon className="w-5 h-5 mx-auto text-slate-600" />
                    <p className="text-xs mt-1 font-medium">داكن</p>
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      theme === 'system'
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Globe className="w-5 h-5 mx-auto text-blue-500" />
                    <p className="text-xs mt-1 font-medium">نظام</p>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">اللغة</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setLanguage('ar')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      language === 'ar'
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg font-bold">ع</span>
                    <p className="text-xs mt-1 font-medium">العربية</p>
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      language === 'en'
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg font-bold">A</span>
                    <p className="text-xs mt-1 font-medium">English</p>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">حجم الخط</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setFontSize('normal')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      fontSize === 'normal'
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-medium">عادي</span>
                  </button>
                  <button
                    onClick={() => setFontSize('large')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      fontSize === 'large'
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-sm font-medium">كبير</span>
                  </button>
                  <button
                    onClick={() => setFontSize('xl')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      fontSize === 'xl'
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg font-medium">ضخم</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="text-sm font-bold text-slate-800 mb-3">الإشعارات العامة</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-medium">تمكين الإشعارات</span>
                    <div
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={`w-10 h-5 rounded-full transition-all cursor-pointer flex items-center px-1 ${
                        notificationsEnabled ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-medium">تمكين الصوت</span>
                    <div
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`w-10 h-5 rounded-full transition-all cursor-pointer flex items-center px-1 ${
                        soundEnabled ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          soundEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="text-sm font-bold text-slate-800 mb-3">تذكيرات الدراسة</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-medium">تذكيرات الاستراحة</span>
                    <div
                      onClick={() => setBreakReminders(!breakReminders)}
                      className={`w-10 h-5 rounded-full transition-all cursor-pointer flex items-center px-1 ${
                        breakReminders ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          breakReminders ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-medium">تذكيرات الامتحانات</span>
                    <div
                      onClick={() => setExamNotifications(!examNotifications)}
                      className={`w-10 h-5 rounded-full transition-all cursor-pointer flex items-center px-1 ${
                        examNotifications ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          examNotifications ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && currentUser.role === 'admin' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <h3 className="text-sm font-bold text-amber-800">إنشاء حساب مشرف جديد</h3>
                <p className="text-xs text-amber-600 mt-1">
                  يمكنك إنشاء حسابات مشرفين جديدة لإدارة النظام
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    value={adminFullName}
                    onChange={(e) => setAdminFullName(e.target.value)}
                    placeholder="ادخل الاسم الكامل"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم واتساب
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      dir="ltr"
                      value={adminWhatsapp}
                      onChange={(e) => setAdminWhatsapp(e.target.value)}
                      placeholder="+20 10 1234 5678"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      dir="ltr"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رمز المشرف
                  </label>
                  <input
                    type="password"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    placeholder="ادخل رمز المشرف"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    رمز المشرف: THANAWEYA_ADMIN_2027
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            onClick={() => {
              onSwitchRole(currentUser.role === 'student' ? 'admin' : 'student');
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            التبديل إلى وضع {currentUser.role === 'student' ? 'المشرف' : 'الطالب'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

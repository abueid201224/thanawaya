import React, { useState } from 'react';
import {
  User,
  Lock,
  Mail,
  School,
  MapPin,
  Target,
  Award,
  X,
  CheckCircle2,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser
}) => {
  const [authMode, setAuthMode] = useState<'profile' | 'login' | 'register'>('profile');

  // Register / Edit Profile form
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [seatingNumber, setSeatingNumber] = useState(currentUser.seatingNumber || '٤٨١٩٢٠');
  const [school, setSchool] = useState(currentUser.school || 'مدرسة المتفوقين الثانوية');
  const [governorate, setGovernorate] = useState(currentUser.governorate || 'القاهرة');
  const [targetFaculty, setTargetFaculty] = useState(currentUser.targetFaculty || 'كلية الهندسة - جامعة القاهرة');
  const [role, setRole] = useState<UserRole>(currentUser.role);
  const [studyHours, setStudyHours] = useState(currentUser.preferredStudyHours || 7);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: UserProfile = {
      ...currentUser,
      name,
      email,
      seatingNumber,
      school,
      governorate,
      targetFaculty,
      role,
      preferredStudyHours: studyHours
    };

    onUpdateUser(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Top Bar */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {authMode === 'profile' && 'الملف الشخصي للطالب وإعدادات الخطة'}
                {authMode === 'login' && 'تسجيل الدخول إلى حسابك'}
                {authMode === 'register' && 'إنشاء حساب طالب ثانوية عامة جديد'}
              </h3>
              <p className="text-[11px] text-slate-400">منظومة ثانوية عامة علمي رياضة ٢٠٢٦ / ٢٠٢٧</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 text-xs">
          <button
            onClick={() => setAuthMode('profile')}
            className={`flex-1 py-2 text-center rounded-lg font-bold transition-all cursor-pointer ${
              authMode === 'profile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            الملف الشخصي
          </button>
          <button
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-2 text-center rounded-lg font-bold transition-all cursor-pointer ${
              authMode === 'login' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-2 text-center rounded-lg font-bold transition-all cursor-pointer ${
              authMode === 'register' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            حساب جديد
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          <div>
            <label className="block text-slate-400 mb-1">الاسم الكامل للطالب</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">رقم الجلوس (اختياري)</label>
              <input
                type="text"
                value={seatingNumber}
                onChange={(e) => setSeatingNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">المحافظة</label>
              <input
                type="text"
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">المدرسة الثانوية</label>
            <div className="relative">
              <School className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">الكلية والهدف المستهدف (الحلم الأكاديمي)</label>
            <div className="relative">
              <Target className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
              <input
                type="text"
                value={targetFaculty}
                onChange={(e) => setTargetFaculty(e.target.value)}
                placeholder="مثلاً: كلية الهندسة - جامعة القاهرة"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">الصلاحية (RBAC)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              >
                <option value="student">طالب ثانوية عامة</option>
                <option value="admin">مشرف تربوي / معلم معتمد</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">ساعات المذاكرة اليومية المستهدفة</label>
              <input
                type="number"
                min="2"
                max="14"
                value={studyHours}
                onChange={(e) => setStudyHours(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer shadow-md shadow-blue-600/30"
            >
              حفظ التعديلات والدخول
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

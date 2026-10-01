import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Smartphone,
  Folder,
  FolderOpen,
  FileText,
  Video,
  Headphones,
  Download,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Search,
  Calendar,
  Clock,
  Sparkles,
  Filter,
  ShieldCheck,
  BookOpen,
  Layers,
  CheckCircle2,
  Printer,
  ChevronRight,
  HardDrive,
  User,
  Send,
  HelpCircle,
  FileCheck2,
  ArrowRight,
  X,
  RefreshCw
} from 'lucide-react';
import {
  StudentWhatsAppConfig,
  TeacherPlatformEntry,
  DownloadedMediaMaterial,
  SubjectCodeType,
  MonthlyPacingTimeline,
  DownloadedFileType
} from '../types/whatsappEducation';
import {
  loadStudentConfig,
  saveStudentConfig,
  loadTeachers,
  saveTeachers,
  loadMaterials,
  saveMaterials,
  MONTHLY_PACING_TIMELINE_DATA
} from '../data/whatsappEducationData';
import { DailyScheduleSlot } from '../types';
import { resilientAudio } from '../services/resilientAudioService';

interface WhatsAppEducationalHubViewProps {
  onAddToDailySchedule?: (slot: DailyScheduleSlot) => void;
  onOpenDocumentExport?: (documentId?: string) => void;
}

export const WhatsAppEducationalHubView: React.FC<WhatsAppEducationalHubViewProps> = ({
  onAddToDailySchedule,
  onOpenDocumentExport
}) => {
  // State
  const [studentConfig, setStudentConfig] = useState<StudentWhatsAppConfig>(loadStudentConfig);
  const [teachers, setTeachers] = useState<TeacherPlatformEntry[]>(loadTeachers);
  const [materials, setMaterials] = useState<DownloadedMediaMaterial[]>(loadMaterials);
  const [activeTab, setActiveTab] = useState<'teachers' | 'library' | 'monthly_pacing'>('teachers');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedFileType, setSelectedFileType] = useState<string>('ALL');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('ALL');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('2026-10');

  // Modals & notices
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<DownloadedMediaMaterial | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Form states for modals
  const [editPhoneInput, setEditPhoneInput] = useState(studentConfig.phoneNumber);
  const [editDirInput, setEditDirInput] = useState(studentConfig.defaultStorageDirectory);

  // New teacher form
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherSubject, setNewTeacherSubject] = useState<SubjectCodeType>('CALCULUS');
  const [newTeacherPhone, setNewTeacherPhone] = useState('+2010');
  const [newTeacherAssistant, setNewTeacherAssistant] = useState('');
  const [newTeacherPlatform, setNewTeacherPlatform] = useState('');
  const [newTeacherGroup, setNewTeacherGroup] = useState('');
  const [newTeacherCode, setNewTeacherCode] = useState('');
  const [newTeacherDays, setNewTeacherDays] = useState('');

  // New material form
  const [newMatTitle, setNewMatTitle] = useState('');
  const [newMatTeacherId, setNewMatTeacherId] = useState('');
  const [newMatFileType, setNewMatFileType] = useState<DownloadedFileType>('pdf_sheet');
  const [newMatFileName, setNewMatFileName] = useState('');
  const [newMatSize, setNewMatSize] = useState('14.2 MB');
  const [newMatMonth, setNewMatMonth] = useState('2026-10');
  const [newMatDate, setNewMatDate] = useState('2026-10-15');
  const [newMatUnit, setNewMatUnit] = useState('الوحدة الأولى');
  const [newMatNotes, setNewMatNotes] = useState('');

  // Persist updates
  useEffect(() => {
    saveStudentConfig(studentConfig);
  }, [studentConfig]);

  useEffect(() => {
    saveTeachers(teachers);
  }, [teachers]);

  useEffect(() => {
    saveMaterials(materials);
  }, [materials]);

  const showToast = (message: string) => {
    setToastNotice(message);
    setTimeout(() => setToastNotice(null), 4000);
  };

  const handleCopyText = (id: string, text: string, label = 'المسار') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    resilientAudio.playClickSound();
    showToast(`تم نسخ ${label} إلى الحافظة بنجاح!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSaveStudentConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentConfig((prev) => ({
      ...prev,
      phoneNumber: editPhoneInput.trim(),
      defaultStorageDirectory: editDirInput.trim()
    }));
    setIsEditStudentModalOpen(false);
    resilientAudio.playSuccessChime();
    showToast('تم تحديث وحفظ بيانات اشتراك الطالب ودليل التخزين بنجاح!');
  };

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) return;

    const subjectMap: Record<SubjectCodeType, string> = {
      CALCULUS: 'التفاضل والتكامل',
      ALGEBRA_SOLID_GEO: 'الجبر والهندسة الفراغية',
      STATICS: 'الاستاتيكا والديناميكا',
      DYNAMICS: 'الديناميكا',
      PHYSICS: 'الفيزياء',
      CHEMISTRY: 'الكيمياء',
      ARABIC: 'اللغة العربية',
      ENGLISH: 'اللغة الإنجليزية'
    };

    const cleanFolder = `${studentConfig.defaultStorageDirectory}${newTeacherSubject}/${newTeacherName.replace(/\s+/g, '_')}/`;

    const newTeacher: TeacherPlatformEntry = {
      id: `t_${Date.now()}`,
      name: newTeacherName.trim(),
      titlePrefix: 'مستر',
      subjectCode: newTeacherSubject,
      subjectNameAr: subjectMap[newTeacherSubject],
      whatsAppNumber: newTeacherPhone.trim(),
      assistantWhatsAppNumber: newTeacherAssistant.trim() || undefined,
      platformName: newTeacherPlatform.trim() || 'منصة تعليمية معتمدة',
      groupName: newTeacherGroup.trim() || 'جروب الثانوية العامة',
      studentSubscriptionCode: newTeacherCode.trim() || `THN-${Math.floor(100 + Math.random() * 900)}`,
      lectureDays: newTeacherDays.trim() || 'أسبوعياً',
      localFolderPath: cleanFolder,
      avatarColor: 'from-cyan-600 to-blue-700',
      materialsCount: 0
    };

    setTeachers((prev) => [newTeacher, ...prev]);
    setIsAddTeacherModalOpen(false);
    resilientAudio.playSuccessChime();
    showToast(`تمت إضافة ${newTeacher.name} بنجاح وإنشاء مسار المجلد المخصص!`);

    // Reset
    setNewTeacherName('');
    setNewTeacherPhone('+2010');
    setNewTeacherAssistant('');
    setNewTeacherPlatform('');
    setNewTeacherGroup('');
    setNewTeacherCode('');
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatTitle.trim()) return;

    const teacher = teachers.find((t) => t.id === newMatTeacherId) || teachers[0];
    const cleanFileName = newMatFileName.trim() || `${newMatTitle.replace(/\s+/g, '_')}.${newMatFileType === 'video_lecture' ? 'mp4' : 'pdf'}`;
    const cleanFolderPath = `${teacher.localFolderPath}${cleanFileName}`;

    const monthNames: Record<string, string> = {
      '2026-10': 'شهر أكتوبر 2026',
      '2026-11': 'شهر نوفمبر 2026',
      '2026-12': 'شهر ديسمبر 2026',
      '2027-01': 'شهر يناير 2027',
      '2027-02': 'شهر فبراير 2027',
      '2027-03': 'شهر مارس 2027',
      '2027-04': 'شهر أبريل 2027',
      '2027-05': 'شهر مايو 2027',
      '2027-06': 'شهر يونيو 2027'
    };

    const newMaterial: DownloadedMediaMaterial = {
      id: `mat_${Date.now()}`,
      title: newMatTitle.trim(),
      teacherId: teacher.id,
      teacherName: teacher.name,
      subjectCode: teacher.subjectCode,
      subjectNameAr: teacher.subjectNameAr,
      fileType: newMatFileType,
      fileName: cleanFileName,
      fileSizeBytes: 15000000,
      fileSizeHuman: newMatSize || '15.0 MB',
      localFolderPath: cleanFolderPath,
      targetMonthKey: newMatMonth,
      targetMonthName: monthNames[newMatMonth] || newMatMonth,
      scheduledStudyDate: newMatDate || '2026-10-15',
      curriculumUnitName: newMatUnit || 'الوحدة المنهجية',
      downloadDate: new Date().toISOString().split('T')[0],
      isCompleted: false,
      notes: newMatNotes.trim() || undefined
    };

    setMaterials((prev) => [newMaterial, ...prev]);

    // Update teacher count
    setTeachers((prev) =>
      prev.map((t) => (t.id === teacher.id ? { ...t, materialsCount: t.materialsCount + 1 } : t))
    );

    setIsAddMaterialModalOpen(false);
    resilientAudio.playSuccessChime();
    showToast(`تمت فهرسة الماتريال وجدولتها ضمن ${newMaterial.targetMonthName}!`);

    // Reset
    setNewMatTitle('');
    setNewMatFileName('');
    setNewMatNotes('');
  };

  const handleToggleMaterialStatus = (id: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isCompleted: !m.isCompleted } : m))
    );
    resilientAudio.playClickSound();
  };

  const handlePushToDailyPlanner = (mat: DownloadedMediaMaterial) => {
    if (!onAddToDailySchedule) {
      showToast('تمت معاينة الحصة وإتاحة جدولتها!');
      return;
    }

    const slot: DailyScheduleSlot = {
      id: `slot_${Date.now()}`,
      timeStart: '17:00',
      timeEnd: '18:30',
      subjectCode: mat.subjectCode,
      subjectNameAr: mat.subjectNameAr,
      topic: `${mat.title} (${mat.teacherName})`,
      slotType: mat.fileType === 'pdf_sheet' ? 'practice' : 'study',
      priority: 'high',
      isCompleted: mat.isCompleted,
      notes: `مسار الملف المحلي: ${mat.localFolderPath} • مصدر الواتساب: ${mat.teacherName}`
    };

    onAddToDailySchedule(slot);
    resilientAudio.playSuccessChime();
    showToast(`تم بنجاح إدراج «${mat.title}» في المخطط والجدول اليومي!`);
  };

  // WhatsApp Helper link generator
  const getWhatsAppChatUrl = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(text);
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  };

  // Filtered materials
  const filteredMaterials = materials.filter((m) => {
    const matchesSubject = selectedSubject === 'ALL' || m.subjectCode === selectedSubject;
    const matchesType = selectedFileType === 'ALL' || m.fileType === selectedFileType;
    const matchesTeacher = selectedTeacherFilter === 'ALL' || m.teacherId === selectedTeacherFilter;
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.localFolderPath.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesType && matchesTeacher && matchesSearch;
  });

  const activeMonthData = MONTHLY_PACING_TIMELINE_DATA.find((m) => m.monthKey === selectedMonthKey) || MONTHLY_PACING_TIMELINE_DATA[0];
  const activeMonthMaterials = materials.filter((m) => m.targetMonthKey === selectedMonthKey);
  const activeMonthCompleted = activeMonthMaterials.filter((m) => m.isCompleted).length;
  const monthCompletionPercent = activeMonthMaterials.length > 0 ? Math.round((activeMonthCompleted / activeMonthMaterials.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold border border-emerald-400/40 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Top Banner & Hub Header */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-800/40 p-6 lg:p-7 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>منظومة ربط المنصات التعليمية والمدرسين عبر الواتساب والمكتبة المنظمة</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>دليل منصات الواتساب ومكتبة الحصص الشهرية</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                Smart Folder Hub
              </span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              تسجيل رقم الطالب المشترك به، أرقام المدرسين الرسمية ومساعديهم، مسارات التخزين المنظمة لكل مادة، مع فهرسة وجدولة المواد وفق خطة الدراسة الزمنية الشهرية لدفعة الثانوية العامة 2026/2027.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAddTeacherModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/30"
              title="تسجيل مدرس جديد أو منصة جديدة"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل مدرس / منصة</span>
            </button>

            <button
              onClick={() => setIsAddMaterialModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="فهرسة مذكرة أو حصة منزلة جديدة"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>فهرسة مادة جديدة</span>
            </button>

            {onOpenDocumentExport && (
              <button
                onClick={() => onOpenDocumentExport('doc_schedule_a4')}
                className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-800"
                title="تصدير الخطة والفهرس الشهري A4"
              >
                <Printer className="w-4 h-4 text-blue-400" />
                <span>تصدير الخطة A4</span>
              </button>
            )}
          </div>
        </div>

        {/* Student Active WhatsApp & Storage Directory Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">رقم الطالب المشترك بالخدمة:</div>
                <div className="font-bold text-white font-mono">{studentConfig.phoneNumber}</div>
              </div>
            </div>
            <button
              onClick={() => {
                setEditPhoneInput(studentConfig.phoneNumber);
                setEditDirInput(studentConfig.defaultStorageDirectory);
                setIsEditStudentModalOpen(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] font-semibold transition-all cursor-pointer"
            >
              تعديل الرقم
            </button>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400">دليل حفظ الوسائط الرئيسي:</div>
                <div className="font-mono text-slate-200 text-[11px] truncate" title={studentConfig.defaultStorageDirectory}>
                  {studentConfig.defaultStorageDirectory}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleCopyText('storage_root', studentConfig.defaultStorageDirectory, 'دليل الحفظ')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
              title="نسخ مسار مجلد التخزين"
            >
              {copiedId === 'storage_root' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">إجمالي الماتريال والمدرسين:</div>
                <div className="font-bold text-white">
                  <span className="text-emerald-400 font-mono">{materials.length}</span> ملفات مفهرسة • <span className="text-purple-400 font-mono">{teachers.length}</span> مدرسين
                </div>
              </div>
            </div>
            <div className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              مزامنة نشطة
            </div>
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>دليل المدرسين والمنصات ({teachers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'library'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>مكتبة الوسائط والمسارات ({materials.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('monthly_pacing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'monthly_pacing'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>الخطة الزمنية الشهرية والجدولة</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 px-3 py-1 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>مرتبط بالواتساب والجدول الدراسي تلقائياً</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TEACHERS & WHATSAPP PLATFORMS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map((teacher) => {
              const defaultMsg = `السلام عليكم ورحمة الله، أنا الطالب ${studentConfig.studentName} المشترك بكود ${teacher.studentSubscriptionCode} في مادة ${teacher.subjectNameAr}. أود الاستفسار والتأكيد على تسليم الواجب.`;
              const chatUrl = getWhatsAppChatUrl(teacher.whatsAppNumber, defaultMsg);
              const homeworkMsg = `تسليم واجب مادة ${teacher.subjectNameAr} - الطالب: ${studentConfig.studentName} (كود: ${teacher.studentSubscriptionCode}). مرفق الحل المطلوب.`;
              const homeworkUrl = getWhatsAppChatUrl(teacher.assistantWhatsAppNumber || teacher.whatsAppNumber, homeworkMsg);

              return (
                <div
                  key={teacher.id}
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-5 space-y-4 shadow-xl flex flex-col justify-between transition-all"
                >
                  <div className="space-y-3">
                    {/* Header: Avatar, Name & Subject */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${teacher.avatarColor} text-white font-bold flex items-center justify-center text-sm shadow-md`}
                        >
                          {teacher.name.split(' ').slice(1, 3).map((n) => n[0]).join('') || teacher.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-sm">{teacher.name}</h3>
                          </div>
                          <div className="text-xs text-emerald-400 font-semibold">{teacher.subjectNameAr}</div>
                        </div>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                        {teacher.studentSubscriptionCode}
                      </span>
                    </div>

                    {/* Platform & Group Details */}
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">المنصة:</span>
                        <span className="font-medium text-slate-200">{teacher.platformName}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">جروب الواتساب:</span>
                        <span className="font-medium text-emerald-300 truncate max-w-[170px]" title={teacher.groupName}>
                          {teacher.groupName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">مواعيد الحصص:</span>
                        <span className="font-medium text-amber-300">{teacher.lectureDays}</span>
                      </div>
                    </div>

                    {/* Local Folder Path Tag */}
                    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
                        <Folder className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-mono text-slate-300 truncate" title={teacher.localFolderPath}>
                          {teacher.localFolderPath}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyText(`path_${teacher.id}`, teacher.localFolderPath, 'مسار مجلد المدرس')}
                        className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
                        title="نسخ مسار المجلد على جهازك"
                      >
                        {copiedId === `path_${teacher.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>

                    {teacher.activeNotes && (
                      <p className="text-[11px] text-slate-400 bg-slate-950/50 p-2 rounded-xl border border-slate-800/60 leading-relaxed">
                        💡 {teacher.activeNotes}
                      </p>
                    )}
                  </div>

                  {/* Actions: WhatsApp Chat & Homework Delivery */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={chatUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                        title="محادثة واتساب مباشرة مع المدرس"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>محادثة واتساب</span>
                      </a>

                      <a
                        href={homeworkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
                        title="إرسال شيت الواجب وحل التدريبات للمساعدين"
                      >
                        <Send className="w-3.5 h-3.5 text-blue-400" />
                        <span>إرسال الواجب</span>
                      </a>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedTeacherFilter(teacher.id);
                        setActiveTab('library');
                        resilientAudio.playClickSound();
                      }}
                      className="w-full py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800/70 border border-slate-800 text-[11px] text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <span>عرض مذكرات وفيديوهات المدرس</span>
                      <ChevronRight className="w-3 h-3 text-emerald-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STRUCTURED DOWNLOADED MEDIA LIBRARY & LOCAL PATHS */}
      {/* ========================================================================= */}
      {activeTab === 'library' && (
        <div className="space-y-5">
          {/* Filters & Search Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search Box */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث في عنوان الحصة، اسم المدرس، أو مسار الملف..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* File Type Filter */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
                {[
                  { id: 'ALL', label: 'كافة الوسائط' },
                  { id: 'pdf_sheet', label: 'مذكرات وشيتات PDF', icon: FileText },
                  { id: 'video_lecture', label: 'فيديوهات مسجلة', icon: Video },
                  { id: 'voice_summary', label: 'كبسولات صوتية', icon: Headphones },
                  { id: 'model_answer', label: 'نماذج إجابة', icon: FileCheck2 }
                ].map((ft) => (
                  <button
                    key={ft.id}
                    onClick={() => setSelectedFileType(ft.id)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium flex items-center gap-1.5 ${
                      selectedFileType === ft.id
                        ? 'bg-emerald-600 text-white font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {ft.icon && <ft.icon className="w-3.5 h-3.5" />}
                    <span>{ft.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 shrink-0">تصفية حسب المادة:</span>
              {[
                { code: 'ALL', name: 'الكل' },
                { code: 'CALCULUS', name: 'التفاضل والتكامل' },
                { code: 'PHYSICS', name: 'الفيزياء' },
                { code: 'STATICS', name: 'الاستاتيكا والديناميكا' },
                { code: 'ALGEBRA_SOLID_GEO', name: 'الجبر والهندسة' },
                { code: 'CHEMISTRY', name: 'الكيمياء' }
              ].map((s) => (
                <button
                  key={s.code}
                  onClick={() => setSelectedSubject(s.code)}
                  className={`px-3 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
                    selectedSubject === s.code
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {s.name}
                </button>
              ))}

              {selectedTeacherFilter !== 'ALL' && (
                <button
                  onClick={() => setSelectedTeacherFilter('ALL')}
                  className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <span>إلغاء فلتر المدرس</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Materials List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMaterials.map((mat) => {
              const isPdf = mat.fileType === 'pdf_sheet' || mat.fileType === 'model_answer';
              const isVideo = mat.fileType === 'video_lecture';
              const isVoice = mat.fileType === 'voice_summary';

              return (
                <div
                  key={mat.id}
                  className={`bg-slate-900 border rounded-3xl p-5 space-y-4 shadow-xl flex flex-col justify-between transition-all ${
                    mat.isCompleted ? 'border-emerald-800/40 bg-slate-900/90' : 'border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: File icon, Title, Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                            isPdf
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : isVideo
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {isPdf && <FileText className="w-5 h-5" />}
                          {isVideo && <Video className="w-5 h-5" />}
                          {isVoice && <Headphones className="w-5 h-5" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-800 text-slate-300">
                              {mat.subjectNameAr}
                            </span>
                            <span className="text-xs text-slate-400">• {mat.teacherName}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1 leading-snug">{mat.title}</h4>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleMaterialStatus(mat.id)}
                        className={`p-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                          mat.isCompleted
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                        title={mat.isCompleted ? 'تمت دراستها بنجاح' : 'تحديد كمكتمل'}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Metadata Specs: Size, Target Month, Schedule Date */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-2.5 text-[11px] text-slate-300">
                      <div>
                        <span className="text-slate-500 block">حجم الملف:</span>
                        <span className="font-mono font-bold text-slate-200">{mat.fileSizeHuman}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">الخطة الشهرية:</span>
                        <span className="font-medium text-emerald-300 truncate block">{mat.targetMonthName.replace('شهر ', '')}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">تاريخ الجدولة:</span>
                        <span className="font-mono text-amber-300">{mat.scheduledStudyDate}</span>
                      </div>
                    </div>

                    {/* Local Storage Path Box (Core Requirement) */}
                    <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1 font-semibold">
                          <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                          <span>مسار الحفظ المحلي في جهاز الطالب:</span>
                        </span>
                        <button
                          onClick={() => handleCopyText(`file_${mat.id}`, mat.localFolderPath, 'مسار الملف')}
                          className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                          title="نسخ مسار الملف بالكامل"
                        >
                          {copiedId === `file_${mat.id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>نسخ المسار</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="font-mono text-[11px] text-slate-300 bg-slate-900/90 p-2 rounded-xl border border-slate-800/80 break-all select-all">
                        {mat.localFolderPath}
                      </div>
                    </div>

                    {mat.notes && (
                      <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 leading-relaxed">
                        📝 {mat.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions: Push to Daily Schedule, Preview */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => handlePushToDailyPlanner(mat)}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                      title="إدراج الحصة في جدول المذاكرة اليومي"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>إدراج في جدول اليوم</span>
                    </button>

                    <button
                      onClick={() => {
                        setPreviewMaterial(mat);
                        resilientAudio.playClickSound();
                      }}
                      className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      title="معاينة تفاصيل الملف والمحتوى"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                      <span>معاينة وتشغيل</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MONTHLY TIMELINE PACING & SYLLABUS DISTRIBUTION */}
      {/* ========================================================================= */}
      {activeTab === 'monthly_pacing' && (
        <div className="space-y-6">
          {/* Month Selector Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <span>الخطة الزمنية وتوزيع المنهج الوزاري شهرياً</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  فهرسة وجدولة الحصص والمذكرات لكل شهر بما يتطابق مع الخريطة الزمنية للعام الدراسي
                </p>
              </div>

              {onOpenDocumentExport && (
                <button
                  onClick={() => onOpenDocumentExport('doc_schedule_a4')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="طباعة وتصدير الخطة الشهرية A4"
                >
                  <Printer className="w-4 h-4" />
                  <span>تصدير الخطة A4</span>
                </button>
              )}
            </div>

            {/* Months Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {MONTHLY_PACING_TIMELINE_DATA.map((m) => {
                const isSelected = m.monthKey === selectedMonthKey;
                const mCount = materials.filter((mat) => mat.targetMonthKey === m.monthKey).length;

                return (
                  <button
                    key={m.monthKey}
                    onClick={() => {
                      setSelectedMonthKey(m.monthKey);
                      resilientAudio.playClickSound();
                    }}
                    className={`px-4 py-2.5 rounded-2xl transition-all cursor-pointer shrink-0 text-right space-y-0.5 ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/30 border border-emerald-400/40'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <div className="font-bold">{m.monthNameAr}</div>
                    <div className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {mCount} ماتريال مجدولة
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Month Details & Weekly Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            {/* Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeMonthData.monthNameAr}
                </span>
                <h4 className="text-lg font-bold text-white mt-2">{activeMonthData.themeTitle}</h4>
              </div>

              {/* Progress Tracker */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 min-w-[220px] text-xs space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>إنجاز مقررات الشهر:</span>
                  <span className="font-bold text-emerald-400 font-mono">{monthCompletionPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${monthCompletionPercent}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 text-left font-mono">
                  {activeMonthCompleted} من {activeMonthMaterials.length} مكتمل
                </div>
              </div>
            </div>

            {/* Weekly Syllabus Breakdown */}
            {activeMonthData.weekPlans && activeMonthData.weekPlans.length > 0 ? (
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>توزيع أسابيع الشهر ومخرجات التعلم:</span>
                </h5>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {activeMonthData.weekPlans.map((wp) => (
                    <div
                      key={wp.weekNumber}
                      className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{wp.weekTitle}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                          أسبوع {wp.weekNumber}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                        🎯 <strong>الهدف الوزاري:</strong> {wp.focusOutcome}
                      </p>

                      <div className="space-y-1.5">
                        <div className="text-[11px] text-slate-400 font-medium">مقررات المواد:</div>
                        {wp.subjectsPlan.map((sp, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-900 border border-slate-800/60"
                          >
                            <span className="font-medium text-slate-200">{sp.subjectName}: {sp.targetChapter}</span>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold">
                              {sp.requiredLectures} حصص
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Materials Scheduled For This Month */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                <span>الماتريال والوسائط المحفوظة لـ {activeMonthData.monthNameAr} ({activeMonthMaterials.length}):</span>
              </h5>

              {activeMonthMaterials.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 bg-slate-950/60 rounded-2xl border border-slate-800">
                  لا توجد ماتريال منزلة مجدولة لهذا الشهر حتى الآن. اضغط على «فهرسة مادة جديدة» لإضافتها وجدولتها.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeMonthMaterials.map((mat) => (
                    <div
                      key={mat.id}
                      className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                          {mat.fileType === 'pdf_sheet' && <FileText className="w-4 h-4 text-rose-400" />}
                          {mat.fileType === 'video_lecture' && <Video className="w-4 h-4 text-blue-400" />}
                          {mat.fileType === 'voice_summary' && <Headphones className="w-4 h-4 text-amber-400" />}
                          {mat.fileType === 'model_answer' && <FileCheck2 className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <div className="min-w-0">
                          <h6 className="font-bold text-white truncate">{mat.title}</h6>
                          <div className="text-[11px] text-slate-400">{mat.teacherName} • {mat.scheduledStudyDate}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handlePushToDailyPlanner(mat)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all cursor-pointer"
                          title="إدراج في جدول اليوم الدراسي"
                        >
                          + لجدول اليوم
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT STUDENT WHATSAPP & STORAGE CONFIG */}
      {/* ========================================================================= */}
      {isEditStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">إعدادات رقم الطالب ومجلد الحفظ</h3>
              </div>
              <button
                onClick={() => setIsEditStudentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentConfig} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-200">اسم الطالب الرباعي:</label>
                <input
                  type="text"
                  value={studentConfig.studentName}
                  onChange={(e) => setStudentConfig({ ...studentConfig, studentName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200">رقم الهاتف المشترك به في خدمة الواتساب:</label>
                <input
                  type="text"
                  value={editPhoneInput}
                  onChange={(e) => setEditPhoneInput(e.target.value)}
                  placeholder="+201012345678"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
                <p className="text-[11px] text-slate-500">يُستخدم للتواصل مع جروبات المدرسين وسيرفر المنصة المعتمد.</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200">دليل التخزين الرئيسي للوسائط المنزلة على جهازك:</label>
                <input
                  type="text"
                  value={editDirInput}
                  onChange={(e) => setEditDirInput(e.target.value)}
                  placeholder="D:/ThanaweyaAmma_2027/"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
                <p className="text-[11px] text-slate-500">يقوم التطبيق بفرز وتوزيع ملفات كل مادة ومدرس تلقائياً داخل هذا المسار.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditStudentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white font-bold bg-emerald-600 hover:bg-emerald-500 shadow-md cursor-pointer"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD NEW TEACHER / PLATFORM */}
      {/* ========================================================================= */}
      {isAddTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">تسجيل مدرس جديد أو منصة تعليمية</h3>
              </div>
              <button
                onClick={() => setIsAddTeacherModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-200">اسم المدرس:</label>
                  <input
                    type="text"
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    placeholder="مستر أحمد عصام"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-200">المادة الدراسية:</label>
                  <select
                    value={newTeacherSubject}
                    onChange={(e) => setNewTeacherSubject(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="CALCULUS">التفاضل والتكامل</option>
                    <option value="ALGEBRA_SOLID_GEO">الجبر والهندسة الفراغية</option>
                    <option value="STATICS">الاستاتيكا والديناميكا</option>
                    <option value="PHYSICS">الفيزياء</option>
                    <option value="CHEMISTRY">الكيمياء</option>
                    <option value="ARABIC">اللغة العربية</option>
                    <option value="ENGLISH">اللغة الإنجليزية</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-200">رقم واتساب المدرس:</label>
                  <input
                    type="text"
                    value={newTeacherPhone}
                    onChange={(e) => setNewTeacherPhone(e.target.value)}
                    placeholder="+2010..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-200">رقم واتساب المساعدين (للواجب):</label>
                  <input
                    type="text"
                    value={newTeacherAssistant}
                    onChange={(e) => setNewTeacherAssistant(e.target.value)}
                    placeholder="+2011... (اختياري)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-200">اسم المنصة التعليمية:</label>
                  <input
                    type="text"
                    value={newTeacherPlatform}
                    onChange={(e) => setNewTeacherPlatform(e.target.value)}
                    placeholder="مثال: منصة الأوائل"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-200">اسم جروب الواتساب:</label>
                  <input
                    type="text"
                    value={newTeacherGroup}
                    onChange={(e) => setNewTeacherGroup(e.target.value)}
                    placeholder="دفعة 2027 سوبر ثانوية"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-200">كود اشتراك الطالب:</label>
                  <input
                    type="text"
                    value={newTeacherCode}
                    onChange={(e) => setNewTeacherCode(e.target.value)}
                    placeholder="THN-CALC-842"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-200">مواعيد نزول الحصص:</label>
                  <input
                    type="text"
                    value={newTeacherDays}
                    onChange={(e) => setNewTeacherDays(e.target.value)}
                    placeholder="السبت والثلاثاء 7:00 م"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddTeacherModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white font-bold bg-emerald-600 hover:bg-emerald-500 shadow-md cursor-pointer"
                >
                  إضافة واعتماد المدرس
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD / INDEX NEW MEDIA MATERIAL */}
      {/* ========================================================================= */}
      {isAddMaterialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">فهرسة وحفظ وسائط منزلة في مسار المادة</h3>
              </div>
              <button
                onClick={() => setIsAddMaterialModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-200">عنوان الحصة أو المذكرة:</label>
                <input
                  type="text"
                  value={newMatTitle}
                  onChange={(e) => setNewMatTitle(e.target.value)}
                  placeholder="مثال: محاضرة 3: المعدلات الزمنية المرتبطة"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-200">المدرس التابع له:</label>
                  <select
                    value={newMatTeacherId}
                    onChange={(e) => setNewMatTeacherId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.subjectNameAr})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-200">نوع الملف:</label>
                  <select
                    value={newMatFileType}
                    onChange={(e) => setNewMatFileType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="pdf_sheet">مذكرة / شيت واجب PDF</option>
                    <option value="video_lecture">فيديو محاضرة مسجلة (MP4)</option>
                    <option value="voice_summary">كبسولة صوتية (Voice Note)</option>
                    <option value="model_answer">نموذج إجابة وتوزيع درجات</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-200">اسم الملف الأصلي:</label>
                  <input
                    type="text"
                    value={newMatFileName}
                    onChange={(e) => setNewMatFileName(e.target.value)}
                    placeholder="Calc_Week3_RelatedRates.pdf"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-200">الحجم المقدر:</label>
                  <input
                    type="text"
                    value={newMatSize}
                    onChange={(e) => setNewMatSize(e.target.value)}
                    placeholder="18.5 MB"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-200">الخطة الشهرية التابعة لها:</label>
                  <select
                    value={newMatMonth}
                    onChange={(e) => setNewMatMonth(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="2026-10">شهر أكتوبر 2026</option>
                    <option value="2026-11">شهر نوفمبر 2026</option>
                    <option value="2026-12">شهر ديسمبر 2026</option>
                    <option value="2027-01">شهر يناير 2027</option>
                    <option value="2027-02">شهر فبراير 2027</option>
                    <option value="2027-03">شهر مارس 2027</option>
                    <option value="2027-04">شهر أبريل 2027</option>
                    <option value="2027-05">شهر مايو 2027</option>
                    <option value="2027-06">شهر يونيو 2027</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-200">تاريخ الاستحقاق والمذاكرة:</label>
                  <input
                    type="date"
                    value={newMatDate}
                    onChange={(e) => setNewMatDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-200">ملاحظات دراسية وتنبيهات:</label>
                <textarea
                  value={newMatNotes}
                  onChange={(e) => setNewMatNotes(e.target.value)}
                  placeholder="حل مسائل التمارين الفردية ومناقشة السؤال رقم 14 المقالي..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddMaterialModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white font-bold bg-emerald-600 hover:bg-emerald-500 shadow-md cursor-pointer"
                >
                  حفظ وفهرسة الماتريال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: MATERIAL PREVIEW & MEDIA PLAYER */}
      {/* ========================================================================= */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{previewMaterial.title}</h3>
                  <div className="text-xs text-slate-400">{previewMaterial.subjectNameAr} • {previewMaterial.teacherName}</div>
                </div>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Player / Document Viewer */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
                {previewMaterial.fileType === 'video_lecture' && <Video className="w-8 h-8 text-blue-400" />}
                {previewMaterial.fileType === 'voice_summary' && <Headphones className="w-8 h-8 text-amber-400" />}
                {(previewMaterial.fileType === 'pdf_sheet' || previewMaterial.fileType === 'model_answer') && (
                  <FileText className="w-8 h-8 text-rose-400" />
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">{previewMaterial.fileName}</h4>
                <p className="text-xs text-slate-400 mt-1">حجم الملف: {previewMaterial.fileSizeHuman} • الخطة: {previewMaterial.targetMonthName}</p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-right space-y-1 font-mono">
                <span className="text-slate-500 block text-[10px]">المسار المباشر على القرص:</span>
                <span className="text-emerald-300 break-all select-all">{previewMaterial.localFolderPath}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => handleCopyText('modal_path', previewMaterial.localFolderPath, 'مسار الملف')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ المسار</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handlePushToDailyPlanner(previewMaterial);
                    setPreviewMaterial(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>إدراج في جدول اليوم</span>
                </button>
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
  RefreshCw,
  Grid,
  List,
  SlidersHorizontal,
  BookmarkCheck,
  FolderArchive,
  BarChart2,
  Tag,
  Radio,
  Bell,
  Play,
  Pause,
  Sliders,
  AlertCircle,
  Trash2,
  History,
  FileDown,
  Clock4,
  ShieldAlert,
  ListFilter,
  CheckCheck,
  ClipboardPaste,
  Zap,
  Globe
} from 'lucide-react';
import type {
  StudentWhatsAppConfig,
  TeacherPlatformEntry,
  DownloadedMediaMaterial,
  SubjectCodeType,
  MonthlyPacingTimeline,
  DownloadedFileType,
  QueuedImportItem,
  WhatsAppPollingConfig,
  WhatsAppMessageMetadata
} from '../types/whatsappEducation';
import {
  whatsAppEducationalService,
  COURSE_INDICATORS_MAP,
  CourseIndicator
} from '../services/whatsAppEducationalService';
import { whatsAppPollingService } from '../services/whatsAppPollingService';
import { nativeDesktop } from '../services/nativeDesktopBridge';
import type { DailyScheduleSlot } from '../types';
import { resilientAudio } from '../services/resilientAudioService';

interface WhatsAppEducationalHubViewProps {
  onAddToDailySchedule?: (slot: DailyScheduleSlot) => void;
  onOpenDocumentExport?: (documentId?: string) => void;
}

export const WhatsAppEducationalHubView: React.FC<WhatsAppEducationalHubViewProps> = ({
  onAddToDailySchedule,
  onOpenDocumentExport
}) => {
  // Service state
  const [studentConfig, setStudentConfig] = useState<StudentWhatsAppConfig>(() =>
    whatsAppEducationalService.getStudentConfig()
  );
  const [teachers, setTeachers] = useState<TeacherPlatformEntry[]>(() =>
    whatsAppEducationalService.getTeachers()
  );
  const [materials, setMaterials] = useState<DownloadedMediaMaterial[]>(() =>
    whatsAppEducationalService.getMaterials()
  );

  // Polling Service State
  const [pollingConfig, setPollingConfig] = useState<WhatsAppPollingConfig>(() =>
    whatsAppPollingService.getConfig()
  );
  const [importQueue, setImportQueue] = useState<QueuedImportItem[]>(() =>
    whatsAppPollingService.getQueue()
  );
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(() =>
    whatsAppPollingService.getPendingCount()
  );
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [queueFilter, setQueueFilter] = useState<'all' | 'pending' | 'imported' | 'dismissed'>('all');

  // Tabs: Teachers Directory | Auto-Organized Library | Polling Radar & Queue | Monthly Pacing
  const [activeTab, setActiveTab] = useState<'teachers' | 'library' | 'radar_queue' | 'monthly_pacing'>('teachers');

  // Library Organization View Mode: 'subject' (by course) | 'teacher' (by teacher) | 'flat' (unified grid)
  const [libraryGroupBy, setLibraryGroupBy] = useState<'subject' | 'teacher' | 'flat'>('subject');

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
  const [isManualInspectModalOpen, setIsManualInspectModalOpen] = useState(false);
  const [isPollingSettingsModalOpen, setIsPollingSettingsModalOpen] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<DownloadedMediaMaterial | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Manual message inspector input
  const [manualInspectText, setManualInspectText] = useState('');
  const [manualInspectPhone, setManualInspectPhone] = useState('+201023456789');

  // Form states for modals
  const [editPhoneInput, setEditPhoneInput] = useState(studentConfig.phoneNumber);
  const [editStudentNameInput, setEditStudentNameInput] = useState(studentConfig.studentName);
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
  const [newMatTeacherId, setNewMatTeacherId] = useState(teachers[0]?.id || '');
  const [newMatFileType, setNewMatFileType] = useState<DownloadedFileType>('pdf_sheet');
  const [newMatFileName, setNewMatFileName] = useState('');
  const [newMatSize, setNewMatSize] = useState('14.2 MB');
  const [newMatMonth, setNewMatMonth] = useState('2026-10');
  const [newMatDate, setNewMatDate] = useState('2026-10-15');
  const [newMatUnit, setNewMatUnit] = useState('الوحدة الأولى');
  const [newMatNotes, setNewMatNotes] = useState('');

  // Sync service changes reactively
  useEffect(() => {
    const unsubEducational = whatsAppEducationalService.subscribe(() => {
      setStudentConfig(whatsAppEducationalService.getStudentConfig());
      setTeachers(whatsAppEducationalService.getTeachers());
      setMaterials(whatsAppEducationalService.getMaterials());
    });

    const unsubPolling = whatsAppPollingService.subscribe(() => {
      setPollingConfig(whatsAppPollingService.getConfig());
      setImportQueue(whatsAppPollingService.getQueue());
      setPendingQueueCount(whatsAppPollingService.getPendingCount());
    });

    return () => {
      unsubEducational();
      unsubPolling();
    };
  }, []);

  const showToast = (message: string) => {
    setToastNotice(message);
    setTimeout(() => setToastNotice(null), 4000);
  };

  const handleCopyText = (id: string, text: string, label = 'المسار') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    resilientAudio.playClickSound();
    showToast(`تم نسخ ${label} إلى الحافظة بنجاح!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSaveStudentConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const result = whatsAppEducationalService.registerStudentNumber(
      editPhoneInput.trim(),
      editStudentNameInput.trim(),
      editDirInput.trim()
    );
    setIsEditStudentModalOpen(false);
    resilientAudio.playSuccessChime();
    showToast(result.message);
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

    const added = whatsAppEducationalService.addTeacher({
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
      avatarColor: 'from-blue-600 to-indigo-700'
    });

    setIsAddTeacherModalOpen(false);
    resilientAudio.playSuccessChime();
    showToast(`تمت إضافة ${added.name} بنجاح وإنشاء مسار المجلد المخصص!`);

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
    const cleanFileName =
      newMatFileName.trim() ||
      `${newMatTitle.replace(/\s+/g, '_')}.${newMatFileType === 'video_lecture' ? 'mp4' : 'pdf'}`;
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

    const added = whatsAppEducationalService.addMaterial({
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
    });

    setIsAddMaterialModalOpen(false);
    resilientAudio.playSuccessChime();
    showToast(`تمت فهرسة الماتريال وجدولتها ضمن ${added.targetMonthName}!`);

    // Reset
    setNewMatTitle('');
    setNewMatFileName('');
    setNewMatNotes('');
  };

  const handleToggleMaterialStatus = (id: string) => {
    const updated = whatsAppEducationalService.toggleMaterialCompleted(id);
    if (updated) {
      if (updated.isCompleted) {
        resilientAudio.playSuccessChime();
        showToast(`🎉 ممتاز! تم إنجاز: "${updated.title}"`);
      } else {
        resilientAudio.playClickSound();
        showToast(`تمت إعادة جدولة: "${updated.title}" كمادة قيد الاستذكار.`);
      }
    }
  };

  const handleSyncChannels = async (teacherId?: string) => {
    setIsSyncing(true);
    resilientAudio.playClickSound();
    try {
      const result = await whatsAppEducationalService.simulateSyncChannel(teacherId);
      resilientAudio.playSuccessChime();
      showToast(result.message);
    } catch {
      showToast('تعذر إكمال المزامنة الآن.');
    } finally {
      setIsSyncing(false);
    }
  };

  // --- WhatsApp Polling Engine Handlers ---

  const handleTriggerPollScan = async () => {
    setIsScanning(true);
    resilientAudio.playClickSound();
    try {
      const res = await whatsAppPollingService.triggerPollNow();
      resilientAudio.playSuccessChime();
      showToast(`تم فحص محادثات واتساب ويب بنجاح، واكتشاف ${res.detectedCount} روابط جديدة وإدراجها بقائمة الانتظار.`);
    } catch {
      showToast('تعذر إتمام الفحص الفوري الآن.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSimulateIncomingMessage = (teacherId?: string) => {
    resilientAudio.playClickSound();
    const queued = whatsAppPollingService.simulateIncomingTeacherMessage(teacherId);
    showToast(`🔔 رسالة جديدة مكتشفة من ${queued.message.senderName}: "${queued.message.extractedTitle}"`);
  };

  const handleImportQueuedItem = (queueId: string) => {
    const imported = whatsAppPollingService.importItem(queueId);
    if (imported) {
      showToast(`✅ تم استيراد "${imported.title}" وإضافتها لمكتبة المادة بنجاح!`);
    }
  };

  const handleImportAllPending = () => {
    const count = whatsAppPollingService.importAllPending();
    if (count > 0) {
      showToast(`🚀 تم استيراد كافة الروابط (${count} عناصر) تلقائياً إلى المكتبة!`);
    } else {
      showToast('لا توجد عناصر معلقة للاستيراد حالياً.');
    }
  };

  const handleDismissQueuedItem = (queueId: string) => {
    whatsAppPollingService.dismissItem(queueId);
    showToast('تم تجاهل العنصر من قائمة المراجعة.');
  };

  const handleManualInspectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInspectText.trim()) return;

    const queued = whatsAppPollingService.inspectAndQueueMessage({
      senderPhone: manualInspectPhone.trim(),
      rawText: manualInspectText.trim()
    });

    if (queued) {
      setIsManualInspectModalOpen(false);
      setManualInspectText('');
      showToast(`تم التعرف على الرابط وفهرسته بقائمة الانتظار: "${queued.message.extractedTitle}"`);
    } else {
      showToast('لم يتم العثور على رابط مباشر صالح داخل نص الرسالة.');
    }
  };

  const handlePushToDailyPlanner = (mat: DownloadedMediaMaterial) => {
    if (onAddToDailySchedule) {
      const slot: DailyScheduleSlot = {
        id: `slot_wa_${Date.now()}`,
        timeStart: '19:00',
        timeEnd: '21:00',
        subjectCode: mat.subjectCode,
        subjectNameAr: mat.subjectNameAr,
        topic: mat.title,
        slotType: mat.fileType === 'pdf_sheet' ? 'practice' : 'study',
        priority: 'high',
        isCompleted: false,
        notes: `ملف واتساب محلي: ${mat.fileName} (${mat.teacherName}) - مسار: ${mat.localFolderPath}`
      };
      onAddToDailySchedule(slot);
      resilientAudio.playSuccessChime();
      showToast(`تمت إضافة "${mat.title}" إلى جدول المذاكرة اليومي بنجاح!`);
    } else {
      showToast('تم حفظ الحصة في قائمة الانتظار لجدولك الدراسي.');
    }
  };

  // Filtered materials for library
  const filteredMaterials = materials.filter((m) => {
    const matchesSubject = selectedSubject === 'ALL' || m.subjectCode === selectedSubject;
    const matchesType = selectedFileType === 'ALL' || m.fileType === selectedFileType;
    const matchesTeacher = selectedTeacherFilter === 'ALL' || m.teacherId === selectedTeacherFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subjectNameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.localFolderPath.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesType && matchesTeacher && matchesSearch;
  });

  // Filtered queue items for radar queue tab
  const filteredQueueItems = importQueue.filter((item) => {
    if (queueFilter === 'all') return true;
    return item.status === queueFilter;
  });

  // Monthly pacing data
  const monthlyTimeline = whatsAppEducationalService.getMonthlyPacingData();
  const activeMonthData =
    monthlyTimeline.find((m) => m.monthKey === selectedMonthKey) || monthlyTimeline[0];
  const activeMonthMaterials = materials.filter((m) => m.targetMonthKey === selectedMonthKey);
  const activeMonthCompleted = activeMonthMaterials.filter((m) => m.isCompleted).length;
  const monthCompletionPercent =
    activeMonthMaterials.length > 0
      ? Math.round((activeMonthCompleted / activeMonthMaterials.length) * 100)
      : 0;

  // Auto-organized groups
  const subjectGroups = whatsAppEducationalService.autoOrganizeLibrary('subject');
  const teacherGroups = whatsAppEducationalService.autoOrganizeLibrary('teacher');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border border-emerald-400/30 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Top Banner & Hub Header - Windows Light Theme UI */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 lg:p-7 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>منظومة ربط منصات الواتساب التعليمية</span>
              </span>

              {/* Automated Polling Live Status Badge */}
              <button
                onClick={() => setActiveTab('radar_queue')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                  pollingConfig.isEnabled
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
                title="انقر لفتح شاشة رادار الكشف وقائمة الانتظار"
              >
                <Radio className={`w-3.5 h-3.5 ${pollingConfig.isEnabled ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
                <span>رادار واتساب ويب: {pollingConfig.isEnabled ? `نشط (فحص كل ${pollingConfig.intervalSeconds}ث)` : 'متوقف'}</span>
                {pendingQueueCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono">
                    {pendingQueueCount} جديد
                  </span>
                )}
              </button>
            </div>

            <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>دليل منصات الواتساب ورادار الاستيراد التلقائي</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-mono font-bold">
                Live Polling Engine
              </span>
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              فحص دوري لرسائل واتساب ويب لاكتشاف روابط شيتات الـ PDF وفيديوهات الحصص تلقائياً، وإدراجها في قائمة انتظار ذكية لتأكيد الحفظ في مسار جهاز الطالب المخصص لكل مادة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Trigger Scan Button */}
            <button
              onClick={handleTriggerPollScan}
              disabled={isScanning}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs shadow-blue-600/20"
              title="فحص رسائل واتساب ويب فورياً لاكتشاف الروابط الجديدة"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'جارٍ فحص الرسائل...' : 'افحص الرسائل الآن'}</span>
            </button>

            {/* Simulate Incoming Message Button */}
            <button
              onClick={() => handleSimulateIncomingMessage()}
              className="bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="محاكاة وصول رابط شيت أو فيديو جديد من المدرسين لاختبار الكشف الآلي"
            >
              <Zap className="w-4 h-4 text-violet-600" />
              <span>محاكاة وصول رابط</span>
            </button>

            {pendingQueueCount > 0 && (
              <button
                onClick={handleImportAllPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="استيراد كافة الروابط المعلقة في قائمة الانتظار دفعة واحدة"
              >
                <CheckCheck className="w-4 h-4" />
                <span>استيراد المعلق ({pendingQueueCount})</span>
              </button>
            )}

            <button
              onClick={() => setIsAddTeacherModalOpen(true)}
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="تسجيل مدرس جديد أو منصة جديدة"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>تسجيل مدرس</span>
            </button>
          </div>
        </div>

        {/* Student Active WhatsApp & Storage Directory Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500">رقم الطالب المشترك بالخدمة:</div>
                <div className="font-bold text-slate-900 font-mono text-sm">{studentConfig.phoneNumber}</div>
              </div>
            </div>
            <button
              onClick={() => {
                setEditPhoneInput(studentConfig.phoneNumber);
                setEditStudentNameInput(studentConfig.studentName);
                setEditDirInput(studentConfig.defaultStorageDirectory);
                setIsEditStudentModalOpen(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-emerald-700 text-[11px] font-bold transition-all cursor-pointer shadow-xs"
            >
              تعديل الرقم
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-500">دليل حفظ الوسائط الرئيسي:</div>
                <div className="font-mono text-slate-800 text-[11px] truncate font-semibold" title={studentConfig.defaultStorageDirectory}>
                  {studentConfig.defaultStorageDirectory}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {nativeDesktop.isNativeDesktop && (
                <button
                  onClick={() => {
                    nativeDesktop.openFolderInExplorer(studentConfig.defaultStorageDirectory);
                    showToast('تم فتح مجلد التخزين في مستكشف ملفات ويندوز (Explorer)');
                  }}
                  className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 transition-all cursor-pointer shrink-0 shadow-xs"
                  title="فتح المجلد في مستكشف ويندوز (Windows File Explorer)"
                >
                  <Folder className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => handleCopyText('storage_root', studentConfig.defaultStorageDirectory, 'دليل الحفظ')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shrink-0 shadow-xs"
                title="نسخ مسار مجلد التخزين"
              >
                {copiedId === 'storage_root' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500">إحصاءات كشف الرادار:</div>
                <div className="font-bold text-slate-900">
                  <span className="text-blue-600 font-mono">{pollingConfig.totalDetectedCount}</span> روابط مكتشفة • <span className="text-violet-600 font-mono">{pollingConfig.totalPolledCount}</span> دورات فحص
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('radar_queue')}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold hover:bg-blue-100 transition-colors cursor-pointer"
            >
              عرض الطابور
            </button>
          </div>
        </div>
      </div>

      {/* Main Nav Tabs - Clean Windows Light segmented control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>دليل المدرسين والمنصات ({teachers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'library'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>المكتبة المنظمة تلقائياً ({materials.length})</span>
          </button>

          {/* TAB 3: POLLING RADAR & IMPORT QUEUE */}
          <button
            onClick={() => setActiveTab('radar_queue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'radar_queue'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>رادار الكشف وقائمة الانتظار</span>
            {pendingQueueCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white">
                {pendingQueueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('monthly_pacing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'monthly_pacing'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>الخطة الزمنية والجدولة</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 px-3 py-1 flex items-center gap-2 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>كشف آلي للميتاداتا وروابط الـ PDF والفيديوهات</span>
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
              const chatUrl = whatsAppEducationalService.getWhatsAppChatUrl(teacher.whatsAppNumber, defaultMsg);
              const homeworkMsg = `تسليم واجب مادة ${teacher.subjectNameAr} - الطالب: ${studentConfig.studentName} (كود: ${teacher.studentSubscriptionCode}). مرفق الحل المطلوب.`;
              const homeworkUrl = whatsAppEducationalService.getWhatsAppChatUrl(
                teacher.assistantWhatsAppNumber || teacher.whatsAppNumber,
                homeworkMsg
              );
              const indicator = COURSE_INDICATORS_MAP[teacher.subjectCode];

              return (
                <div
                  key={teacher.id}
                  className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 space-y-4 shadow-xs flex flex-col justify-between transition-all"
                >
                  <div className="space-y-3">
                    {/* Header: Avatar, Name & Subject */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${teacher.avatarColor} text-white font-bold flex items-center justify-center text-sm shadow-xs`}
                        >
                          {teacher.name.split(' ').slice(1, 3).map((n) => n[0]).join('') || teacher.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm">{teacher.name}</h3>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-blue-700 font-bold">{teacher.subjectNameAr}</span>
                            {indicator && (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${indicator.badgeBg} ${indicator.badgeText}`}>
                                {indicator.shortCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">
                        {teacher.studentSubscriptionCode}
                      </span>
                    </div>

                    {/* Platform & Group Details */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-500">المنصة:</span>
                        <span className="font-semibold text-slate-800">{teacher.platformName}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-500">جروب الواتساب:</span>
                        <span className="font-semibold text-emerald-700 truncate max-w-[170px]" title={teacher.groupName}>
                          {teacher.groupName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-500">مواعيد الحصص:</span>
                        <span className="font-medium text-amber-700">{teacher.lectureDays}</span>
                      </div>
                    </div>

                    {/* Local Folder Path Tag */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-600 min-w-0">
                        <Folder className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="font-mono text-slate-700 truncate" title={teacher.localFolderPath}>
                          {teacher.localFolderPath}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyText(`path_${teacher.id}`, teacher.localFolderPath, 'مسار مجلد المدرس')}
                        className="p-1 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shrink-0 shadow-xs"
                        title="نسخ مسار المجلد على جهازك"
                      >
                        {copiedId === `path_${teacher.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>

                    {teacher.activeNotes && (
                      <p className="text-[11px] text-slate-600 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80 leading-relaxed">
                        💡 {teacher.activeNotes}
                      </p>
                    )}
                  </div>

                  {/* Actions: WhatsApp Chat & Homework Delivery & Simulate */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={chatUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                        title="محادثة واتساب مباشرة مع المدرس"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>محادثة واتساب</span>
                      </a>

                      <a
                        href={homeworkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold transition-all shadow-xs"
                        title="إرسال شيت الواجب وحل التدريبات للمساعدين"
                      >
                        <Send className="w-3.5 h-3.5 text-blue-600" />
                        <span>إرسال الواجب</span>
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setSelectedTeacherFilter(teacher.id);
                          setActiveTab('library');
                          setLibraryGroupBy('flat');
                          resilientAudio.playClickSound();
                        }}
                        className="py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <span>الوسائط ({teacher.materialsCount || 0})</span>
                        <ChevronRight className="w-3 h-3 text-blue-600" />
                      </button>

                      <button
                        onClick={() => handleSimulateIncomingMessage(teacher.id)}
                        className="py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-[11px] font-bold text-violet-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
                        title="محاكاة إرسال رابط شيت جديد من هذا المدرس تحديداً"
                      >
                        <Zap className="w-3 h-3 text-violet-600" />
                        <span>محاكاة إرسال رابط</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AUTO-ORGANIZING LIBRARY GRID & COURSE INDICATORS */}
      {/* ========================================================================= */}
      {activeTab === 'library' && (
        <div className="space-y-5">
          {/* Storage & Organization Dashboard Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
            {/* Top row: Search, Filter, and Organization Mode Switcher */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  id="contextual-search-input"
                  data-search-input="true"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث في عنوان الحصة، اسم المدرس، أو مسار الملف (Ctrl+F)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>

              {/* View / Grouping Mode Selector */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs self-start lg:self-auto">
                <span className="text-slate-500 px-2 font-medium flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>طريقة التنظيم:</span>
                </span>
                <button
                  onClick={() => {
                    setLibraryGroupBy('subject');
                    resilientAudio.playClickSound();
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
                    libraryGroupBy === 'subject'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="تنظيم تلقائي مصنف حسب المادة الدراسية"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>حسب المادة الدراسية</span>
                </button>

                <button
                  onClick={() => {
                    setLibraryGroupBy('teacher');
                    resilientAudio.playClickSound();
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
                    libraryGroupBy === 'teacher'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="تنظيم تلقائي مصنف حسب المدرس والمنصة"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>حسب المدرس والمنصة</span>
                </button>

                <button
                  onClick={() => {
                    setLibraryGroupBy('flat');
                    resilientAudio.playClickSound();
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
                    libraryGroupBy === 'flat'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="عرض شبكي موحد لكافة الملفات"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>شبكة موحدة</span>
                </button>
              </div>

              {/* File Type Filter */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                {[
                  { id: 'ALL', label: 'الكل' },
                  { id: 'pdf_sheet', label: 'PDF', icon: FileText },
                  { id: 'video_lecture', label: 'فيديو', icon: Video },
                  { id: 'voice_summary', label: 'صوتي', icon: Headphones },
                  { id: 'model_answer', label: 'إجابة', icon: FileCheck2 }
                ].map((ft) => (
                  <button
                    key={ft.id}
                    onClick={() => setSelectedFileType(ft.id)}
                    className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1 ${
                      selectedFileType === ft.id
                        ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {ft.icon && <ft.icon className="w-3 h-3" />}
                    <span>{ft.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Indicator Chips & Quick Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs pt-1 border-t border-slate-100">
              <span className="text-slate-500 shrink-0 font-medium">مؤشرات الكورسات:</span>
              {[
                { code: 'ALL', name: 'كافة المواد' },
                { code: 'CALCULUS', name: 'التفاضل والتكامل' },
                { code: 'PHYSICS', name: 'الفيزياء' },
                { code: 'STATICS', name: 'الاستاتيكا والديناميكا' },
                { code: 'ALGEBRA_SOLID_GEO', name: 'الجبر والهندسة' },
                { code: 'CHEMISTRY', name: 'الكيمياء' }
              ].map((s) => {
                const indicator = s.code !== 'ALL' ? COURSE_INDICATORS_MAP[s.code as SubjectCodeType] : null;
                const isSelected = selectedSubject === s.code;

                return (
                  <button
                    key={s.code}
                    onClick={() => setSelectedSubject(s.code)}
                    className={`px-3 py-1 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 font-bold ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {indicator && !isSelected && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${indicator.badgeBg} ${indicator.badgeText}`}>
                        {indicator.shortCode}
                      </span>
                    )}
                    <span>{s.name}</span>
                  </button>
                );
              })}

              {selectedTeacherFilter !== 'ALL' && (
                <button
                  onClick={() => setSelectedTeacherFilter('ALL')}
                  className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <span>إلغاء فلتر المدرس</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* MODE 1: AUTO-ORGANIZED BY COURSE / SUBJECT */}
          {libraryGroupBy === 'subject' && (
            <div className="space-y-6">
              {Object.values(subjectGroups)
                .filter(
                  (grp) =>
                    (selectedSubject === 'ALL' || grp.key === selectedSubject) &&
                    grp.items.some((item) => filteredMaterials.some((fm) => fm.id === item.id))
                )
                .map((grp) => {
                  const grpFilteredItems = grp.items.filter((item) =>
                    filteredMaterials.some((fm) => fm.id === item.id)
                  );
                  if (grpFilteredItems.length === 0) return null;

                  const indicator = grp.indicator;

                  return (
                    <div
                      key={grp.key}
                      className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs"
                    >
                      {/* Course Header Banner */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl ${indicator?.accentBg || 'bg-blue-600'} text-white font-bold flex items-center justify-center text-sm shadow-xs`}
                          >
                            <BookmarkCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-base">{grp.title}</h3>
                              {indicator && (
                                <span className={`text-xs px-2 py-0.5 rounded-md font-mono font-bold ${indicator.badgeBg} ${indicator.badgeText} border ${indicator.borderClass}`}>
                                  {indicator.shortCode}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
                              <span>مسار الحفظ:</span>
                              <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                {grp.folderPath}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold border border-slate-200">
                            {grpFilteredItems.length} ملفات ({grp.totalSizeHuman})
                          </span>
                        </div>
                      </div>

                      {/* Sub-grid of materials in this subject */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {grpFilteredItems.map((mat) => (
                          <MaterialCardItem
                            key={mat.id}
                            material={mat}
                            onToggleStatus={handleToggleMaterialStatus}
                            onPushSchedule={handlePushToDailyPlanner}
                            onPreview={setPreviewMaterial}
                            onCopyText={handleCopyText}
                            copiedId={copiedId}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* MODE 2: AUTO-ORGANIZED BY TEACHER */}
          {libraryGroupBy === 'teacher' && (
            <div className="space-y-6">
              {Object.values(teacherGroups)
                .filter(
                  (grp) =>
                    (selectedTeacherFilter === 'ALL' || grp.key === selectedTeacherFilter) &&
                    grp.items.some((item) => filteredMaterials.some((fm) => fm.id === item.id))
                )
                .map((grp) => {
                  const grpFilteredItems = grp.items.filter((item) =>
                    filteredMaterials.some((fm) => fm.id === item.id)
                  );
                  if (grpFilteredItems.length === 0) return null;

                  return (
                    <div
                      key={grp.key}
                      className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs"
                    >
                      {/* Teacher Header Banner */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grp.avatarColor || 'from-blue-600 to-indigo-700'} text-white font-bold flex items-center justify-center text-sm shadow-xs`}
                          >
                            {grp.title.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-base">{grp.title}</h3>
                              {grp.indicator && (
                                <span className={`text-xs px-2 py-0.5 rounded-md font-mono font-bold ${grp.indicator.badgeBg} ${grp.indicator.badgeText}`}>
                                  {grp.indicator.shortCode}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 font-medium">{grp.subtitle}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold border border-slate-200">
                            {grpFilteredItems.length} ملفات ({grp.totalSizeHuman})
                          </span>
                        </div>
                      </div>

                      {/* Sub-grid of materials for this teacher */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {grpFilteredItems.map((mat) => (
                          <MaterialCardItem
                            key={mat.id}
                            material={mat}
                            onToggleStatus={handleToggleMaterialStatus}
                            onPushSchedule={handlePushToDailyPlanner}
                            onPreview={setPreviewMaterial}
                            onCopyText={handleCopyText}
                            copiedId={copiedId}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* MODE 3: FLAT UNIFIED GRID */}
          {libraryGroupBy === 'flat' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMaterials.map((mat) => (
                <MaterialCardItem
                  key={mat.id}
                  material={mat}
                  onToggleStatus={handleToggleMaterialStatus}
                  onPushSchedule={handlePushToDailyPlanner}
                  onPreview={setPreviewMaterial}
                  onCopyText={handleCopyText}
                  copiedId={copiedId}
                />
              ))}
            </div>
          )}

          {filteredMaterials.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
              <FolderArchive className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">لا توجد وسائط تطابق معايير البحث</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                جرب تغيير خيارات الفلترة أو استخدام كلمة بحث مختلفة للوصول إلى مذكراتك وفيديوهاتك.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSubject('ALL');
                  setSelectedFileType('ALL');
                  setSelectedTeacherFilter('ALL');
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer hover:bg-blue-700"
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WHATSAPP WEB METADATA POLLING RADAR & IMPORT QUEUE */}
      {/* ========================================================================= */}
      {activeTab === 'radar_queue' && (
        <div className="space-y-6">
          {/* Radar Control & Status Dashboard */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Radio className={`w-6 h-6 ${pollingConfig.isEnabled ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">رادار فحص واتساب ويب واكتشاف الروابط التعليمية</h3>
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                        pollingConfig.isEnabled
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {pollingConfig.isEnabled ? 'المراقبة الآلية نشطة' : 'المراقبة متوقفة'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    يفحص الميتاداتا دورياً كل <span className="font-bold text-blue-600 font-mono">{pollingConfig.intervalSeconds} ثانية</span> لكشف ملفات PDF والفيديوهات والروابط المشتركة.
                  </p>
                </div>
              </div>

              {/* Engine Action Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleTriggerPollScan}
                  disabled={isScanning}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="إجراء فحص يدوي فوري لمحادثات واتساب ويب"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'جارٍ الفحص...' : 'فحص فوري'}</span>
                </button>

                <button
                  onClick={() => handleSimulateIncomingMessage()}
                  className="bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="محاكاة وصول رابط شيت أو فيديو جديد من المدرسين"
                >
                  <Zap className="w-3.5 h-3.5 text-violet-600" />
                  <span>محاكاة وصول رابط</span>
                </button>

                <button
                  onClick={() => setIsManualInspectModalOpen(true)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="لصق نص رسالة من واتساب ويب لتحليلها واستخراج الروابط فورياً"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-blue-600" />
                  <span>تحليل رسالة يدوياً</span>
                </button>

                <button
                  onClick={() => setIsPollingSettingsModalOpen(true)}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
                  title="إعدادات الرادار والفحص الدوري"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-slate-500 block text-[11px]">إجمالي دورات الفحص:</span>
                <span className="text-lg font-bold text-slate-900 font-mono">{pollingConfig.totalPolledCount}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">كل {pollingConfig.intervalSeconds} ثانية</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-slate-500 block text-[11px]">الروابط المكتشفة:</span>
                <span className="text-lg font-bold text-blue-600 font-mono">{pollingConfig.totalDetectedCount}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">PDF وفيديوهات وكبسولات</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-slate-500 block text-[11px]">بانتظار الاستيراد:</span>
                <span className="text-lg font-bold text-amber-600 font-mono">{pendingQueueCount}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">تتطلب المراجعة والتأكيد</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-slate-500 block text-[11px]">نمط الاستيراد المباشر:</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`font-bold ${
                      pollingConfig.autoImportWithoutPrompt ? 'text-emerald-700' : 'text-slate-700'
                    }`}
                  >
                    {pollingConfig.autoImportWithoutPrompt ? 'استيراد تلقائي فوري' : 'مراجعة قبل الاستيراد'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    whatsAppPollingService.updateConfig({
                      autoImportWithoutPrompt: !pollingConfig.autoImportWithoutPrompt
                    });
                    resilientAudio.playClickSound();
                    showToast(
                      !pollingConfig.autoImportWithoutPrompt
                        ? 'تم تفعيل الاستيراد الفوري: أي رابط مكتشف سيُضاف للمكتبة تلقائياً!'
                        : 'تم إيقاف الاستيراد الفوري: الروابط ستنتظر مراجعتك في الطابور.'
                    );
                  }}
                  className="text-[10px] text-blue-600 hover:underline font-bold mt-1 block cursor-pointer"
                >
                  تبديل النمط
                </button>
              </div>
            </div>

            {/* Filter pills & Batch Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                {[
                  { id: 'all', label: `الكل (${importQueue.length})` },
                  { id: 'pending', label: `في الانتظار (${pendingQueueCount})` },
                  { id: 'imported', label: `تم استيرادها (${importQueue.filter((q) => q.status === 'imported').length})` },
                  { id: 'dismissed', label: `تم تجاهلها (${importQueue.filter((q) => q.status === 'dismissed').length})` }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setQueueFilter(f.id as any);
                      resilientAudio.playClickSound();
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                      queueFilter === f.id
                        ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {pendingQueueCount > 0 && (
                <button
                  onClick={handleImportAllPending}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs self-start sm:self-auto"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>استيراد كافة الروابط المعلقة ({pendingQueueCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* Import Queue Cards List */}
          <div className="space-y-4">
            {filteredQueueItems.map((item) => {
              const meta = item.message;
              const isPending = item.status === 'pending';
              const isImported = item.status === 'imported';
              const isDismissed = item.status === 'dismissed';
              const indicator = COURSE_INDICATORS_MAP[meta.matchedSubjectCode];

              return (
                <div
                  key={item.id}
                  className={`bg-white border rounded-2xl p-5 space-y-4 shadow-xs transition-all ${
                    isPending
                      ? 'border-blue-300 ring-2 ring-blue-500/10'
                      : isImported
                      ? 'border-emerald-200 bg-emerald-50/10'
                      : 'border-slate-200 opacity-70'
                  }`}
                >
                  {/* Top: Status Pill, Teacher Details, Detected Timestamp */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                        {meta.detectedFileType === 'video_lecture' && <Video className="w-5 h-5 text-blue-600" />}
                        {meta.detectedFileType === 'voice_summary' && <Headphones className="w-5 h-5 text-amber-600" />}
                        {(meta.detectedFileType === 'pdf_sheet' || meta.detectedFileType === 'model_answer' || meta.detectedFileType === 'exam_file') && (
                          <FileText className="w-5 h-5 text-rose-600" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{meta.matchedTeacherName}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-blue-700 font-bold">{meta.matchedSubjectNameAr}</span>
                          {indicator && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${indicator.badgeBg} ${indicator.badgeText}`}>
                              {indicator.shortCode}
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            جروب: {meta.chatGroupName}
                          </span>
                        </div>

                        <h4 className="text-base font-extrabold text-slate-900 mt-1 leading-snug">
                          {meta.extractedTitle}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start">
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{meta.timestamp}</span>
                      </span>

                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                          isPending
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : isImported
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isPending ? 'بانتظار الاستيراد' : isImported ? 'تم الاستيراد بنجاح' : 'تم التجاهل'}
                      </span>
                    </div>
                  </div>

                  {/* Message Quote & Detected URL preview */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                    <div className="text-slate-600 leading-relaxed font-medium">
                      💬 <span className="font-semibold text-slate-800">نص الرسالة الملتقطة:</span> "{meta.rawMessageText}"
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] px-2 py-0.5 rounded-md font-mono font-bold bg-blue-100 text-blue-700 shrink-0">
                          {meta.detectedUrlType.toUpperCase()}
                        </span>
                        <a
                          href={meta.detectedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-blue-600 hover:underline truncate max-w-md block"
                          title={meta.detectedUrl}
                        >
                          {meta.detectedUrl}
                        </a>
                      </div>

                      <button
                        onClick={() => handleCopyText(`link_${item.id}`, meta.detectedUrl, 'الرابط')}
                        className="p-1 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                      >
                        {copiedId === `link_${item.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>نسخ الرابط</span>
                      </button>
                    </div>
                  </div>

                  {/* Destination Specs Box */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">اسم الملف والنوع:</span>
                      <span className="font-mono font-bold text-slate-800 truncate block" title={meta.suggestedFileName}>
                        {meta.suggestedFileName} ({meta.fileSizeHuman})
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">الخطة والشهر المخصص:</span>
                      <span className="font-bold text-blue-700">{meta.targetMonthName}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">مسار الحفظ المقترح:</span>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] text-slate-700 truncate" title={meta.suggestedLocalPath}>
                          {meta.suggestedLocalPath}
                        </span>
                        <button
                          onClick={() => handleCopyText(`path_${item.id}`, meta.suggestedLocalPath, 'مسار الحفظ')}
                          className="text-blue-600 hover:text-blue-800 shrink-0 cursor-pointer"
                          title="نسخ المسار"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <button
                          onClick={() => handleImportQueuedItem(item.id)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                          <Check className="w-4 h-4" />
                          <span>استيراد إلى المكتبة وتخصيص المسار</span>
                        </button>
                      )}

                      {isPending && (
                        <button
                          onClick={() => handleDismissQueuedItem(item.id)}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 text-slate-500" />
                          <span>تجاهل هذا الرابط</span>
                        </button>
                      )}

                      {isImported && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                            <CheckCheck className="w-4 h-4 text-emerald-600" />
                            <span>تم حفظ وفهرسة المادة في المكتبة</span>
                          </span>

                          <button
                            onClick={() => {
                              setActiveTab('library');
                              setSearchQuery(meta.extractedTitle);
                              resilientAudio.playClickSound();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold cursor-pointer"
                          >
                            عرض في المكتبة
                          </button>
                        </div>
                      )}

                      {isDismissed && (
                        <button
                          onClick={() => handleImportQueuedItem(item.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                        >
                          إلغاء التجاهل واستيراد
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        whatsAppPollingService.removeQueueItem(item.id);
                        resilientAudio.playClickSound();
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                      title="حذف من السجل نهائياً"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredQueueItems.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
                <Radio className="w-12 h-12 text-blue-400 mx-auto" />
                <h4 className="text-base font-bold text-slate-800">طابور الاستيراد خالٍ حالياً</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  رادار الفحص نشط في الخلفية لمراقبة واتساب ويب. عند مشاركة أي مدرس لرابط شيت أو فيديو جديد، سيظهر تلقائياً هنا!
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleSimulateIncomingMessage()}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer hover:bg-blue-700 shadow-xs"
                  >
                    محاكاة وصول رسالة لاختبار الرادار
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MONTHLY TIMELINE PACING & SYLLABUS DISTRIBUTION */}
      {/* ========================================================================= */}
      {activeTab === 'monthly_pacing' && (
        <div className="space-y-6">
          {/* Month Selector Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>الخطة الزمنية وتوزيع المنهج الوزاري شهرياً</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  فهرسة وجدولة الحصص والمذكرات لكل شهر بما يتطابق مع الخريطة الزمنية للعام الدراسي
                </p>
              </div>

              {onOpenDocumentExport && (
                <button
                  onClick={() => onOpenDocumentExport('doc_schedule_a4')}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="طباعة وتصدير الخطة الشهرية A4"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>تصدير تقرير الخطة A4</span>
                </button>
              )}
            </div>

            {/* Months Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
              {monthlyTimeline.map((m) => {
                const isSelected = selectedMonthKey === m.monthKey;
                const mMaterials = materials.filter((mat) => mat.targetMonthKey === m.monthKey);
                const mCompleted = mMaterials.filter((mat) => mat.isCompleted).length;

                return (
                  <button
                    key={m.monthKey}
                    onClick={() => {
                      setSelectedMonthKey(m.monthKey);
                      resilientAudio.playClickSound();
                    }}
                    className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shrink-0 text-right flex flex-col gap-1 border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="font-bold">{m.monthNameAr}</span>
                    <span
                      className={`text-[10px] font-mono ${
                        isSelected ? 'text-blue-100' : 'text-slate-500'
                      }`}
                    >
                      {mCompleted} / {mMaterials.length} مكتمل
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Month Detail Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 uppercase">
                  {activeMonthData.monthKey}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">{activeMonthData.monthNameAr}</h3>
                <p className="text-xs text-slate-600 mt-1 font-medium">🎯 {activeMonthData.themeTitle}</p>
              </div>

              {/* Progress ring or bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 min-w-[200px] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">نسبة الإنجاز الشهري:</span>
                  <span className="text-blue-700 font-mono">{monthCompletionPercent}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${monthCompletionPercent}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 text-left font-mono">
                  {activeMonthCompleted} من {activeMonthMaterials.length} عناصر مكتملة
                </div>
              </div>
            </div>

            {/* Weekly Syllabus Plan for this Month */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-600" />
                <span>الخطة الأسبوعية وتوزيع نواتج التعلم:</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeMonthData.weekPlans.map((week) => (
                  <div
                    key={week.weekNumber}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-lg">
                        الأسبوع {week.weekNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{week.weekTitle}</span>
                    </div>

                    <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed font-medium">
                      🎯 <span className="font-semibold text-slate-700">الهدف:</span> {week.focusOutcome}
                    </p>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 block">المواد المستهدفة:</span>
                      {week.subjectsPlan.map((sp, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{sp.subjectName}:</span>
                            <span className="text-slate-600">{sp.targetChapter}</span>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {sp.requiredLectures} حصص
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scheduled Materials for this month */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-blue-600" />
                <span>المواد والمذكرات المجدولة لشهر {activeMonthData.monthNameAr}:</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeMonthMaterials.map((mat) => (
                  <MaterialCardItem
                    key={mat.id}
                    material={mat}
                    onToggleStatus={handleToggleMaterialStatus}
                    onPushSchedule={handlePushToDailyPlanner}
                    onPreview={setPreviewMaterial}
                    onCopyText={handleCopyText}
                    copiedId={copiedId}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: REGISTER / EDIT STUDENT WHATSAPP & STORAGE PATH */}
      {/* ========================================================================= */}
      {isEditStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>تسجيل وتعديل رقم الطالب المشترك</span>
              </h3>
              <button
                onClick={() => setIsEditStudentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentConfig} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">اسم الطالب الثلاثي:</label>
                <input
                  type="text"
                  value={editStudentNameInput}
                  onChange={(e) => setEditStudentNameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">رقم الواتساب المشترك به على منصات المدرسين:</label>
                <input
                  type="text"
                  value={editPhoneInput}
                  onChange={(e) => setEditPhoneInput(e.target.value)}
                  placeholder="+201018849201"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                  required
                />
                <span className="text-[10px] text-slate-500 block">
                  يجب أن يكون الرقم بصيغة مصرية (+201...) لتمكين إرسال الواجبات والتواصل المباشر.
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">مسار مجلد التخزين الرئيسي على القرص:</label>
                <input
                  type="text"
                  value={editDirInput}
                  onChange={(e) => setEditDirInput(e.target.value)}
                  placeholder="D:/ThanaweyaAmma_2027/"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditStudentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 cursor-pointer font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white font-bold bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
                >
                  حفظ وتأكيد الرقم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REGISTER TEACHER & PLATFORM */}
      {/* ========================================================================= */}
      {isAddTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>تسجيل مدرس جديد وربط منصة الواتساب</span>
              </h3>
              <button
                onClick={() => setIsAddTeacherModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">اسم المدرس:</label>
                  <input
                    type="text"
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    placeholder="مستر إبراهيم الدسوقي"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">المادة الدراسية:</label>
                  <select
                    value={newTeacherSubject}
                    onChange={(e) => setNewTeacherSubject(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
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
                  <label className="font-bold text-slate-700">رقم واتساب المدرس:</label>
                  <input
                    type="text"
                    value={newTeacherPhone}
                    onChange={(e) => setNewTeacherPhone(e.target.value)}
                    placeholder="+201012345678"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">واتساب المساعدين (تسليم الواجب):</label>
                  <input
                    type="text"
                    value={newTeacherAssistant}
                    onChange={(e) => setNewTeacherAssistant(e.target.value)}
                    placeholder="+201012345679"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">اسم المنصة التعليمية:</label>
                  <input
                    type="text"
                    value={newTeacherPlatform}
                    onChange={(e) => setNewTeacherPlatform(e.target.value)}
                    placeholder="أكاديمية الصفوة"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">اسم جروب الواتساب:</label>
                  <input
                    type="text"
                    value={newTeacherGroup}
                    onChange={(e) => setNewTeacherGroup(e.target.value)}
                    placeholder="دفعة 2027 - VIP"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">كود اشتراك الطالب لدى المدرس:</label>
                  <input
                    type="text"
                    value={newTeacherCode}
                    onChange={(e) => setNewTeacherCode(e.target.value)}
                    placeholder="THN-CALC-99"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">مواعيد نزول الحصص:</label>
                  <input
                    type="text"
                    value={newTeacherDays}
                    onChange={(e) => setNewTeacherDays(e.target.value)}
                    placeholder="السبت والثلاثاء 7 مساءً"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddTeacherModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 cursor-pointer font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white font-bold bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
                >
                  تسجيل وربط المدرس
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: MANUAL WHATSAPP MESSAGE INSPECTOR */}
      {/* ========================================================================= */}
      {isManualInspectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ClipboardPaste className="w-4 h-4 text-blue-600" />
                <span>تحليل رسالة واتساب ويب واستخراج الروابط</span>
              </h3>
              <button
                onClick={() => setIsManualInspectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualInspectSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">رقم هاتف المرسل (المدرس):</label>
                <select
                  value={manualInspectPhone}
                  onChange={(e) => setManualInspectPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600 font-semibold"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.whatsAppNumber}>
                      {t.name} ({t.subjectNameAr}) - {t.whatsAppNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">الصق نص رسالة واتساب ويب هنا:</label>
                <textarea
                  value={manualInspectText}
                  onChange={(e) => setManualInspectText(e.target.value)}
                  placeholder="مثال: يا شباب ده لينك شيت الواجب PDF على درايف: https://drive.google.com/file/d/xyz/view"
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-blue-600 font-sans"
                  required
                />
                <span className="text-[10px] text-slate-500 block">
                  سيقوم محرك الفحص بالتقاط الرابط، واكتشاف نوع الملف (PDF أو فيديو)، ومطابقته مع مجلد المدرس على جهازك.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsManualInspectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 cursor-pointer font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white font-bold bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
                >
                  فحص واستخراج الرابط
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: POLLING RADAR SETTINGS CONFIGURATION */}
      {/* ========================================================================= */}
      {isPollingSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>إعدادات رادار فحص رسائل الواتساب</span>
              </h3>
              <button
                onClick={() => setIsPollingSettingsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Toggle Polling Engine */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="font-bold text-slate-900">تشغيل الفحص الدوري التلقائي:</div>
                  <div className="text-[11px] text-slate-500">فحص خلفي هادئ لميتاداتا رسائل واتساب ويب</div>
                </div>
                <input
                  type="checkbox"
                  checked={pollingConfig.isEnabled}
                  onChange={(e) => {
                    whatsAppPollingService.updateConfig({ isEnabled: e.target.checked });
                  }}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </div>

              {/* Polling Interval */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">الفاصل الزمني بين دورات الفحص:</label>
                <select
                  value={pollingConfig.intervalSeconds}
                  onChange={(e) => {
                    whatsAppPollingService.updateConfig({ intervalSeconds: Number(e.target.value) });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
                >
                  <option value={15}>كل 15 ثانية (فحص فائق السرعة)</option>
                  <option value={30}>كل 30 ثانية</option>
                  <option value={45}>كل 45 ثانية (موصى به - متوازن)</option>
                  <option value={90}>كل دقيقة ونصف</option>
                  <option value={180}>كل 3 دقائق (توفير البطارية)</option>
                </select>
              </div>

              {/* Auto-Import Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="font-bold text-slate-900">الاستيراد الفوري دون مراجعة:</div>
                  <div className="text-[11px] text-slate-500">حفظ الملف في المكتبة مباشرة بمجرد اكتشاف الرابط</div>
                </div>
                <input
                  type="checkbox"
                  checked={pollingConfig.autoImportWithoutPrompt}
                  onChange={(e) => {
                    whatsAppPollingService.updateConfig({ autoImportWithoutPrompt: e.target.checked });
                  }}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </div>

              {/* Audio Chime Notification */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="font-bold text-slate-900">تنبيه صوتي عند اكتشاف رابط جديد:</div>
                  <div className="text-[11px] text-slate-500">نغمة إشعار فورية لتنبيهك بنزول الشيت أو الفيديو</div>
                </div>
                <input
                  type="checkbox"
                  checked={pollingConfig.notifyOnDetection}
                  onChange={(e) => {
                    whatsAppPollingService.updateConfig({ notifyOnDetection: e.target.checked });
                  }}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    whatsAppPollingService.clearCompletedHistory();
                    showToast('تم تنظيف سجل الروابط المستوردة والمتجاهلة.');
                  }}
                  className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                >
                  مسح السجل القديم
                </button>

                <button
                  type="button"
                  onClick={() => setIsPollingSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-white font-bold bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
                >
                  تم
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: MATERIAL PREVIEW & MEDIA VIEWER */}
      {/* ========================================================================= */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{previewMaterial.title}</h3>
                  <div className="text-xs text-slate-500 font-medium">
                    {previewMaterial.subjectNameAr} • {previewMaterial.teacherName}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewer presentation */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-blue-600 shadow-xs">
                {previewMaterial.fileType === 'video_lecture' && <Video className="w-8 h-8 text-blue-600" />}
                {previewMaterial.fileType === 'voice_summary' && <Headphones className="w-8 h-8 text-amber-600" />}
                {(previewMaterial.fileType === 'pdf_sheet' || previewMaterial.fileType === 'model_answer') && (
                  <FileText className="w-8 h-8 text-rose-600" />
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">{previewMaterial.fileName}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  حجم الملف: {previewMaterial.fileSizeHuman} • الخطة: {previewMaterial.targetMonthName}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs text-right space-y-1 font-mono">
                <span className="text-slate-500 block text-[10px]">المسار المباشر على القرص المحلي:</span>
                <span className="text-blue-700 break-all select-all font-semibold">
                  {previewMaterial.localFolderPath}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => handleCopyText('modal_path', previewMaterial.localFolderPath, 'مسار الملف')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
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
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>إدراج في جدول اليوم</span>
                </button>
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
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

/**
 * Subcomponent: Material Card Item with Clear Course Indicators & Path Action
 */
const MaterialCardItem: React.FC<{
  material: DownloadedMediaMaterial;
  onToggleStatus: (id: string) => void;
  onPushSchedule: (mat: DownloadedMediaMaterial) => void;
  onPreview: (mat: DownloadedMediaMaterial) => void;
  onCopyText: (id: string, text: string, label: string) => void;
  copiedId: string | null;
}> = ({ material, onToggleStatus, onPushSchedule, onPreview, onCopyText, copiedId }) => {
  const isPdf = material.fileType === 'pdf_sheet' || material.fileType === 'model_answer';
  const isVideo = material.fileType === 'video_lecture';
  const isVoice = material.fileType === 'voice_summary';
  const indicator = COURSE_INDICATORS_MAP[material.subjectCode];

  return (
    <div
      className={`bg-white border rounded-2xl p-5 space-y-4 shadow-xs flex flex-col justify-between transition-all ${
        material.isCompleted ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 hover:border-blue-300'
      }`}
    >
      <div className="space-y-3">
        {/* Header: File icon, Title, Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                isPdf
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : isVideo
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}
            >
              {isPdf && <FileText className="w-5 h-5" />}
              {isVideo && <Video className="w-5 h-5" />}
              {isVoice && <Headphones className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {indicator && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ${indicator.badgeBg} ${indicator.badgeText} border ${indicator.borderClass}`}
                  >
                    {indicator.shortCode}
                  </span>
                )}
                <span className="text-xs font-bold text-slate-800">{material.subjectNameAr}</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-600 font-medium">{material.teacherName}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-1 leading-snug">{material.title}</h4>
            </div>
          </div>

          <button
            onClick={() => onToggleStatus(material.id)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
              material.isCompleted
                ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
            }`}
            title={material.isCompleted ? 'تمت دراستها بنجاح' : 'تحديد كمكتمل'}
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Specs: Size, Target Month, Schedule Date */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-700">
          <div>
            <span className="text-slate-500 block">حجم الملف:</span>
            <span className="font-mono font-bold text-slate-800">{material.fileSizeHuman}</span>
          </div>
          <div>
            <span className="text-slate-500 block">الخطة الشهرية:</span>
            <span className="font-bold text-blue-700 truncate block">
              {material.targetMonthName.replace('شهر ', '')}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">تاريخ الجدولة:</span>
            <span className="font-mono font-bold text-amber-700">{material.scheduledStudyDate}</span>
          </div>
        </div>

        {/* Local Storage Path Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-600 flex items-center gap-1 font-semibold">
              <HardDrive className="w-3.5 h-3.5 text-blue-600" />
              <span>مسار الحفظ المحلي في جهاز الطالب:</span>
            </span>
            <button
              onClick={() => onCopyText(`file_${material.id}`, material.localFolderPath, 'مسار الملف')}
              className="flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-800 transition-colors cursor-pointer font-bold"
              title="نسخ مسار الملف بالكامل"
            >
              {copiedId === `file_${material.id}` ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
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
          <div className="font-mono text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200 break-all select-all font-semibold">
            {material.localFolderPath}
          </div>
        </div>

        {material.notes && (
          <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed font-medium">
            📝 {material.notes}
          </div>
        )}
      </div>

      {/* Actions: Push to Daily Schedule, Preview */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
        <button
          onClick={() => onPushSchedule(material)}
          className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          title="إدراج الحصة في جدول المذاكرة اليومي"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>إدراج في جدول اليوم</span>
        </button>

        <button
          onClick={() => {
            onPreview(material);
            resilientAudio.playClickSound();
          }}
          className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          title="معاينة تفاصيل الملف والمحتوى"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <span>معاينة وتشغيل</span>
        </button>
      </div>
    </div>
  );
};

export default WhatsAppEducationalHubView;

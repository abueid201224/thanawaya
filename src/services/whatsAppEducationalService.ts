import type {
  StudentWhatsAppConfig,
  TeacherPlatformEntry,
  DownloadedMediaMaterial,
  SubjectCodeType,
  MonthlyPacingTimeline,
  DownloadedFileType
} from '../types/whatsappEducation';
import {
  INITIAL_STUDENT_WHATSAPP_CONFIG,
  INITIAL_TEACHERS_PLATFORMS,
  INITIAL_DOWNLOADED_MATERIALS,
  MONTHLY_PACING_TIMELINE_DATA,
  loadStudentConfig,
  saveStudentConfig,
  loadTeachers,
  saveTeachers,
  loadMaterials,
  saveMaterials
} from '../data/whatsappEducationData';

export interface StorageStatistics {
  totalFiles: number;
  totalSizeBytes: number;
  totalSizeHuman: string;
  completedCount: number;
  bySubject: Record<SubjectCodeType, {
    count: number;
    totalSizeBytes: number;
    sizeHuman: string;
    subjectNameAr: string;
    color: string;
  }>;
  byTeacher: Record<string, {
    teacherName: string;
    subjectNameAr: string;
    count: number;
    sizeHuman: string;
    avatarColor: string;
  }>;
}

export interface CourseIndicator {
  code: SubjectCodeType;
  title: string;
  shortCode: string;
  colorName: string;
  badgeBg: string;
  badgeText: string;
  borderClass: string;
  accentBg: string;
  iconType: 'integral' | 'sigma' | 'force' | 'vector' | 'atom' | 'flask' | 'book' | 'globe';
}

export const COURSE_INDICATORS_MAP: Record<SubjectCodeType, CourseIndicator> = {
  CALCULUS: {
    code: 'CALCULUS',
    title: 'التفاضل والتكامل',
    shortCode: 'CALC-3',
    colorName: 'emerald',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    borderClass: 'border-emerald-200',
    accentBg: 'bg-emerald-600',
    iconType: 'integral'
  },
  PHYSICS: {
    code: 'PHYSICS',
    title: 'الفيزياء للثانوية العامة',
    shortCode: 'PHYS-3',
    colorName: 'blue',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    borderClass: 'border-blue-200',
    accentBg: 'bg-blue-600',
    iconType: 'atom'
  },
  STATICS: {
    code: 'STATICS',
    title: 'الاستاتيكا والديناميكا (ميكانيكا)',
    shortCode: 'MECH-3',
    colorName: 'amber',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    borderClass: 'border-amber-200',
    accentBg: 'bg-amber-600',
    iconType: 'force'
  },
  ALGEBRA_SOLID_GEO: {
    code: 'ALGEBRA_SOLID_GEO',
    title: 'الجبر والهندسة الفراغية',
    shortCode: 'ALG-3',
    colorName: 'purple',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    borderClass: 'border-purple-200',
    accentBg: 'bg-purple-600',
    iconType: 'vector'
  },
  DYNAMICS: {
    code: 'DYNAMICS',
    title: 'الديناميكا والحركة',
    shortCode: 'DYN-3',
    colorName: 'cyan',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-700',
    borderClass: 'border-cyan-200',
    accentBg: 'bg-cyan-600',
    iconType: 'force'
  },
  CHEMISTRY: {
    code: 'CHEMISTRY',
    title: 'الكيمياء',
    shortCode: 'CHEM-3',
    colorName: 'rose',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    borderClass: 'border-rose-200',
    accentBg: 'bg-rose-600',
    iconType: 'flask'
  },
  ARABIC: {
    code: 'ARABIC',
    title: 'اللغة العربية',
    shortCode: 'ARB-3',
    colorName: 'teal',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    borderClass: 'border-teal-200',
    accentBg: 'bg-teal-600',
    iconType: 'book'
  },
  ENGLISH: {
    code: 'ENGLISH',
    title: 'اللغة الإنجليزية',
    shortCode: 'ENG-3',
    colorName: 'indigo',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    borderClass: 'border-indigo-200',
    accentBg: 'bg-indigo-600',
    iconType: 'globe'
  }
};

/**
 * Singleton Service for WhatsApp Educational Platform Integration
 * Manages student registration, teacher linking, and auto-organized media files.
 */
class WhatsAppEducationalService {
  private studentConfig: StudentWhatsAppConfig;
  private teachers: TeacherPlatformEntry[];
  private materials: DownloadedMediaMaterial[];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.studentConfig = loadStudentConfig();
    this.teachers = loadTeachers();
    this.materials = loadMaterials();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('WhatsAppEducationalService listener error:', err);
      }
    });
  }

  // --- Student Registration & Config Management ---

  public getStudentConfig(): StudentWhatsAppConfig {
    return { ...this.studentConfig };
  }

  public updateStudentConfig(updates: Partial<StudentWhatsAppConfig>): StudentWhatsAppConfig {
    this.studentConfig = {
      ...this.studentConfig,
      ...updates
    };
    saveStudentConfig(this.studentConfig);
    this.notify();
    return this.studentConfig;
  }

  public registerStudentNumber(
    phoneNumber: string,
    studentName?: string,
    defaultStorageDirectory?: string
  ): { success: boolean; formatted: string; message: string } {
    const cleaned = phoneNumber.replace(/[\s\-]/g, '');
    let formatted = cleaned;
    if (cleaned.startsWith('01') && cleaned.length === 11) {
      formatted = `+20${cleaned.substring(1)}`;
    } else if (cleaned.startsWith('20') && cleaned.length === 12) {
      formatted = `+${cleaned}`;
    } else if (!cleaned.startsWith('+')) {
      formatted = `+20${cleaned}`;
    }

    const isValid = /^\+201[0125][0-9]{8}$/.test(formatted);

    this.studentConfig = {
      ...this.studentConfig,
      phoneNumber: formatted,
      studentName: studentName || this.studentConfig.studentName,
      defaultStorageDirectory: defaultStorageDirectory || this.studentConfig.defaultStorageDirectory,
      isRegisteredOnPlatform: true,
      registrationDate: new Date().toISOString().split('T')[0]
    };
    saveStudentConfig(this.studentConfig);
    this.notify();

    return {
      success: true,
      formatted,
      message: isValid
        ? 'تم تسجيل رقم الواتساب وتوثيقه بنجاح على منصات المدرسين'
        : 'تم حفظ الرقم بنجاح (يرجى التأكد من كود الدولة +20)'
    };
  }

  // --- Teachers & Platforms Linking ---

  public getTeachers(): TeacherPlatformEntry[] {
    return [...this.teachers];
  }

  public getTeacherById(id: string): TeacherPlatformEntry | undefined {
    return this.teachers.find((t) => t.id === id);
  }

  public addTeacher(entry: Omit<TeacherPlatformEntry, 'id' | 'materialsCount'>): TeacherPlatformEntry {
    const newId = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newTeacher: TeacherPlatformEntry = {
      ...entry,
      id: newId,
      materialsCount: 0
    };

    this.teachers = [newTeacher, ...this.teachers];
    saveTeachers(this.teachers);
    this.notify();
    return newTeacher;
  }

  public updateTeacher(id: string, updates: Partial<TeacherPlatformEntry>): TeacherPlatformEntry | null {
    const index = this.teachers.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const updated = {
      ...this.teachers[index],
      ...updates
    };
    this.teachers[index] = updated;
    saveTeachers(this.teachers);
    this.notify();
    return updated;
  }

  public deleteTeacher(id: string): boolean {
    const beforeCount = this.teachers.length;
    this.teachers = this.teachers.filter((t) => t.id !== id);
    if (this.teachers.length !== beforeCount) {
      saveTeachers(this.teachers);
      this.notify();
      return true;
    }
    return false;
  }

  // --- Downloaded Media Materials & Library ---

  public getMaterials(): DownloadedMediaMaterial[] {
    return [...this.materials];
  }

  public addMaterial(materialData: Omit<DownloadedMediaMaterial, 'id'>): DownloadedMediaMaterial {
    const newId = `mat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newMat: DownloadedMediaMaterial = {
      ...materialData,
      id: newId
    };

    this.materials = [newMat, ...this.materials];
    saveMaterials(this.materials);

    // Update teacher material count
    const teacherIndex = this.teachers.findIndex((t) => t.id === newMat.teacherId);
    if (teacherIndex !== -1) {
      this.teachers[teacherIndex].materialsCount = (this.teachers[teacherIndex].materialsCount || 0) + 1;
      saveTeachers(this.teachers);
    }

    this.notify();
    return newMat;
  }

  public updateMaterial(id: string, updates: Partial<DownloadedMediaMaterial>): DownloadedMediaMaterial | null {
    const index = this.materials.findIndex((m) => m.id === id);
    if (index === -1) return null;

    const updated = {
      ...this.materials[index],
      ...updates
    };
    this.materials[index] = updated;
    saveMaterials(this.materials);
    this.notify();
    return updated;
  }

  public toggleMaterialCompleted(id: string): DownloadedMediaMaterial | null {
    const index = this.materials.findIndex((m) => m.id === id);
    if (index === -1) return null;

    const current = this.materials[index];
    const updated = {
      ...current,
      isCompleted: !current.isCompleted
    };
    this.materials[index] = updated;
    saveMaterials(this.materials);
    this.notify();
    return updated;
  }

  public deleteMaterial(id: string): boolean {
    const item = this.materials.find((m) => m.id === id);
    if (!item) return false;

    this.materials = this.materials.filter((m) => m.id !== id);
    saveMaterials(this.materials);

    // Decrement teacher material count
    const teacherIndex = this.teachers.findIndex((t) => t.id === item.teacherId);
    if (teacherIndex !== -1 && this.teachers[teacherIndex].materialsCount > 0) {
      this.teachers[teacherIndex].materialsCount -= 1;
      saveTeachers(this.teachers);
    }

    this.notify();
    return true;
  }

  // --- Auto-Organizing Library Engine ---

  /**
   * Automatically organizes media library by subject or by teacher
   */
  public autoOrganizeLibrary(
    groupBy: 'subject' | 'teacher' | 'fileType' = 'subject'
  ): Record<string, {
    key: string;
    title: string;
    subtitle: string;
    indicator?: CourseIndicator;
    avatarColor?: string;
    folderPath?: string;
    items: DownloadedMediaMaterial[];
    totalSizeHuman: string;
  }> {
    const groups: Record<string, {
      key: string;
      title: string;
      subtitle: string;
      indicator?: CourseIndicator;
      avatarColor?: string;
      folderPath?: string;
      items: DownloadedMediaMaterial[];
      totalSizeBytes: number;
      totalSizeHuman: string;
    }> = {};

    this.materials.forEach((mat) => {
      let groupKey: string;
      let title: string;
      let subtitle: string;
      let indicator: CourseIndicator | undefined;
      let avatarColor: string | undefined;
      let folderPath: string | undefined;

      if (groupBy === 'subject') {
        groupKey = mat.subjectCode;
        title = mat.subjectNameAr;
        indicator = COURSE_INDICATORS_MAP[mat.subjectCode];
        subtitle = `كود المادة: ${indicator?.shortCode || mat.subjectCode}`;
        folderPath = `${this.studentConfig.defaultStorageDirectory}${mat.subjectCode}/`;
      } else if (groupBy === 'teacher') {
        groupKey = mat.teacherId;
        const teacher = this.teachers.find((t) => t.id === mat.teacherId);
        title = mat.teacherName;
        subtitle = teacher ? `${teacher.subjectNameAr} • ${teacher.platformName}` : mat.subjectNameAr;
        avatarColor = teacher?.avatarColor || 'from-blue-600 to-indigo-700';
        folderPath = teacher?.localFolderPath;
        indicator = COURSE_INDICATORS_MAP[mat.subjectCode];
      } else {
        groupKey = mat.fileType;
        const typeLabels: Record<DownloadedFileType, string> = {
          pdf_sheet: 'شيتات ومذكرات بي دي إف',
          video_lecture: 'محاضرات وفيديوهات مسجلة',
          voice_summary: 'كبسولات ورسائل صوتية',
          model_answer: 'نماذج الإجابة وتوزيع الدرجات',
          exam_file: 'امتحانات وتدريبات دورية'
        };
        title = typeLabels[mat.fileType] || mat.fileType;
        subtitle = `نوع الملف: ${mat.fileType}`;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          title,
          subtitle,
          indicator,
          avatarColor,
          folderPath,
          items: [],
          totalSizeBytes: 0,
          totalSizeHuman: '0 MB'
        };
      }

      groups[groupKey].items.push(mat);
      groups[groupKey].totalSizeBytes += mat.fileSizeBytes || 0;
    });

    // Format human readable size for each group
    Object.values(groups).forEach((grp) => {
      grp.totalSizeHuman = this.formatBytes(grp.totalSizeBytes);
    });

    return groups;
  }

  /**
   * Generates comprehensive storage statistics
   */
  public getStorageStats(): StorageStatistics {
    let totalSizeBytes = 0;
    let completedCount = 0;
    const bySubject: StorageStatistics['bySubject'] = {} as any;
    const byTeacher: StorageStatistics['byTeacher'] = {};

    this.materials.forEach((mat) => {
      const bytes = mat.fileSizeBytes || 0;
      totalSizeBytes += bytes;
      if (mat.isCompleted) completedCount++;

      // Subject stats
      if (!bySubject[mat.subjectCode]) {
        bySubject[mat.subjectCode] = {
          count: 0,
          totalSizeBytes: 0,
          sizeHuman: '0 MB',
          subjectNameAr: mat.subjectNameAr,
          color: COURSE_INDICATORS_MAP[mat.subjectCode]?.accentBg || 'bg-blue-600'
        };
      }
      bySubject[mat.subjectCode].count += 1;
      bySubject[mat.subjectCode].totalSizeBytes += bytes;

      // Teacher stats
      if (!byTeacher[mat.teacherId]) {
        const teacher = this.teachers.find((t) => t.id === mat.teacherId);
        byTeacher[mat.teacherId] = {
          teacherName: mat.teacherName,
          subjectNameAr: mat.subjectNameAr,
          count: 0,
          sizeHuman: '0 MB',
          avatarColor: teacher?.avatarColor || 'from-blue-600 to-indigo-700'
        };
      }
      byTeacher[mat.teacherId].count += 1;
    });

    // Format humans
    Object.keys(bySubject).forEach((k) => {
      const key = k as SubjectCodeType;
      bySubject[key].sizeHuman = this.formatBytes(bySubject[key].totalSizeBytes);
    });

    return {
      totalFiles: this.materials.length,
      totalSizeBytes,
      totalSizeHuman: this.formatBytes(totalSizeBytes),
      completedCount,
      bySubject,
      byTeacher
    };
  }

  /**
   * Generate standard WhatsApp chat link with prefilled text
   */
  public getWhatsAppChatUrl(phone: string, text: string = ''): string {
    const cleanPhone = phone.replace(/[^\d+]/g, '').replace('+', '');
    const encoded = encodeURIComponent(text);
    return `https://wa.me/${cleanPhone}${text ? `?text=${encoded}` : ''}`;
  }

  /**
   * Sync simulation: pull newest lesson worksheets or video links
   */
  public async simulateSyncChannel(teacherId?: string): Promise<{ syncedCount: number; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const targetTeacher = teacherId ? this.teachers.find((t) => t.id === teacherId) : this.teachers[0];
        if (!targetTeacher) {
          resolve({ syncedCount: 0, message: 'لم يتم العثور على المدرس' });
          return;
        }

        const newSample: DownloadedMediaMaterial = {
          id: `sync_${Date.now()}`,
          title: `مذكرة الشرح والتدريبات الوزارية - الأسبوع الجاري (${targetTeacher.subjectNameAr})`,
          teacherId: targetTeacher.id,
          teacherName: targetTeacher.name,
          subjectCode: targetTeacher.subjectCode,
          subjectNameAr: targetTeacher.subjectNameAr,
          fileType: 'pdf_sheet',
          fileName: `Worksheet_Unit_${Date.now().toString().slice(-4)}.pdf`,
          fileSizeBytes: 14200000,
          fileSizeHuman: '14.2 MB',
          localFolderPath: `${targetTeacher.localFolderPath}Worksheets/Current_Week.pdf`,
          targetMonthKey: '2026-10',
          targetMonthName: 'شهر أكتوبر 2026',
          scheduledStudyDate: new Date().toISOString().split('T')[0],
          curriculumUnitName: 'المراجعات التراكمية وتطبيقات بنك الأسئلة',
          downloadDate: new Date().toISOString().split('T')[0],
          isCompleted: false,
          notes: 'تمت المزامنة الآلية عبر قناة الواتساب الرسمية بنجاح.'
        };

        this.materials = [newSample, ...this.materials];
        saveMaterials(this.materials);

        const tIdx = this.teachers.findIndex((t) => t.id === targetTeacher.id);
        if (tIdx !== -1) {
          this.teachers[tIdx].materialsCount += 1;
          saveTeachers(this.teachers);
        }

        this.notify();
        resolve({
          syncedCount: 1,
          message: `تمت مزامنة ملف جديد بنجاح من قناة ${targetTeacher.name}`
        });
      }, 700);
    });
  }

  public getMonthlyPacingData(): MonthlyPacingTimeline[] {
    return MONTHLY_PACING_TIMELINE_DATA;
  }

  private formatBytes(bytes: number): string {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1000) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  }
}

export const whatsAppEducationalService = new WhatsAppEducationalService();
export default whatsAppEducationalService;

/**
 * WhatsApp Educational Platforms & Downloaded Media Library Types
 * For Thanaweya Amma Math & Science Students
 */

export interface StudentWhatsAppConfig {
  studentName: string;
  phoneNumber: string;       // e.g. "+20 101 234 5678"
  nationalId?: string;
  isRegisteredOnPlatform: boolean;
  registrationDate: string;
  defaultStorageDirectory: string; // e.g. "D:/ThanaweyaAmma_2027/"
  notificationsEnabled: boolean;
  autoOrganizeDownloads: boolean;
}

export type SubjectCodeType =
  | 'CALCULUS'
  | 'ALGEBRA_SOLID_GEO'
  | 'STATICS'
  | 'DYNAMICS'
  | 'PHYSICS'
  | 'CHEMISTRY'
  | 'ARABIC'
  | 'ENGLISH';

export interface TeacherPlatformEntry {
  id: string;
  name: string;                   // اسم المدرس
  titlePrefix?: string;           // مستر / دكتور / أستاذ
  subjectCode: SubjectCodeType;
  subjectNameAr: string;          // مادة التدريس
  whatsAppNumber: string;         // رقم الواتساب الرسمي
  assistantWhatsAppNumber?: string; // رقم مساعد أو سنتر المتابعة
  platformName: string;           // اسم المنصة (منصة الأوائل، نيوتن، إيديوميتر...)
  groupName: string;              // اسم جروب الواتساب المشترك به الطالب
  studentSubscriptionCode: string;// كود الطالب لدى المدرس
  lectureDays: string;            // مواعيد نزول الحصص
  localFolderPath: string;        // مسار الحفظ المخصص لهذا المدرس
  activeNotes?: string;
  avatarColor: string;
  materialsCount: number;
}

export type DownloadedFileType =
  | 'pdf_sheet'      // مذكرة / شيت واجب
  | 'video_lecture'  // فيديو حصة مسجلة
  | 'voice_summary'  // كبسولة صوتية / ريكورد شرح
  | 'model_answer'   // نموذج إجابة وتوزيع درجات
  | 'exam_file';     // امتحان دوري

export interface DownloadedMediaMaterial {
  id: string;
  title: string;                  // عنوان الحصة أو المذكرة
  teacherId: string;
  teacherName: string;
  subjectCode: SubjectCodeType;
  subjectNameAr: string;
  fileType: DownloadedFileType;
  fileName: string;               // اسم الملف الأصلي
  fileSizeBytes: number;
  fileSizeHuman: string;          // e.g. "18.4 MB"
  localFolderPath: string;        // مسار التخزين المخصص
  targetMonthKey: string;         // e.g. "2026-10"
  targetMonthName: string;        // e.g. "شهر أكتوبر 2026"
  scheduledStudyDate: string;     // تاريخ الاستحقاق وفق خطة الدراسة
  curriculumUnitName: string;     // الوحدة المنهجية التابعة لها
  downloadDate: string;           // تاريخ التنزيل
  isCompleted: boolean;           // تم سماعها / حلها
  notes?: string;
  fileUrl?: string;               // رابط تشغيل محلي أو سحابي
  driveOrCloudBackupPath?: string;
}

export interface MonthlyPacingTimeline {
  monthKey: string;               // "2026-10"
  monthNameAr: string;            // "أكتوبر 2026"
  themeTitle: string;             // الهدف الرئيسي للشهر
  weekPlans: Array<{
    weekNumber: number;
    weekTitle: string;
    focusOutcome: string;
    subjectsPlan: Array<{
      subjectCode: SubjectCodeType;
      subjectName: string;
      targetChapter: string;
      requiredLectures: number;
    }>;
  }>;
}

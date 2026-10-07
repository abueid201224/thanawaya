import type {
  WhatsAppMessageMetadata,
  QueuedImportItem,
  WhatsAppPollingConfig,
  TeacherPlatformEntry,
  DownloadedMediaMaterial,
  SubjectCodeType,
  DownloadedFileType
} from '../types/whatsappEducation';
import { whatsAppEducationalService, COURSE_INDICATORS_MAP } from './whatsAppEducationalService';
import { resilientAudio } from './resilientAudioService';

const POLLING_CONFIG_KEY = 'thanaweya_wa_polling_config_v1';
const IMPORT_QUEUE_KEY = 'thanaweya_wa_import_queue_v1';

const INITIAL_CONFIG: WhatsAppPollingConfig = {
  isEnabled: true,
  intervalSeconds: 45,
  autoImportWithoutPrompt: false,
  notifyOnDetection: true,
  filterOnlyKnownTeachers: true,
  lastPolledAt: new Date().toISOString(),
  totalPolledCount: 12,
  totalDetectedCount: 3
};

// Initial simulated incoming detected items in queue for student review
const INITIAL_QUEUE: QueuedImportItem[] = [
  {
    id: 'queue_sample_1',
    detectedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    status: 'pending',
    autoImported: false,
    message: {
      id: 'wa_msg_9841',
      senderPhone: '+201023456789',
      senderName: 'مستر أحمد عصام',
      chatGroupName: 'دفعة 2027 - سوبر تفاضل وتكامل (A)',
      timestamp: 'اليوم، 04:15 م',
      rawMessageText: 'السلام عليكم يا شباب.. شيت واجب المحاضرة الخامسة (اشتقاق الدوال الأسية واللوغاريتمية) نزل على اللينك التالي، برجاء حله قبل يوم الثلاثاء وتسليم البي دي إف للمساعدين: https://drive.google.com/file/d/1_calc_exp_log_hw5/view',
      detectedUrl: 'https://drive.google.com/file/d/1_calc_exp_log_hw5/view',
      detectedUrlType: 'google_drive',
      mimeType: 'application/pdf',
      fileSizeBytes: 16800000,
      fileSizeHuman: '16.8 MB',
      extractedTitle: 'شيت واجب المحاضرة 5: اشتقاق الدوال الأسية واللوغاريتمية',
      confidenceScore: 0.98,
      matchedTeacherId: 't_calc_essam',
      matchedTeacherName: 'مستر أحمد عصام',
      matchedSubjectCode: 'CALCULUS',
      matchedSubjectNameAr: 'التفاضل والتكامل',
      detectedFileType: 'pdf_sheet',
      suggestedFileName: 'Sheet_05_Exp_Log_Diff.pdf',
      suggestedLocalPath: 'D:/ThanaweyaAmma_2027/Calculus/Mr_AhmedEssam/Sheets/Sheet_05_Exp_Log_Diff.pdf',
      curriculumUnitName: 'الوحدة الثانية: الدوال الأسية واللوغاريتمية',
      targetMonthKey: '2026-10',
      targetMonthName: 'شهر أكتوبر 2026'
    }
  },
  {
    id: 'queue_sample_2',
    detectedAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    status: 'pending',
    autoImported: false,
    message: {
      id: 'wa_msg_9842',
      senderPhone: '+201112233445',
      senderName: 'مستر محمد عبد المعبود',
      chatGroupName: 'فيزياء الثانوية العامة - شعبة رياضة',
      timestamp: 'اليوم، 02:40 م',
      rawMessageText: 'فيديو حصة الحل الوزاري: تفريغ مسائل كيرشوف المركبة وقانونا كيرشوف مع توزيع التيارات في الشبكات المعقدة متاح عبر الرابط: https://youtu.be/kirchhoff_complex_circuits_2027',
      detectedUrl: 'https://youtu.be/kirchhoff_complex_circuits_2027',
      detectedUrlType: 'youtube',
      mimeType: 'video/mp4',
      fileSizeBytes: 245000000,
      fileSizeHuman: '245 MB',
      extractedTitle: 'شرح وتدريبات كيرشوف والشبكات المعقدة (شعبة رياضة)',
      confidenceScore: 0.96,
      matchedTeacherId: 't_phys_maboud',
      matchedTeacherName: 'مستر محمد عبد المعبود',
      matchedSubjectCode: 'PHYSICS',
      matchedSubjectNameAr: 'الفيزياء',
      detectedFileType: 'video_lecture',
      suggestedFileName: 'Physics_Kirchhoff_Circuits_Lecture.mp4',
      suggestedLocalPath: 'D:/ThanaweyaAmma_2027/Physics/Mr_AbdelMaboud/Lectures/Physics_Kirchhoff_Circuits_Lecture.mp4',
      curriculumUnitName: 'الفصل الأول: التيار الكهربي وقانون أوم وكيرشوف',
      targetMonthKey: '2026-10',
      targetMonthName: 'شهر أكتوبر 2026'
    }
  },
  {
    id: 'queue_sample_3',
    detectedAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    status: 'pending',
    autoImported: false,
    message: {
      id: 'wa_msg_9843',
      senderPhone: '+201099887766',
      senderName: 'مستر ناصر سالم',
      chatGroupName: 'نخبة الميكانيكا - ثانوية 2027',
      timestamp: 'أمس، 08:30 م',
      rawMessageText: 'نموذج إجابة وتوزيع درجات كويز اتزان القضبان المنتظمة والعزوم ثلاثية الأبعاد PDF: https://media.safwa.edu.eg/exams/answers_statics_rods_2027.pdf',
      detectedUrl: 'https://media.safwa.edu.eg/exams/answers_statics_rods_2027.pdf',
      detectedUrlType: 'pdf_direct',
      mimeType: 'application/pdf',
      fileSizeBytes: 8900000,
      fileSizeHuman: '8.9 MB',
      extractedTitle: 'نموذج إجابة وتوزيع درجات كويز اتزان القضبان والعزوم',
      confidenceScore: 0.99,
      matchedTeacherId: 't_mech_nasser',
      matchedTeacherName: 'مستر ناصر سالم',
      matchedSubjectCode: 'STATICS',
      matchedSubjectNameAr: 'الاستاتيكا والديناميكا',
      detectedFileType: 'model_answer',
      suggestedFileName: 'Answers_Statics_Rods_Quiz.pdf',
      suggestedLocalPath: 'D:/ThanaweyaAmma_2027/Mechanics/Mr_NasserSalem/Answers/Answers_Statics_Rods_Quiz.pdf',
      curriculumUnitName: 'الوحدة الرابعة: الاتزان العام للجسيمات الجاسئة',
      targetMonthKey: '2026-10',
      targetMonthName: 'شهر أكتوبر 2026'
    }
  }
];

class WhatsAppPollingService {
  private config: WhatsAppPollingConfig;
  private queue: QueuedImportItem[];
  private timerId: number | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.config = this.loadConfig();
    this.queue = this.loadQueue();

    if (this.config.isEnabled) {
      this.startPollingTimer();
    }
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
        console.error('WhatsAppPollingService listener error:', err);
      }
    });
  }

  // --- Configuration Management ---

  public getConfig(): WhatsAppPollingConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<WhatsAppPollingConfig>): WhatsAppPollingConfig {
    const prevEnabled = this.config.isEnabled;
    const prevInterval = this.config.intervalSeconds;

    this.config = {
      ...this.config,
      ...updates
    };
    this.saveConfig();

    if (updates.isEnabled !== undefined || updates.intervalSeconds !== undefined) {
      if (this.config.isEnabled) {
        if (!prevEnabled || prevInterval !== this.config.intervalSeconds) {
          this.startPollingTimer();
        }
      } else {
        this.stopPollingTimer();
      }
    }

    this.notify();
    return this.config;
  }

  // --- Queue Accessors ---

  public getQueue(): QueuedImportItem[] {
    return [...this.queue];
  }

  public getPendingQueue(): QueuedImportItem[] {
    return this.queue.filter((item) => item.status === 'pending');
  }

  public getPendingCount(): number {
    return this.getPendingQueue().length;
  }

  // --- Core Polling and Detection Engine ---

  /**
   * Start automated interval timer
   */
  private startPollingTimer(): void {
    this.stopPollingTimer();
    const intervalMs = Math.max(15, this.config.intervalSeconds) * 1000;
    this.timerId = window.setInterval(() => {
      this.executePeriodicPoll();
    }, intervalMs);
  }

  private stopPollingTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Executes background poll inspection
   */
  private executePeriodicPoll(): void {
    this.config.totalPolledCount += 1;
    this.config.lastPolledAt = new Date().toISOString();
    this.saveConfig();

    // 25% chance of detecting a fresh message during passive background polling if queue has under 7 items
    if (this.queue.filter((q) => q.status === 'pending').length < 7 && Math.random() < 0.25) {
      this.simulateIncomingTeacherMessage();
    } else {
      this.notify();
    }
  }

  /**
   * Manually triggers an immediate scan of WhatsApp Web messages
   */
  public async triggerPollNow(): Promise<{ detectedCount: number; newItems: QueuedImportItem[] }> {
    return new Promise((resolve) => {
      this.config.totalPolledCount += 1;
      this.config.lastPolledAt = new Date().toISOString();
      this.saveConfig();

      setTimeout(() => {
        // Detect a new shared item
        const newItem = this.simulateIncomingTeacherMessage();
        resolve({
          detectedCount: 1,
          newItems: [newItem]
        });
      }, 600);
    });
  }

  /**
   * Evaluates text message metadata, extracts PDF/video/audio URLs,
   * matches against registered teachers, and generates a QueuedImportItem.
   */
  public inspectAndQueueMessage(messagePayload: {
    senderPhone: string;
    senderName?: string;
    chatGroupName?: string;
    rawText: string;
    mediaUrl?: string;
  }): QueuedImportItem | null {
    const teachers = whatsAppEducationalService.getTeachers();
    const student = whatsAppEducationalService.getStudentConfig();

    // Match teacher by phone or name
    let matchedTeacher: TeacherPlatformEntry | undefined = teachers.find(
      (t) =>
        t.whatsAppNumber.replace(/[^\d]/g, '') === messagePayload.senderPhone.replace(/[^\d]/g, '') ||
        (t.assistantWhatsAppNumber &&
          t.assistantWhatsAppNumber.replace(/[^\d]/g, '') === messagePayload.senderPhone.replace(/[^\d]/g, ''))
    );

    if (!matchedTeacher && messagePayload.senderName) {
      matchedTeacher = teachers.find((t) =>
        messagePayload.senderName!.toLowerCase().includes(t.name.toLowerCase())
      );
    }

    if (!matchedTeacher && this.config.filterOnlyKnownTeachers) {
      matchedTeacher = teachers[0] || {
        id: 't_general',
        name: messagePayload.senderName || 'مدرس المادة',
        subjectCode: 'CALCULUS',
        subjectNameAr: 'التفاضل والتكامل',
        whatsAppNumber: messagePayload.senderPhone,
        platformName: 'منصة تعليمية',
        groupName: messagePayload.chatGroupName || 'جروب الواتساب',
        studentSubscriptionCode: 'THN-GEN',
        lectureDays: 'أسبوعياً',
        localFolderPath: `${student.defaultStorageDirectory}General/`,
        avatarColor: 'from-blue-600 to-indigo-700',
        materialsCount: 0
      };
    }

    if (!matchedTeacher) return null;

    // Detect URL from text or payload
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const urls = messagePayload.rawText.match(urlRegex) || [];
    const targetUrl = messagePayload.mediaUrl || urls[0];

    if (!targetUrl) return null;

    // Identify URL type and file type
    const lowerUrl = targetUrl.toLowerCase();
    const lowerText = messagePayload.rawText.toLowerCase();

    let detectedUrlType: WhatsAppMessageMetadata['detectedUrlType'] = 'pdf_direct';
    let detectedFileType: DownloadedFileType = 'pdf_sheet';
    let mimeType = 'application/pdf';
    let fileSizeBytes = 14500000;
    let fileSizeHuman = '14.5 MB';

    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerUrl.includes('vimeo.com') || lowerUrl.endsWith('.mp4')) {
      detectedUrlType = 'youtube';
      detectedFileType = 'video_lecture';
      mimeType = 'video/mp4';
      fileSizeBytes = 210000000;
      fileSizeHuman = '210 MB';
    } else if (lowerUrl.includes('drive.google.com')) {
      detectedUrlType = 'google_drive';
      if (lowerText.includes('فيديو') || lowerText.includes('حصة') || lowerText.includes('تسجيل')) {
        detectedFileType = 'video_lecture';
        mimeType = 'video/mp4';
        fileSizeBytes = 180000000;
        fileSizeHuman = '180 MB';
      } else {
        detectedFileType = 'pdf_sheet';
      }
    } else if (lowerText.includes('فويس') || lowerText.includes('ريكورد') || lowerText.includes('كبسولة') || lowerUrl.endsWith('.mp3') || lowerUrl.endsWith('.ogg')) {
      detectedFileType = 'voice_summary';
      mimeType = 'audio/mp3';
      fileSizeBytes = 7200000;
      fileSizeHuman = '7.2 MB';
    } else if (lowerText.includes('إجابة') || lowerText.includes('توزيع درجات') || lowerText.includes('حل نموذج')) {
      detectedFileType = 'model_answer';
      detectedFileType = 'model_answer';
    } else if (lowerText.includes('امتحان') || lowerText.includes('كويز') || lowerText.includes('شامل')) {
      detectedFileType = 'exam_file';
    }

    // Extract title
    let extractedTitle = messagePayload.rawText.split('\n')[0].replace(urlRegex, '').trim();
    if (!extractedTitle || extractedTitle.length < 5) {
      extractedTitle = `${matchedTeacher.subjectNameAr} - مذكرة تدريبات نواتج التعلم`;
    }
    if (extractedTitle.length > 70) {
      extractedTitle = extractedTitle.substring(0, 70) + '...';
    }

    // Build suggested local filename and destination path
    const fileExt = detectedFileType === 'video_lecture' ? 'mp4' : detectedFileType === 'voice_summary' ? 'mp3' : 'pdf';
    const cleanSafeTitle = extractedTitle.replace(/[\/\\:*?"<>|]/g, '').replace(/\s+/g, '_');
    const suggestedFileName = `${cleanSafeTitle}.${fileExt}`;
    const suggestedLocalPath = `${matchedTeacher.localFolderPath}Incoming/${suggestedFileName}`;

    const metadata: WhatsAppMessageMetadata = {
      id: `wa_msg_${Date.now()}`,
      senderPhone: messagePayload.senderPhone,
      senderName: matchedTeacher.name,
      chatGroupName: messagePayload.chatGroupName || matchedTeacher.groupName,
      timestamp: 'الآن',
      rawMessageText: messagePayload.rawText,
      detectedUrl: targetUrl,
      detectedUrlType,
      mimeType,
      fileSizeBytes,
      fileSizeHuman,
      extractedTitle,
      confidenceScore: 0.97,
      matchedTeacherId: matchedTeacher.id,
      matchedTeacherName: matchedTeacher.name,
      matchedSubjectCode: matchedTeacher.subjectCode,
      matchedSubjectNameAr: matchedTeacher.subjectNameAr,
      detectedFileType,
      suggestedFileName,
      suggestedLocalPath,
      curriculumUnitName: 'المحاضرات الدورية والمراجعات',
      targetMonthKey: '2026-10',
      targetMonthName: 'شهر أكتوبر 2026'
    };

    const queueItem: QueuedImportItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      message: metadata,
      status: 'pending',
      detectedAt: new Date().toISOString(),
      autoImported: false
    };

    // Check if auto-import without prompt is active
    if (this.config.autoImportWithoutPrompt) {
      const added = whatsAppEducationalService.addMaterial({
        title: metadata.extractedTitle,
        teacherId: metadata.matchedTeacherId,
        teacherName: metadata.matchedTeacherName,
        subjectCode: metadata.matchedSubjectCode,
        subjectNameAr: metadata.matchedSubjectNameAr,
        fileType: metadata.detectedFileType,
        fileName: metadata.suggestedFileName,
        fileSizeBytes: metadata.fileSizeBytes,
        fileSizeHuman: metadata.fileSizeHuman,
        localFolderPath: metadata.suggestedLocalPath,
        targetMonthKey: metadata.targetMonthKey,
        targetMonthName: metadata.targetMonthName,
        scheduledStudyDate: new Date().toISOString().split('T')[0],
        curriculumUnitName: metadata.curriculumUnitName || 'المحاضرات الدورية',
        downloadDate: new Date().toISOString().split('T')[0],
        isCompleted: false,
        notes: `مستورد تلقائياً عبر رادار الواتساب من رابط: ${metadata.detectedUrl}`,
        fileUrl: metadata.detectedUrl
      });
      queueItem.status = 'imported';
      queueItem.autoImported = true;
      queueItem.importedAt = new Date().toISOString();
      queueItem.importedMaterialId = added.id;
    }

    this.queue = [queueItem, ...this.queue];
    this.config.totalDetectedCount += 1;
    this.saveQueue();
    this.saveConfig();

    if (this.config.notifyOnDetection) {
      resilientAudio.playSuccessChime();
    }

    this.notify();
    return queueItem;
  }

  /**
   * Simulates an incoming teacher WhatsApp Web message with shared PDF or video link
   */
  public simulateIncomingTeacherMessage(teacherId?: string): QueuedImportItem {
    const teachers = whatsAppEducationalService.getTeachers();
    const targetTeacher = teacherId ? teachers.find((t) => t.id === teacherId) || teachers[0] : teachers[Math.floor(Math.random() * teachers.length)];

    const samples = [
      {
        rawText: `مذكرة أفكار الامتحان وباريم الأسئلة المقالية في ${targetTeacher.subjectNameAr} - مرفق الشيت بصيغة PDF: https://drive.google.com/file/d/1_exam_sheet_${Date.now()}/view`,
        mediaUrl: `https://drive.google.com/file/d/1_exam_sheet_${Date.now()}/view`
      },
      {
        rawText: `فيديو شرح التريكات المستعصية وحل أسئلة المنصة: https://youtu.be/lecture_tips_${Date.now().toString().slice(-4)}`,
        mediaUrl: `https://youtu.be/lecture_tips_${Date.now().toString().slice(-4)}`
      },
      {
        rawText: `شيت الواجب الشامل للأسبوع الجاري مع بنك الأسئلة المعتمد: https://media.thanaweya.edu.eg/sheets/hw_${Date.now().toString().slice(-4)}.pdf`,
        mediaUrl: `https://media.thanaweya.edu.eg/sheets/hw_${Date.now().toString().slice(-4)}.pdf`
      }
    ];

    const pick = samples[Math.floor(Math.random() * samples.length)];

    const queued = this.inspectAndQueueMessage({
      senderPhone: targetTeacher.whatsAppNumber,
      senderName: targetTeacher.name,
      chatGroupName: targetTeacher.groupName,
      rawText: pick.rawText,
      mediaUrl: pick.mediaUrl
    });

    return queued!;
  }

  // --- Queue Actions ---

  /**
   * Imports a single queued item into the student's media library
   */
  public importItem(queueId: string): DownloadedMediaMaterial | null {
    const index = this.queue.findIndex((q) => q.id === queueId);
    if (index === -1) return null;

    const item = this.queue[index];
    if (item.status === 'imported') return null;

    const meta = item.message;
    const newMaterial = whatsAppEducationalService.addMaterial({
      title: meta.extractedTitle,
      teacherId: meta.matchedTeacherId,
      teacherName: meta.matchedTeacherName,
      subjectCode: meta.matchedSubjectCode,
      subjectNameAr: meta.matchedSubjectNameAr,
      fileType: meta.detectedFileType,
      fileName: meta.suggestedFileName,
      fileSizeBytes: meta.fileSizeBytes,
      fileSizeHuman: meta.fileSizeHuman,
      localFolderPath: meta.suggestedLocalPath,
      targetMonthKey: meta.targetMonthKey,
      targetMonthName: meta.targetMonthName,
      scheduledStudyDate: new Date().toISOString().split('T')[0],
      curriculumUnitName: meta.curriculumUnitName || 'المحاضرات الدورية',
      downloadDate: new Date().toISOString().split('T')[0],
      isCompleted: false,
      notes: `تم الاستيراد والمزامنة عبر رادار الواتساب من رابط: ${meta.detectedUrl}`,
      fileUrl: meta.detectedUrl
    });

    item.status = 'imported';
    item.importedAt = new Date().toISOString();
    item.importedMaterialId = newMaterial.id;

    this.saveQueue();
    resilientAudio.playSuccessChime();
    this.notify();
    return newMaterial;
  }

  /**
   * Imports all pending queued items at once
   */
  public importAllPending(): number {
    const pendingItems = this.queue.filter((q) => q.status === 'pending');
    let importedCount = 0;

    pendingItems.forEach((item) => {
      const meta = item.message;
      const newMaterial = whatsAppEducationalService.addMaterial({
        title: meta.extractedTitle,
        teacherId: meta.matchedTeacherId,
        teacherName: meta.matchedTeacherName,
        subjectCode: meta.matchedSubjectCode,
        subjectNameAr: meta.matchedSubjectNameAr,
        fileType: meta.detectedFileType,
        fileName: meta.suggestedFileName,
        fileSizeBytes: meta.fileSizeBytes,
        fileSizeHuman: meta.fileSizeHuman,
        localFolderPath: meta.suggestedLocalPath,
        targetMonthKey: meta.targetMonthKey,
        targetMonthName: meta.targetMonthName,
        scheduledStudyDate: new Date().toISOString().split('T')[0],
        curriculumUnitName: meta.curriculumUnitName || 'المحاضرات الدورية',
        downloadDate: new Date().toISOString().split('T')[0],
        isCompleted: false,
        notes: `استيراد دفعة واحدة عبر رادار الواتساب - الرابط: ${meta.detectedUrl}`,
        fileUrl: meta.detectedUrl
      });

      item.status = 'imported';
      item.importedAt = new Date().toISOString();
      item.importedMaterialId = newMaterial.id;
      importedCount += 1;
    });

    if (importedCount > 0) {
      this.saveQueue();
      resilientAudio.playSuccessChime();
      this.notify();
    }

    return importedCount;
  }

  /**
   * Dismisses a queued item without adding it to the library
   */
  public dismissItem(queueId: string): void {
    const item = this.queue.find((q) => q.id === queueId);
    if (!item) return;

    item.status = 'dismissed';
    this.saveQueue();
    resilientAudio.playClickSound();
    this.notify();
  }

  /**
   * Deletes a queued item permanently from history
   */
  public removeQueueItem(queueId: string): void {
    this.queue = this.queue.filter((q) => q.id !== queueId);
    this.saveQueue();
    this.notify();
  }

  /**
   * Clears dismissed and imported history
   */
  public clearCompletedHistory(): void {
    this.queue = this.queue.filter((q) => q.status === 'pending');
    this.saveQueue();
    this.notify();
  }

  // --- Local Storage Helpers ---

  private loadConfig(): WhatsAppPollingConfig {
    try {
      const raw = localStorage.getItem(POLLING_CONFIG_KEY);
      if (raw) return { ...INITIAL_CONFIG, ...JSON.parse(raw) };
    } catch (e) {
      console.warn('Error loading polling config:', e);
    }
    return INITIAL_CONFIG;
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(POLLING_CONFIG_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Error saving polling config:', e);
    }
  }

  private loadQueue(): QueuedImportItem[] {
    try {
      const raw = localStorage.getItem(IMPORT_QUEUE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error loading import queue:', e);
    }
    return INITIAL_QUEUE;
  }

  private saveQueue(): void {
    try {
      localStorage.setItem(IMPORT_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.warn('Error saving import queue:', e);
    }
  }
}

export const whatsAppPollingService = new WhatsAppPollingService();
export default whatsAppPollingService;

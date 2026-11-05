export type UserRole = 'student' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  seatingNumber?: string; // رقم الجلوس
  school?: string;
  governorate?: string;
  targetFaculty?: string; // e.g. كلية الهندسة - جامعة القاهرة
  dailyStreak: number;
  disciplineScore: number; // e.g. 94%
  preferredStudyHours: number;
  avatarUrl?: string;
}

export type SlotType = 'study' | 'practice' | 'revision' | 'break';
export type PriorityLevel = 'critical' | 'high' | 'medium';

export interface DailyScheduleSlot {
  id: string;
  timeStart: string; // e.g. "16:00"
  timeEnd: string;   // e.g. "17:30"
  subjectCode: string;
  subjectNameAr: string;
  topic: string;
  slotType: SlotType;
  priority: PriorityLevel;
  isCompleted: boolean;
  notes?: string;
  examEssentialKey?: string; // Link to practice notes; not evidence of exam frequency
  aiPriorityReason?: string; // Suggested study note, not a statistical exam prediction
}

export type MediaFileType = 'video' | 'audio' | 'printable_doc';
export type ContentSourceStatus = 'unverified' | 'official_source_verified' | 'third_party_source_verified';

export interface CurriculumSourceReference {
  id: string;
  title: string;
  url: string;
  publisher: string;
  yearScope: string;
  limitation: string;
}

export interface MultimediaLibraryItem {
  id: string;
  subjectCode: string;
  subjectNameAr: string;
  title: string;
  description: string;
  fileType: MediaFileType;
  url: string; // Empty when no source or media URL has been verified.
  sourceName: string;
  rating?: number; // Show only when backed by a real, documented rating source.
  durationOrPages: string; // e.g. "24 دقيقة" or "4 صفحات PDF"
  isPrintable?: boolean;
  printableCheatSheet?: string[]; // Bulleted high-yield formulas & summaries
  sourceStatus: ContentSourceStatus;
  uploadDate?: string;
  unitId?: string; // Linked curriculum unit
}

export interface ExamEssential {
  id: string;
  subjectCode: string;
  subjectNameAr: string;
  topic: string;
  importanceRating: number; // Use 0 when no documented exam-frequency evidence exists
  pastExamOccurrences: string[]; // Populate only with a verified exam paper and year
  coreConcept: string; // القاعدة الذهبية
  examTrapWarning: string; // الخدعة التي يقع فيها الطلاب
  sampleExamQuestion: string;
  stepByStepSolution: string;
}

export interface SubjectProgress {
  subjectCode: string;
  nameAr: string;
  category: string;
  totalChapters: number;
  completedChapters: number;
  quizzesTaken: number;
  averageScore: number;
  masteryPercentage: number;
  colorHex: string;
  lastStudiedDate: string;
  learningOutcomesTotal: number;
  learningOutcomesMastered: number;
}

export interface DisciplineMetrics {
  totalStudyMinutesToday: number;
  targetStudyMinutesToday: number;
  weeklyAttendancePercent: number;
  homeworkCompleted: number;
  homeworkTotal: number;
  currentStreakDays: number;
  bestStreakDays: number;
  disciplineScore: number; // 0-100
  badgesEarned: Array<{ title: string; icon: string; desc: string }>;
}

export interface BreakGuidance {
  id: string;
  title: string;
  scientificMethod: string; // e.g. "تقنية فاينمان Feynman" or "الاستدعاء النشط Active Recall"
  motivationalAdvice: string;
  recommendedPhysicalAction: string;
  durationMinutes: number;
}

export interface ScoutedResourceCandidate {
  id: string;
  title: string;
  platform: 'moe.gov.eg' | 'nagwa.com' | 'ekb.eg' | 'al-azhar';
  url: string;
  summary: string;
  suggestedSubject: string;
  dateDiscovered: string;
  status: 'pending' | 'approved' | 'rejected';
  fileType: MediaFileType;
}

// ==========================================
// NEW ENHANCED FULL CURRICULUM & SKIP TYPES
// ==========================================

export type UnitStudyStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped_by_exam';

export interface PracticeQuestion {
  id: string;
  questionNumber: number;
  questionText: string;
  options: Array<{ key: string; text: string }>;
  correctKey: string;
  explanation: string;
  difficulty: 'A' | 'B' | 'C'; // المستويات الوزارية
  targetedLearningOutcome: string;
  examSource?: string; // e.g. "ثانوية عامة 2023 دور أول"
}

export interface CurriculumUnit {
  id: string;
  unitNumber: number;
  subjectCode: string;
  subjectNameAr: string;
  title: string;
  description: string;
  learningOutcomes: string[];
  status: UnitStudyStatus;
  skipExamScore?: number; // Score achieved in skip assessment if taken
  skipAssessmentReady?: boolean; // Set only after teacher review confirms sufficient topic coverage
  lastAssessmentDate?: string;
  practiceQuestions: PracticeQuestion[];
  studyNotesSummary: string[];
}

export interface MonthlyExam {
  id: string;
  monthName: string; // e.g. "اختبار شهر أكتوبر 2026", "اختبار نصف العام يناير 2027"
  targetMonth: string; // "2026-10", "2026-11", "2027-01", etc.
  subjectCode: string;
  subjectNameAr: string;
  title: string;
  durationMinutes: number;
  totalMarks: number;
  questions: PracticeQuestion[];
  isCompleted?: boolean;
  scoreAwarded?: number;
}

export interface SkipEvaluationResult {
  unitId: string;
  unitTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  verdict: 'mastered_skip_approved' | 'partial_mastery_review_weak_points' | 'needs_full_study' | 'diagnostic_only';
  verdictTitle: string;
  weakTopics: string[];
  masteredTopics: string[];
  tailoredAdvice: string;
  nextRecommendedAction: string;
}

// ==========================================
// ARCHITECTURAL V2 ADDITIONS:
// Heatmap, Math OCR, Dynamic Re-scheduling, Offline Sync
// ==========================================

export interface TopicHeatmapData {
  topicId: string;
  topicName: string;
  subjectCode: string;
  subjectNameAr: string;
  masteryScore: number; // 0 - 100%
  difficultyLevel: 'A' | 'B' | 'C';
  errorFrequency: number;
  predictedExamWeight: number; // Percentage in total exam
  weaknessStatus: 'danger' | 'warning' | 'mastered';
  historicalExamAppearances: string[];
  remedialConcept: string;
}

export interface ScannedMathProblem {
  id: string;
  imageUrl: string;
  extractedLatex: string;
  plainText: string;
  confidence: number;
  identifiedTopic: string;
  scaffoldingSteps: Array<{
    stepNumber: number;
    title: string;
    guidingQuestion: string;
    hintFormulaLatex: string;
    learningHint: string;
  }>;
  finalAnswerVerification: string;
}

export interface DynamicRescheduleResult {
  originalHours: number;
  rescheduledHours: number;
  slotsModified: number;
  redistributedSlots: DailyScheduleSlot[];
  recoveryStrategy: string;
  appliedAt: string;
}

export interface OfflineSyncState {
  isOnline: boolean;
  pendingSyncCount: number;
  cachedResourcesCount: number;
  lastSyncTimestamp: string;
}

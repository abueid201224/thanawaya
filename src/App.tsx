import React, { useState } from 'react';
import {
  Calendar,
  BookOpen,
  MessageSquare,
  Award,
  ShieldCheck,
  Layers,
  FileCode,
  CheckCircle2,
  Cpu,
  Video,
  X,
  FastForward,
  FileCheck2,
  Printer
} from 'lucide-react';

import {
  UserProfile,
  UserRole,
  DailyScheduleSlot,
  MultimediaLibraryItem,
  SubjectProgress,
  DisciplineMetrics,
  ScoutedOfficialResource,
  CurriculumUnit,
  MonthlyExam
} from './types';

import {
  initialUser,
  initialDailySchedule,
  initialExamEssentials,
  initialMultimediaLibrary,
  initialSubjectProgress,
  initialDisciplineMetrics,
  initialScoutedResources
} from './data/curriculumData';

import {
  initialCurriculumUnits,
  initialMonthlyExams
} from './data/fullCurriculumData';

import { Navbar } from './components/Navbar';
import { SidebarNav, ActiveNavService } from './components/SidebarNav';
import { DailyPlannerView } from './components/DailyPlannerView';
import { FullCurriculumExplorer } from './components/FullCurriculumExplorer';
import { SkipExamEngine } from './components/SkipExamEngine';
import { MonthlyExamsView } from './components/MonthlyExamsView';
import { HeatmapAnalyticsView } from './components/HeatmapAnalyticsView';
import { OfficialConceptBookletView } from './components/OfficialConceptBookletView';
import { HandwrittenEssayGraderView } from './components/HandwrittenEssayGraderView';
import { InteractiveGrapherView } from './components/InteractiveGrapherView';
import { SubjectLibraryView } from './components/SubjectLibraryView';
import { CodingBuddyAssistantView } from './components/CodingBuddyAssistantView';
import { WhatsAppEducationalHubView } from './components/WhatsAppEducationalHubView';
import { AiTutorScheduleView } from './components/AiTutorScheduleView';
import { ProgressDisciplineView } from './components/ProgressDisciplineView';
import { BreakMotivationModal } from './components/BreakMotivationModal';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { OfflineSyncModal } from './components/OfflineSyncModal';
import { ResilientMediaModal } from './components/ResilientMediaModal';
import { UniversalDocumentExportModal } from './components/UniversalDocumentExportModal';
import { ServiceDiagnosticsModal } from './components/ServiceDiagnosticsModal';
import { SecureApiKeyModal } from './components/SecureApiKeyModal';
import { PracticeAndMistakesView } from './components/PracticeAndMistakesView';
import { SplashLoader } from './components/SplashLoader';
import { nativeDesktop } from './services/nativeDesktopBridge';
import { authService } from './services/authService';
import { getReviewedExamsForStudent, getReviewedUnitsForStudent } from './services/contentGate';
import { studyPersistenceService } from './services/studyPersistenceService';
import { hybridSyncService } from './services/hybridSyncService';

const STORAGE_KEYS = {
  schedule: 'thanaweya_schedule_v1',
  units: 'thanaweya_units_state_v1',
  exams: 'thanaweya_exams_state_v1',
  progress: 'thanaweya_subject_progress_v1',
  library: 'thanaweya_library_items_v1',
  scouted: 'thanaweya_scouted_resources_v1'
};

function loadJsonState<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  // Navigation: Active Service Only (No clutter)
  const [activeService, setActiveService] = useState<ActiveNavService>('planner');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // App State
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [verifiedAdmin, setVerifiedAdmin] = useState<boolean>(false);
  const [schedule, setSchedule] = useState<DailyScheduleSlot[]>(() =>
    loadJsonState<DailyScheduleSlot[]>(STORAGE_KEYS.schedule, initialDailySchedule)
  );
  const [activeSlotForTutor, setActiveSlotForTutor] = useState<DailyScheduleSlot | null>(schedule[0] || null);
  const [libraryItems, setLibraryItems] = useState<MultimediaLibraryItem[]>(() =>
    loadJsonState<MultimediaLibraryItem[]>(STORAGE_KEYS.library, initialMultimediaLibrary)
  );
  const [curriculumUnits, setCurriculumUnits] = useState<CurriculumUnit[]>(() => {
    const saved = loadJsonState<Array<{ id: string; status: CurriculumUnit['status']; skipExamScore?: number; lastAssessmentDate?: string; localResourcesCount: number; lastUpdatedDate?: string }>>(STORAGE_KEYS.units, []);
    if (!Array.isArray(saved) || saved.length === 0) return initialCurriculumUnits;
    const byId = new Map(saved.map((item) => [item.id, item]));
    return initialCurriculumUnits.map((unit) => {
      const match = byId.get(unit.id);
      return match
        ? {
            ...unit,
            status: match.status,
            skipExamScore: match.skipExamScore,
            lastAssessmentDate: match.lastAssessmentDate,
            localResourcesCount: match.localResourcesCount,
            lastUpdatedDate: match.lastUpdatedDate ?? unit.lastUpdatedDate
          }
        : unit;
    });
  });
  const [monthlyExams, setMonthlyExams] = useState<MonthlyExam[]>(() => {
    const saved = loadJsonState<Array<{ id: string; isCompleted: boolean; scoreAwarded?: number }>>(STORAGE_KEYS.exams, []);
    if (!Array.isArray(saved) || saved.length === 0) return initialMonthlyExams;
    const byId = new Map(saved.map((item) => [item.id, item]));
    return initialMonthlyExams.map((exam) => {
      const match = byId.get(exam.id);
      return match ? { ...exam, isCompleted: match.isCompleted, scoreAwarded: match.scoreAwarded } : exam;
    });
  });
  const [subjectProgressList, setSubjectProgressList] = useState<SubjectProgress[]>(() =>
    loadJsonState<SubjectProgress[]>(STORAGE_KEYS.progress, initialSubjectProgress)
  );
  const [disciplineMetrics] = useState<DisciplineMetrics>(initialDisciplineMetrics);
  const [scoutedResources, setScoutedResources] = useState<ScoutedOfficialResource[]>(() =>
    loadJsonState<ScoutedOfficialResource[]>(STORAGE_KEYS.scouted, initialScoutedResources)
  );

  // Skip assessment target
  const [targetSkipUnit, setTargetSkipUnit] = useState<CurriculumUnit | null>(null);

  // Modals & Diagnostic/Export Suites
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
  const [isOfflineSyncModalOpen, setIsOfflineSyncModalOpen] = useState(false);
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isDocumentExportModalOpen, setIsDocumentExportModalOpen] = useState(false);
  const [selectedExportDocId, setSelectedExportDocId] = useState<string | undefined>(undefined);
  const [activeVideoModal, setActiveVideoModal] = useState<MultimediaLibraryItem | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Persist mutable curriculum/schedule/progress slices locally
  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.schedule, JSON.stringify(schedule));
    } catch { /* ignore quota error */ }
  }, [schedule]);

  React.useEffect(() => {
    try {
      const compactUnits = curriculumUnits.map((u) => ({
        id: u.id,
        status: u.status,
        skipExamScore: u.skipExamScore,
        lastAssessmentDate: u.lastAssessmentDate,
        localResourcesCount: u.localResourcesCount,
        lastUpdatedDate: u.lastUpdatedDate
      }));
      window.localStorage.setItem(STORAGE_KEYS.units, JSON.stringify(compactUnits));
    } catch { /* ignore */ }
  }, [curriculumUnits]);

  React.useEffect(() => {
    try {
      const compactExams = monthlyExams.map((e) => ({
        id: e.id,
        isCompleted: e.isCompleted,
        scoreAwarded: e.scoreAwarded
      }));
      window.localStorage.setItem(STORAGE_KEYS.exams, JSON.stringify(compactExams));
    } catch { /* ignore */ }
  }, [monthlyExams]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(subjectProgressList));
    } catch { /* ignore */ }
  }, [subjectProgressList]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.library, JSON.stringify(libraryItems));
    } catch { /* ignore */ }
  }, [libraryItems]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.scouted, JSON.stringify(scoutedResources));
    } catch { /* ignore */ }
  }, [scoutedResources]);

  // Handlers
  const handleSwitchRole = (newRole: UserRole) => {
    // Only an authenticated server-verified admin can toggle between admin and student preview
    if (newRole === 'admin' && !verifiedAdmin) {
      return;
    }
    setUser((prev) => ({ ...prev, role: newRole }));
  };

  const handleUpdateSchedule = (newSchedule: DailyScheduleSlot[]) => {
    setSchedule(newSchedule);
    studyPersistenceService.mirrorScheduleToStore(newSchedule);
  };

  const handleSelectSlotForTutor = (slot: DailyScheduleSlot) => {
    setActiveSlotForTutor(slot);
    setActiveService('tutor');
  };

  const handleOpenSkipExam = (unit: CurriculumUnit) => {
    setTargetSkipUnit(unit);
    setActiveService('skip_exam');
  };

  const handleConfirmSkipUnit = (unitId: string, score: number) => {
    // 1. Update curriculum units status
    setCurriculumUnits((prev) =>
      prev.map((u) =>
        u.id === unitId
          ? {
              ...u,
              status: 'skipped_by_exam',
              skipExamScore: score,
              lastAssessmentDate: 'اليوم'
            }
          : u
      )
    );

    // 2. Award progress to matching subject
    const skippedUnit = curriculumUnits.find((u) => u.id === unitId);
    if (skippedUnit) {
      setSubjectProgressList((prev) =>
        prev.map((sub) => {
          if (sub.subjectCode === skippedUnit.subjectCode) {
            const nextCompleted = Math.min(sub.totalChapters, sub.completedChapters + 1);
            return {
              ...sub,
              completedChapters: nextCompleted,
              masteryPercentage: Math.round((nextCompleted / sub.totalChapters) * 100),
              learningOutcomesMastered: Math.min(
                sub.learningOutcomesTotal,
                sub.learningOutcomesMastered + 3
              )
            };
          }
          return sub;
        })
      );
    }
  };

  const handleUpdateUnitResources = (unitId: string) => {
    // Increment local resources count & sync date
    setCurriculumUnits((prev) =>
      prev.map((u) =>
        u.id === unitId
          ? {
              ...u,
              localResourcesCount: u.localResourcesCount + 2,
              lastUpdatedDate: new Date().toISOString().split('T')[0]
            }
          : u
      )
    );
  };

  const handleCompleteMonthlyExam = (examId: string, score: number) => {
    setMonthlyExams((prev) =>
      prev.map((e) =>
        e.id === examId
          ? {
              ...e,
              isCompleted: true,
              scoreAwarded: score
            }
          : e
      )
    );
  };

  const handleUpdateSubjectProgress = (
    subjectCode: string,
    chaptersCompleted: number,
    score: number
  ) => {
    setSubjectProgressList((prev) =>
      prev.map((sub) =>
        sub.subjectCode === subjectCode
          ? {
              ...sub,
              completedChapters: chaptersCompleted,
              averageScore: score,
              masteryPercentage: Math.round((chaptersCompleted / sub.totalChapters) * 100),
              lastStudiedDate: 'اليوم'
            }
          : sub
      )
    );
  };

  const handleApproveResource = (resourceId: string) => {
    const resource = scoutedResources.find((r) => r.id === resourceId);
    if (!resource) return;

    setScoutedResources((prev) =>
      prev.map((r) => (r.id === resourceId ? { ...r, status: 'approved' } : r))
    );

    // Merge into local library
    const newItem: MultimediaLibraryItem = {
      id: `lib_${Date.now()}`,
      subjectCode: 'CALCULUS',
      subjectNameAr: resource.suggestedSubject,
      title: resource.title,
      description: resource.summary,
      fileType: resource.fileType,
      url: resource.url,
      sourceName: resource.platform,
      rating: resource.ratingScore,
      durationOrPages: 'معتمد وزارياً',
      isVerifiedByMinistry: true,
      uploadDate: new Date().toISOString().split('T')[0],
      isPrintable: resource.fileType === 'printable_doc',
      printableCheatSheet: [
        'وثيقة ونماذج امتحانية معتمدة من بوابة وزارة التربية والتعليم.',
        'نواتج تعلم مطابقة لمواصفات الورقة الامتحانية الحديثة.'
      ]
    };

    setLibraryItems((prev) => [newItem, ...prev]);
  };

  const handleRejectResource = (resourceId: string) => {
    setScoutedResources((prev) =>
      prev.map((r) => (r.id === resourceId ? { ...r, status: 'rejected' } : r))
    );
  };

  const handleAddNewLibraryItem = (newItem: MultimediaLibraryItem) => {
    setLibraryItems((prev) => [newItem, ...prev]);
  };

  const handleTargetTopicForStudy = (topicName: string, subjectCode: string) => {
    const matchingSubject = subjectProgressList.find((s) => s.subjectCode === subjectCode);
    const remedialSlot: DailyScheduleSlot = {
      id: `remedial_${Date.now()}`,
      timeStart: '18:00',
      timeEnd: '19:15',
      subjectCode,
      subjectNameAr: matchingSubject?.nameAr || 'الرياضيات',
      topic: topicName,
      slotType: 'study',
      priority: 'critical',
      isCompleted: false,
      aiPriorityReason: 'حصة علاجية بؤرية ناتجة عن تشخيص خريطة الحرارة (Heatmap Analytics).'
    };
    setActiveSlotForTutor(remedialSlot);
    setActiveService('tutor');
  };

  const handleAddToDailySchedule = (slot: DailyScheduleSlot) => {
    setSchedule((prev) => {
      const next = [slot, ...prev];
      studyPersistenceService.mirrorScheduleToStore(next);
      return next;
    });
  };

  // Register PWA Service Worker (production web runtime only, skipped in dev/preview & Electron desktop)
  React.useEffect(() => {
    if (
      import.meta.env.PROD &&
      !nativeDesktop.isNativeDesktop &&
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    }
  }, []);

  React.useEffect(() => {
    // Initial Supabase Auth session bootstrap (No screen flicker)
    authService.getInitialSession().then(({ user: authUser }) => {
      if (authUser) {
        setUser(authUser);
        setVerifiedAdmin(authUser.role === 'admin');
      }
    }).catch(() => {
      // offline fallback
    }).finally(() => {
      setIsCheckingSession(false);
    });

    // Subscribe to session transitions (reset to default profile on sign-out)
    const unsubAuth = authService.onAuthStateChange((authUser) => {
      if (authUser) {
        setUser(authUser);
        setVerifiedAdmin(authUser.role === 'admin');
      } else {
        setUser(initialUser);
        setVerifiedAdmin(false);
      }
    });

    // Start Local-First Hybrid Sync background worker & initial store hydration
    const stopSyncWorker = hybridSyncService.startBackgroundWorker(45_000);
    void studyPersistenceService
      .hydrateFromStore()
      .then(() => hybridSyncService.syncNow())
      .catch(() => {});

    return () => {
      unsubAuth();
      stopSyncWorker();
    };
  }, []);

  React.useEffect(() => {
    // First run auto-open: if Gemini API key not configured, guide student to settings
    nativeDesktop.getApiKeyStatus().then((status) => {
      if (!status.isConfigured) {
        setIsApiKeyModalOpen(true);
      }
    }).catch(() => {});
  }, []);

  // Global Windows Desktop Keyboard Shortcuts (Ctrl+P, Ctrl+F, Ctrl+,, Esc)
  React.useEffect(() => {
    const triggerEscape = () => {
      setIsDocumentExportModalOpen(false);
      setIsDiagnosticsModalOpen(false);
      setIsApiKeyModalOpen(false);
      setActiveVideoModal(null);
      setIsBreakModalOpen(false);
      setIsAuthModalOpen(false);
      setIsOfflineSyncModalOpen(false);
      window.dispatchEvent(new CustomEvent('close-all-modals'));
    };

    const triggerPrint = () => {
      if (activeService === 'concepts_booklet') {
        window.dispatchEvent(new CustomEvent('open-booklet-print-modal'));
      } else {
        const docMapping: Record<string, string> = {
          planner: 'doc_schedule_a4',
          curriculum: 'doc_calc_a4',
          skip_exam: 'doc_calc_a4',
          monthly_exams: 'doc_exam_essentials_a4',
          heatmap: 'doc_exam_essentials_a4',
          essay_grader: 'doc_essay_rubric_a4',
          grapher: 'doc_calc_a4',
          library: 'doc_calc_a4',
          coding_buddy: 'doc_coding_a4',
          whatsapp_hub: 'doc_schedule_a4',
          tutor: 'doc_exam_essentials_a4',
          progress: 'doc_schedule_a4',
          admin: 'doc_exam_essentials_a4'
        };
        setSelectedExportDocId(docMapping[activeService] || 'doc_calc_a4');
        setIsDocumentExportModalOpen(true);
      }
    };

    const triggerSearch = () => {
      const searchInput = document.querySelector<HTMLInputElement>(
        '#contextual-search-input, [data-search-input="true"]'
      );
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      } else {
        setActiveService('library');
        setTimeout(() => {
          const input = document.querySelector<HTMLInputElement>(
            '#contextual-search-input, [data-search-input="true"]'
          );
          if (input) {
            input.focus();
            input.select();
          }
        }, 150);
      }
    };

    const triggerSettings = () => {
      setIsApiKeyModalOpen(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Esc: Closes any open modal dialog
      if (e.key === 'Escape') {
        triggerEscape();
        return;
      }

      // 2. Ctrl + P: Triggers BookletPrintModal or direct PDF export for current view
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        triggerPrint();
        return;
      }

      // 3. Ctrl + F: Focuses contextual search bar across subject libraries
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        triggerSearch();
        return;
      }

      // 4. Ctrl + ,: Opens Gemini API & Model Settings Modal
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        triggerSettings();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Bind native desktop IPC events when running inside Electron
    const unsubPrint = nativeDesktop.onShortcut('print', triggerPrint);
    const unsubSearch = nativeDesktop.onShortcut('search', triggerSearch);
    const unsubEscape = nativeDesktop.onShortcut('escape', triggerEscape);
    const unsubSettings = nativeDesktop.onShortcut('settings', triggerSettings);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unsubPrint();
      unsubSearch();
      unsubEscape();
      unsubSettings();
    };
  }, [activeService]);

  const pendingScoutCount = scoutedResources.filter((r) => r.status === 'pending').length;

  if (isCheckingSession) {
    return <SplashLoader />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans" dir="rtl">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSwitchRole={handleSwitchRole}
        activeTab={activeService}
        onOpenPracticeHub={() => setActiveService('practice_hub')}
        onOpenDiagnostics={() => setIsDiagnosticsModalOpen(true)}
        onOpenApiKeySettings={() => setIsApiKeyModalOpen(true)}
        onOpenDocumentExport={() => {
          setSelectedExportDocId(undefined);
          setIsDocumentExportModalOpen(true);
        }}
      />

      {/* Main Workspace: Sidebar + Single Active Service Canvas */}
      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible Services Sidebar */}
        <SidebarNav
          activeService={activeService}
          onSelectService={(srv) => setActiveService(srv)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          userRole={user.role}
          pendingScoutCount={pendingScoutCount}
          onOpenOfflineSync={() => setIsOfflineSyncModalOpen(true)}
          onOpenDiagnostics={() => setIsDiagnosticsModalOpen(true)}
          onOpenDocumentExport={() => {
            setSelectedExportDocId(undefined);
            setIsDocumentExportModalOpen(true);
          }}
        />

        {/* Focused Main Stage: ONLY THE ACTIVE SERVICE IS DISPLAYED */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full transition-all">
          {/* SERVICE 1: DAILY STUDY PLANNER */}
          {activeService === 'planner' && (
            <DailyPlannerView
              schedule={schedule}
              onUpdateSchedule={handleUpdateSchedule}
              onSelectSlotForTutor={handleSelectSlotForTutor}
              onOpenBreakGuide={() => setIsBreakModalOpen(true)}
            />
          )}

          {/* SERVICE 1.5: PRACTICE LOOP, MISTAKE NOTEBOOK & SPACED REPETITION */}
          {activeService === 'practice_hub' && (
            <PracticeAndMistakesView units={curriculumUnits} />
          )}

          {/* SERVICE 2: FULL CURRICULUM & PRACTICE QUESTIONS */}
          {activeService === 'curriculum' && (
            <FullCurriculumExplorer
              units={getReviewedUnitsForStudent(curriculumUnits)}
              onOpenSkipExam={handleOpenSkipExam}
              onUpdateUnitResources={handleUpdateUnitResources}
            />
          )}

          {/* SERVICE 3: SKIP DIAGNOSTIC EXAM ENGINE */}
          {activeService === 'skip_exam' && (
            <SkipExamEngine
              units={getReviewedUnitsForStudent(curriculumUnits)}
              initialSelectedUnit={targetSkipUnit}
              onConfirmSkipUnit={handleConfirmSkipUnit}
              onNavigateToSchedule={() => setActiveService('planner')}
            />
          )}

          {/* SERVICE 4: MONTHLY & MILESTONE EXAMS */}
          {activeService === 'monthly_exams' && (
            <MonthlyExamsView
              exams={getReviewedExamsForStudent(monthlyExams)}
              onCompleteExam={handleCompleteMonthlyExam}
            />
          )}

          {/* SERVICE 4.5: HEATMAP ANALYTICS & PREDICTIVE ASSESSMENT ENGINE */}
          {activeService === 'heatmap' && (
            <HeatmapAnalyticsView
              curriculumUnits={curriculumUnits}
              monthlyExams={monthlyExams}
              onTargetTopicForStudy={handleTargetTopicForStudy}
            />
          )}

          {/* SERVICE 4.6: OFFICIAL MINISTRY CONCEPT BOOKLET (كتيب المفاهيم الرسمي) */}
          {activeService === 'concepts_booklet' && (
            <OfficialConceptBookletView />
          )}

          {/* SERVICE 4.7: HANDWRITTEN ESSAY VISION GRADER (مصحح المقالي وخط اليد) */}
          {activeService === 'essay_grader' && (
            <HandwrittenEssayGraderView />
          )}

          {/* SERVICE 4.8: INTERACTIVE MATH & PHYSICS CANVAS (الراسم الهندسي والبياني) */}
          {activeService === 'grapher' && (
            <InteractiveGrapherView />
          )}

          {/* SERVICE 5: MULTIMEDIA & PRINTABLE A4 SHEETS */}
          {activeService === 'library' && (
            <SubjectLibraryView
              items={libraryItems}
              onOpenVideo={(item) => setActiveVideoModal(item)}
              onOpenDiagnostics={() => setIsDiagnosticsModalOpen(true)}
              onOpenDocumentExport={(code) => {
                setSelectedExportDocId(code ? `doc_${code.toLowerCase().slice(0, 4)}_a4` : undefined);
                setIsDocumentExportModalOpen(true);
              }}
            />
          )}

          {/* SERVICE 5.5: EDUTAINMENT CODING BUDDY & TRICKS ASSISTANT */}
          {activeService === 'coding_buddy' && (
            <CodingBuddyAssistantView
              onNavigateToService={(service) => setActiveService(service)}
            />
          )}

          {/* SERVICE 5.8: WHATSAPP EDUCATIONAL HUB & DOWNLOADED MEDIA LIBRARY */}
          {activeService === 'whatsapp_hub' && (
            <WhatsAppEducationalHubView
              onAddToDailySchedule={handleAddToDailySchedule}
              onOpenDocumentExport={(code) => {
                setSelectedExportDocId(code ? `doc_${code.toLowerCase().slice(0, 4)}_a4` : 'doc_schedule_a4');
                setIsDocumentExportModalOpen(true);
              }}
            />
          )}

          {/* SERVICE 6: AI TUTOR WITH EXAM ESSENTIALS */}
          {activeService === 'tutor' && (
            <AiTutorScheduleView
              activeSlot={activeSlotForTutor}
              examEssentials={initialExamEssentials}
              onOpenBreakGuide={() => setIsBreakModalOpen(true)}
            />
          )}

          {/* SERVICE 7: PROGRESS & DISCIPLINE TRACKER */}
          {activeService === 'progress' && (
            <ProgressDisciplineView
              progressList={subjectProgressList}
              metrics={disciplineMetrics}
              onUpdateSubjectProgress={handleUpdateSubjectProgress}
            />
          )}

          {/* SERVICE 8: ADMIN & AI SCOUT SUPERVISOR CONTROL */}
          {activeService === 'admin' && (
            <AdminPanel
              scoutedResources={scoutedResources}
              onApproveResource={handleApproveResource}
              onRejectResource={handleRejectResource}
              onAddNewLibraryItem={handleAddNewLibraryItem}
              userRole={user.role}
            />
          )}
        </main>
      </div>

      {/* Resilient Media Modal with Multi-tier Fallbacks (Direct Video, YouTube Embed, Audio & Interactive Capsules) */}
      <ResilientMediaModal
        item={activeVideoModal}
        onClose={() => setActiveVideoModal(null)}
        onOpenDocumentExport={(code) => {
          setSelectedExportDocId(code ? `doc_${code.toLowerCase().slice(0, 4)}_a4` : undefined);
          setIsDocumentExportModalOpen(true);
        }}
      />

      {/* Universal Document Export & Standardized A4 Print Suite */}
      <UniversalDocumentExportModal
        isOpen={isDocumentExportModalOpen}
        onClose={() => setIsDocumentExportModalOpen(false)}
        defaultDocumentId={selectedExportDocId}
      />

      {/* Services Health & Live Diagnostics Test Suite */}
      <ServiceDiagnosticsModal
        isOpen={isDiagnosticsModalOpen}
        onClose={() => setIsDiagnosticsModalOpen(false)}
        onOpenDocumentExport={() => setIsDocumentExportModalOpen(true)}
      />

      {/* Secure Gemini API Key Settings Modal (Windows DPAPI) */}
      <SecureApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />

      {/* Break Motivation Modal */}
      <BreakMotivationModal
        isOpen={isBreakModalOpen}
        onClose={() => setIsBreakModalOpen(false)}
      />

      {/* User Auth & Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={user}
        onUpdateUser={(updated) => {
          setUser(updated);
          if (updated.role === 'admin') {
            setVerifiedAdmin(true);
          } else if (updated.id === initialUser.id) {
            setVerifiedAdmin(false);
          }
        }}
      />

      {/* Offline Storage & PWA Sync Modal */}
      <OfflineSyncModal
        isOpen={isOfflineSyncModalOpen}
        onClose={() => setIsOfflineSyncModalOpen(false)}
        cachedResourcesCount={libraryItems.length}
      />
    </div>
  );
}

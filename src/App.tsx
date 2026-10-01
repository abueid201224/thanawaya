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

export default function App() {
  // Navigation: Active Service Only (No clutter)
  const [activeService, setActiveService] = useState<ActiveNavService>('planner');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // App State
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [schedule, setSchedule] = useState<DailyScheduleSlot[]>(initialDailySchedule);
  const [activeSlotForTutor, setActiveSlotForTutor] = useState<DailyScheduleSlot | null>(schedule[0]);
  const [libraryItems, setLibraryItems] = useState<MultimediaLibraryItem[]>(initialMultimediaLibrary);
  const [curriculumUnits, setCurriculumUnits] = useState<CurriculumUnit[]>(initialCurriculumUnits);
  const [monthlyExams, setMonthlyExams] = useState<MonthlyExam[]>(initialMonthlyExams);
  const [subjectProgressList, setSubjectProgressList] = useState<SubjectProgress[]>(initialSubjectProgress);
  const [disciplineMetrics, setDisciplineMetrics] = useState<DisciplineMetrics>(initialDisciplineMetrics);
  const [scoutedResources, setScoutedResources] = useState<ScoutedOfficialResource[]>(initialScoutedResources);

  // Skip assessment target
  const [targetSkipUnit, setTargetSkipUnit] = useState<CurriculumUnit | null>(null);

  // Modals & Diagnostic/Export Suites
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
  const [isOfflineSyncModalOpen, setIsOfflineSyncModalOpen] = useState(false);
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState(false);
  const [isDocumentExportModalOpen, setIsDocumentExportModalOpen] = useState(false);
  const [selectedExportDocId, setSelectedExportDocId] = useState<string | undefined>(undefined);
  const [activeVideoModal, setActiveVideoModal] = useState<MultimediaLibraryItem | null>(null);

  // Handlers
  const handleSwitchRole = (newRole: UserRole) => {
    setUser({ ...user, role: newRole });
  };

  const handleUpdateSchedule = (newSchedule: DailyScheduleSlot[]) => {
    setSchedule(newSchedule);

    // Dynamic discipline calculation
    const completedCount = newSchedule.filter((s) => s.isCompleted).length;
    const completionRate = Math.round((completedCount / (newSchedule.length || 1)) * 100);
    const newScore = Math.min(100, Math.max(70, Math.round(80 + completionRate * 0.2)));

    setDisciplineMetrics((prev) => ({
      ...prev,
      disciplineScore: newScore
    }));
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

    // 3. Increment discipline streak & badge
    setDisciplineMetrics((prev) => ({
      ...prev,
      disciplineScore: Math.min(100, prev.disciplineScore + 3),
      badgesEarned: [
        ...prev.badgesEarned.filter((b) => b.title !== 'قناص التخطي السريع ⚡'),
        {
          title: 'قناص التخطي السريع ⚡',
          icon: '⚡',
          desc: `اجتياز اختبار التخطي بنتيجة ${score}% واعتماد الوحدة بنجاح`
        }
      ]
    }));
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
    setSchedule((prev) => [slot, ...prev]);
  };

  // Register PWA Service Worker
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    }
  }, []);

  // Global Windows Desktop Keyboard Shortcuts (Ctrl+P, Ctrl+F, Esc)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Esc: Closes any open modal dialog
      if (e.key === 'Escape') {
        setIsDocumentExportModalOpen(false);
        setIsDiagnosticsModalOpen(false);
        setActiveVideoModal(null);
        setIsBreakModalOpen(false);
        setIsAuthModalOpen(false);
        setIsOfflineSyncModalOpen(false);
        window.dispatchEvent(new CustomEvent('close-all-modals'));
        return;
      }

      // 2. Ctrl + P: Triggers BookletPrintModal or direct PDF export for current view
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
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
        return;
      }

      // 3. Ctrl + F: Focuses contextual search bar across subject libraries
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeService]);

  const pendingScoutCount = scoutedResources.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSwitchRole={handleSwitchRole}
        activeTab={activeService}
        onOpenDiagnostics={() => setIsDiagnosticsModalOpen(true)}
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

          {/* SERVICE 2: FULL CURRICULUM & PRACTICE QUESTIONS */}
          {activeService === 'curriculum' && (
            <FullCurriculumExplorer
              units={curriculumUnits}
              onOpenSkipExam={handleOpenSkipExam}
              onUpdateUnitResources={handleUpdateUnitResources}
            />
          )}

          {/* SERVICE 3: SKIP DIAGNOSTIC EXAM ENGINE */}
          {activeService === 'skip_exam' && (
            <SkipExamEngine
              units={curriculumUnits}
              initialSelectedUnit={targetSkipUnit}
              onConfirmSkipUnit={handleConfirmSkipUnit}
              onNavigateToSchedule={() => setActiveService('planner')}
            />
          )}

          {/* SERVICE 4: MONTHLY & MILESTONE EXAMS */}
          {activeService === 'monthly_exams' && (
            <MonthlyExamsView
              exams={monthlyExams}
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
        onUpdateUser={(updated) => setUser(updated)}
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

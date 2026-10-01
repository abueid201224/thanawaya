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
import { AiTutorScheduleView } from './components/AiTutorScheduleView';
import { ProgressDisciplineView } from './components/ProgressDisciplineView';
import { BreakMotivationModal } from './components/BreakMotivationModal';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { OfflineSyncModal } from './components/OfflineSyncModal';

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

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
  const [isOfflineSyncModalOpen, setIsOfflineSyncModalOpen] = useState(false);
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

  // Register PWA Service Worker
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    }
  }, []);

  const pendingScoutCount = scoutedResources.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSwitchRole={handleSwitchRole}
        activeTab={activeService}
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
            />
          )}

          {/* SERVICE 5.5: EDUTAINMENT CODING BUDDY & TRICKS ASSISTANT */}
          {activeService === 'coding_buddy' && (
            <CodingBuddyAssistantView
              onNavigateToService={(service) => setActiveService(service)}
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

      {/* Video Modal */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl space-y-3">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-400 font-bold font-mono">
                  {activeVideoModal.sourceName}
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  {activeVideoModal.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full bg-black">
              <video src={activeVideoModal.url} controls autoPlay className="w-full h-full object-contain" />
            </div>

            <div className="p-4 text-xs text-slate-300">
              {activeVideoModal.description}
            </div>
          </div>
        </div>
      )}

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

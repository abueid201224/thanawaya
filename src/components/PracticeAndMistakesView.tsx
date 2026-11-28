import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Eye,
  BookmarkCheck,
  Clock,
  RefreshCw,
  ArrowLeft,
  SlidersHorizontal,
  ClipboardCheck,
  Check,
  Layers
} from 'lucide-react';
import type {
  CurriculumUnit,
  InterleavedQuestionItem,
  InterleavingBucket,
  MistakeEntry,
  MistakeErrorType,
  PracticeQuestion,
  SpacedReviewIntervalDays
} from '../types';
import { MixedTextRenderer } from './MathRenderer';
import {
  getReviewedUnitsForStudent,
  getSafeHintLadder,
  getUnreviewedQuestionCount
} from '../services/contentGate';
import {
  DEFAULT_SPACED_INTERVALS,
  MISTAKE_ERROR_LABELS,
  generateInterleavedSession,
  studyPersistenceService
} from '../services/studyPersistenceService';

interface PracticeAndMistakesViewProps {
  units: CurriculumUnit[];
  onDataChanged?: () => void;
}

type HubTab = 'practice' | 'interleaved' | 'mistakes' | 'spaced' | 'test';

const INTERLEAVING_BUCKET_META: Record<
  InterleavingBucket,
  { label: string; badgeClass: string }
> = {
  current_unit: {
    label: 'الوحدة الحالية (50%)',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200'
  },
  spaced_mistake: {
    label: 'مراجعة خطأ مستحق (30%)',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300'
  },
  cumulative_high_weight: {
    label: 'مراجعة تراكمية عالية الوزن (20%)',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200'
  }
};

interface ReviewedQuestionItem {
  unit: CurriculumUnit;
  question: PracticeQuestion;
}

export const PracticeAndMistakesView: React.FC<PracticeAndMistakesViewProps> = ({
  units,
  onDataChanged
}) => {
  const [activeTab, setActiveTab] = useState<HubTab>('practice');

  // Strict Student Content Gate: ONLY reviewStatus === 'reviewed'
  const reviewedUnits = useMemo(
    () =>
      getReviewedUnitsForStudent(units).filter(
        (u) => u.practiceQuestions.length > 0
      ),
    [units]
  );

  const unreviewedHiddenCount = useMemo(
    () => getUnreviewedQuestionCount(units),
    [units]
  );

  const allReviewedQuestions: ReviewedQuestionItem[] = useMemo(
    () =>
      reviewedUnits.flatMap((unit) =>
        unit.practiceQuestions.map((question) => ({ unit, question }))
      ),
    [reviewedUnits]
  );

  // ============================
  // TAB 1: PRACTICE MODE STATE
  // ============================
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    reviewedUnits[0]?.id || ''
  );
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [practiceSubmitted, setPracticeSubmitted] = useState<boolean>(false);
  const [hintTier, setHintTier] = useState<0 | 1 | 2 | 3>(0);
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [selectedErrorType, setSelectedErrorType] = useState<MistakeErrorType>('FORMULA_SELECTION');
  const [mistakeNoteInput, setMistakeNoteInput] = useState<string>('');
  const [saveBadgeState, setSaveBadgeState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [saveErrorText, setSaveErrorText] = useState<string>('');
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

  // ============================
  // TAB 1.5: INTERLEAVED (50/30/20) SESSION STATE
  // ============================
  const [interleavedUnitId, setInterleavedUnitId] = useState<string>(
    reviewedUnits[0]?.id || ''
  );
  const [interleavedSeedVersion, setInterleavedSeedVersion] = useState<number>(0);
  const [interleavedIndex, setInterleavedIndex] = useState<number>(0);
  const [interleavedSelectedMap, setInterleavedSelectedMap] = useState<Record<string, string>>({});
  const [interleavedSubmittedMap, setInterleavedSubmittedMap] = useState<Record<string, boolean>>({});
  const [interleavedStatusMsg, setInterleavedStatusMsg] = useState<string>('');

  // ============================
  // TAB 2: MISTAKE NOTEBOOK STATE
  // ============================
  const [mistakes, setMistakes] = useState<MistakeEntry[]>(() =>
    studyPersistenceService.getMistakes()
  );
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [filterErrorType, setFilterErrorType] = useState<string>('ALL');
  const [showResolvedMistakes, setShowResolvedMistakes] = useState<boolean>(false);
  const [editingMistakeId, setEditingMistakeId] = useState<string | null>(null);
  const [editErrorType, setEditErrorType] = useState<MistakeErrorType>('FORMULA_SELECTION');
  const [editNoteText, setEditNoteText] = useState<string>('');
  const [notebookSaveMessage, setNotebookSaveMessage] = useState<string>('');

  // ============================
  // TAB 3: SPACED REPETITION STATE
  // ============================
  const [spacedIntervals, setSpacedIntervals] = useState<SpacedReviewIntervalDays[]>(() =>
    studyPersistenceService.getSpacedIntervals()
  );
  const [intervalDraftText, setIntervalDraftText] = useState<string>(() =>
    studyPersistenceService.getSpacedIntervals().join(', ')
  );
  const [intervalSaveStatus, setIntervalSaveStatus] = useState<string>('');
  const [spacedAnswerMap, setSpacedAnswerMap] = useState<Record<string, string>>({});
  const [spacedOutcomeMsg, setSpacedOutcomeMsg] = useState<string>('');

  // ============================
  // TAB 4: TEST MODE STATE
  // ============================
  const [testStarted, setTestStarted] = useState<boolean>(false);
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});
  const [testSubmitted, setTestSubmitted] = useState<boolean>(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState<boolean>(false);
  const [testSecondsLeft, setTestSecondsLeft] = useState<number>(15 * 60);
  const [timerAnnouncement, setTimerAnnouncement] = useState<string>('');
  const [testSavedStatus, setTestSavedStatus] = useState<string>('');

  const refreshMistakes = () => {
    setMistakes(studyPersistenceService.getMistakes());
    onDataChanged?.();
  };

  useEffect(() => {
    let active = true;
    studyPersistenceService.hydrateFromStore().then((hydrated) => {
      if (active && hydrated) {
        setMistakes(studyPersistenceService.getMistakes());
        const loadedIntervals = studyPersistenceService.getSpacedIntervals();
        setSpacedIntervals(loadedIntervals);
        setIntervalDraftText(loadedIntervals.join(', '));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!reviewedUnits.some((u) => u.id === selectedUnitId)) {
      setSelectedUnitId(reviewedUnits[0]?.id || '');
      setQuestionIndex(0);
    }
  }, [reviewedUnits, selectedUnitId]);

  const activeUnit =
    reviewedUnits.find((u) => u.id === selectedUnitId) || reviewedUnits[0];
  const unitQuestions = activeUnit?.practiceQuestions || [];
  const safeQuestionIndex =
    unitQuestions.length > 0 ? Math.min(questionIndex, unitQuestions.length - 1) : 0;
  const currentQuestion = unitQuestions[safeQuestionIndex];

  const resetPracticeQuestionState = () => {
    setSelectedOption(null);
    setPracticeSubmitted(false);
    setHintTier(0);
    setShowSolution(false);
    setMistakeNoteInput('');
    setSaveBadgeState('idle');
    setSaveErrorText('');
  };

  const handleSelectUnit = (unitId: string) => {
    setSelectedUnitId(unitId);
    setQuestionIndex(0);
    resetPracticeQuestionState();
  };

  const handleCheckPracticeAnswer = () => {
    if (!currentQuestion || !selectedOption || !activeUnit) return;
    setPracticeSubmitted(true);
    setSaveBadgeState('idle');
    setSaveErrorText('');

    const attemptRes = studyPersistenceService.recordAttempt({
      question: currentQuestion,
      unitId: activeUnit.id,
      subjectCode: activeUnit.subjectCode,
      mode: 'practice',
      selectedKey: selectedOption,
      hintTierUsed: hintTier
    });

    const isCorrect = selectedOption === currentQuestion.correctKey;
    if (isCorrect) {
      setLiveAnnouncement(
        attemptRes.ok
          ? 'إجابة صحيحة. تم تسجيل المحاولة بنجاح دون تحريك التركيز.'
          : 'إجابة صحيحة، لكن تعذر الحفظ المحلي للمحاولة.'
      );
      if (attemptRes.ok) {
        setSaveBadgeState('saved');
      } else {
        setSaveBadgeState('error');
        setSaveErrorText(attemptRes.error || 'تعذر الحفظ المحلي');
      }
    } else {
      setLiveAnnouncement(
        'إجابة غير صحيحة. يمكنك استخدام التلميح المتدرج أو حفظ الخطأ في دفتر الأخطاء.'
      );
    }
    onDataChanged?.();
  };

  const handleCapturePracticeMistake = () => {
    if (!currentQuestion || !activeUnit || !selectedOption) return;
    const res = studyPersistenceService.captureMistake({
      question: currentQuestion,
      unitId: activeUnit.id,
      subjectCode: activeUnit.subjectCode,
      subjectNameAr: activeUnit.subjectNameAr,
      selectedKey: selectedOption,
      errorType: selectedErrorType,
      studentNote: mistakeNoteInput.trim()
    });

    if (res.ok) {
      setSaveBadgeState('saved');
      setSaveErrorText('');
      setLiveAnnouncement('تم الحفظ في دفتر الأخطاء وجدولة المراجعة المتباعدة.');
      refreshMistakes();
    } else {
      setSaveBadgeState('error');
      setSaveErrorText(res.error || 'تعذر حفظ الخطأ محلياً');
      setLiveAnnouncement('فشل حفظ الخطأ على القرص المحلي.');
    }
  };

  const handleJumpToQuestion = (unitId: string, questionId: string) => {
    const unit = reviewedUnits.find((u) => u.id === unitId);
    if (!unit) return;
    const idx = unit.practiceQuestions.findIndex((q) => q.id === questionId);
    setSelectedUnitId(unit.id);
    setQuestionIndex(idx >= 0 ? idx : 0);
    resetPracticeQuestionState();
    setActiveTab('practice');
  };

  const handleSaveMistakeEdit = (mistakeId: string) => {
    const res = studyPersistenceService.updateMistakeClassification(
      mistakeId,
      editErrorType,
      editNoteText
    );
    if (res.ok) {
      setEditingMistakeId(null);
      setNotebookSaveMessage('تم الحفظ');
      refreshMistakes();
    } else {
      setNotebookSaveMessage(res.error || 'تعذر التحديث');
    }
  };

  // Spaced Repetition logic
  const dueMistakes = useMemo(() => {
    const now = new Date();
    return mistakes.filter((m) => !m.resolved && new Date(m.nextReviewAt) <= now);
  }, [mistakes]);

  const upcomingMistakes = useMemo(() => {
    const now = new Date();
    return mistakes.filter((m) => !m.resolved && new Date(m.nextReviewAt) > now);
  }, [mistakes]);

  const handleSaveIntervals = () => {
    const parsed = intervalDraftText
      .split(/[,،\s]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= 60) as SpacedReviewIntervalDays[];

    if (parsed.length !== 4) {
      setIntervalSaveStatus('يرجى إدخال 4 فترات رقمية صحيحة بالأيام (مثال: 1, 3, 7, 14).');
      return;
    }

    const res = studyPersistenceService.saveSpacedIntervals(parsed);
    if (res.ok) {
      setSpacedIntervals(parsed);
      setIntervalSaveStatus('تم الحفظ');
    } else {
      setIntervalSaveStatus(res.error || 'تعذر الحفظ');
    }
  };

  const handleVerifySpacedCard = (entry: MistakeEntry, forceDue = false) => {
    const chosen = spacedAnswerMap[entry.id];
    if (!chosen) return;
    const questionObj = allReviewedQuestions.find(
      (item) => item.question.id === entry.questionId
    )?.question;

    if (questionObj) {
      studyPersistenceService.recordAttempt({
        question: questionObj,
        unitId: entry.unitId,
        subjectCode: entry.subjectCode,
        mode: 'spaced_review',
        selectedKey: chosen
      });
    }

    const wasCorrect = chosen === entry.correctKey;
    const res = studyPersistenceService.recordSpacedReviewOutcome(entry.id, wasCorrect);
    if (res.ok && res.data) {
      setSpacedOutcomeMsg(
        res.data.resolved
          ? 'تم إتقان هذه البطاقة وإتمام دورتها بنجاح. تم الحفظ.'
          : wasCorrect
          ? `إجابة صحيحة — المراجعة القادمة بعد ${res.data.reviewIntervalDays} يوم/أيام. تم الحفظ.`
          : `تحتاج تثبيتاً إضافياً — أُعيدت الفترة إلى ${res.data.reviewIntervalDays} يوم بهدوء. تم الحفظ.`
      );
      if (forceDue) {
        setSpacedAnswerMap((prev) => {
          const next = { ...prev };
          delete next[entry.id];
          return next;
        });
      }
      refreshMistakes();
    } else {
      setSpacedOutcomeMsg(res.error || 'تعذر حفظ نتيجة المراجعة.');
    }
  };

  const testSubmittedRef = useRef<boolean>(false);

  const finalizeTestSubmission = useCallback(() => {
    if (testSubmittedRef.current) return;
    testSubmittedRef.current = true;
    setConfirmSubmitOpen(false);
    setTestSubmitted(true);

    let allSavedOk = true;
    allReviewedQuestions.forEach(({ unit, question }) => {
      const selected = testAnswers[question.id] || '';
      const res = studyPersistenceService.recordAttempt({
        question,
        unitId: unit.id,
        subjectCode: unit.subjectCode,
        mode: 'test',
        selectedKey: selected
      });
      if (!res.ok) {
        allSavedOk = false;
      }
    });

    setTestSavedStatus(allSavedOk ? 'تم الحفظ' : 'تعذر التحقق من حفظ بعض المحاولات محلياً');
    onDataChanged?.();
  }, [allReviewedQuestions, testAnswers, onDataChanged]);

  const finalizeTestRef = useRef(finalizeTestSubmission);
  finalizeTestRef.current = finalizeTestSubmission;

  // Test Mode timer + critical minute announcements ONLY (10, 5, 1)
  useEffect(() => {
    if (!testStarted || testSubmitted) return;
    const timer = setInterval(() => {
      setTestSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finalizeTestRef.current();
          return 0;
        }
        const next = prev - 1;
        if (next === 10 * 60) {
          setTimerAnnouncement('تبقى 10 دقائق على انتهاء وقت الاختبار.');
        } else if (next === 5 * 60) {
          setTimerAnnouncement('تبقى 5 دقائق على انتهاء وقت الاختبار.');
        } else if (next === 60) {
          setTimerAnnouncement('تبقى دقيقة واحدة على انتهاء وقت الاختبار.');
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [testStarted, testSubmitted]);

  const startTestMode = () => {
    testSubmittedRef.current = false;
    setTestAnswers({});
    setTestSubmitted(false);
    setConfirmSubmitOpen(false);
    setTestSecondsLeft(15 * 60);
    setTimerAnnouncement('بدأ وضع الاختبار. الإجابات والحلول مخفية حتى التسليم.');
    setTestSavedStatus('');
    setTestStarted(true);
  };

  const handleAddWrongTestQuestionsToNotebook = () => {
    let savedAll = true;
    allReviewedQuestions.forEach(({ unit, question }) => {
      const chosen = testAnswers[question.id];
      if (chosen !== question.correctKey) {
        const res = studyPersistenceService.captureMistake({
          question,
          unitId: unit.id,
          subjectCode: unit.subjectCode,
          subjectNameAr: unit.subjectNameAr,
          selectedKey: chosen || 'غير مجاب',
          errorType: 'FORMULA_SELECTION',
          studentNote: 'أُضيف تلقائياً بعد تسليم وضع الاختبار'
        });
        if (!res.ok) savedAll = false;
      }
    });
    refreshMistakes();
    setTestSavedStatus(savedAll ? 'تم حفظ الأخطاء في دفتر الأخطاء' : 'تعذر حفظ بعض الأخطاء');
  };

  const interleavedSession: InterleavedQuestionItem[] = useMemo(() => {
    const now = new Date();
    const due = mistakes.filter((m) => !m.resolved && new Date(m.nextReviewAt) <= now);
    return generateInterleavedSession({
      reviewedUnits,
      activeUnitId: interleavedUnitId || selectedUnitId,
      dueMistakes: due,
      totalQuestions: 10
    });
    // Regenerate explicitly on unit change or refresh click so mid-session checks do not shift cards
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewedUnits, interleavedUnitId, selectedUnitId, interleavedSeedVersion]);

  const safeInterleavedIndex =
    interleavedSession.length > 0
      ? Math.min(interleavedIndex, interleavedSession.length - 1)
      : 0;
  const activeInterleavedItem = interleavedSession[safeInterleavedIndex];

  const handleRestartInterleavedSession = (nextUnitId?: string) => {
    if (nextUnitId !== undefined) {
      setInterleavedUnitId(nextUnitId);
    }
    setInterleavedIndex(0);
    setInterleavedSelectedMap({});
    setInterleavedSubmittedMap({});
    setInterleavedStatusMsg('');
    setInterleavedSeedVersion((v) => v + 1);
  };

  const handleCheckInterleavedAnswer = () => {
    if (!activeInterleavedItem) return;
    const { unit, question, interleavingBucket, dueMistakeId } = activeInterleavedItem;
    const chosen = interleavedSelectedMap[question.id];
    if (!chosen) return;

    setInterleavedSubmittedMap((prev) => ({ ...prev, [question.id]: true }));
    const isCorrect = chosen === question.correctKey;

    const attemptRes = studyPersistenceService.recordAttempt({
      question,
      unitId: unit.id,
      subjectCode: unit.subjectCode,
      mode: interleavingBucket === 'spaced_mistake' ? 'spaced_review' : 'practice',
      selectedKey: chosen,
      hintTierUsed: 0
    });

    if (interleavingBucket === 'spaced_mistake' && dueMistakeId) {
      studyPersistenceService.recordSpacedReviewOutcome(dueMistakeId, isCorrect);
      setMistakes(studyPersistenceService.getMistakes());
    } else if (!isCorrect) {
      studyPersistenceService.captureMistake({
        question,
        unitId: unit.id,
        subjectCode: unit.subjectCode,
        subjectNameAr: unit.subjectNameAr,
        selectedKey: chosen,
        errorType: 'CONCEPTUAL',
        studentNote: 'سُجّل من جلسة التداخل المعرفي (50/30/20)'
      });
      setMistakes(studyPersistenceService.getMistakes());
    }

    setInterleavedStatusMsg(
      isCorrect
        ? attemptRes.ok
          ? 'إجابة صحيحة — تم تسجيل التقدم في الجلسة المتداخلة.'
          : 'إجابة صحيحة، لكن تعذر تأكيد الحفظ المحلي.'
        : 'إجابة غير صحيحة — أُضيف/جُدول السؤال للمراجعة بعد 24 ساعة مع توجيه مفاهيمي.'
    );
    onDataChanged?.();
  };

  const filteredMistakes = useMemo(() => {
    return mistakes.filter((m) => {
      if (!showResolvedMistakes && m.resolved) return false;
      if (filterSubject !== 'ALL' && m.subjectCode !== filterSubject) return false;
      if (filterErrorType !== 'ALL' && m.errorType !== filterErrorType) return false;
      return true;
    });
  }, [mistakes, showResolvedMistakes, filterSubject, filterErrorType]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const hints = currentQuestion ? getSafeHintLadder(currentQuestion) : ['', '', ''];
  const unansweredTestCount = allReviewedQuestions.filter(
    ({ question }) => !testAnswers[question.id]
  ).length;
  const testCorrectCount = allReviewedQuestions.filter(
    ({ question }) => testAnswers[question.id] === question.correctKey
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-xl lg:text-2xl font-bold text-slate-900">
              حلقة التدريب المراجَع ودفتر الأخطاء والمراجعة المتباعدة
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              تظهر هنا الأسئلة المراجَعة تربوياً فقط ({allReviewedQuestions.length} سؤالاً معتمداً).
              {unreviewedHiddenCount > 0 && (
                <span className="text-slate-500">
                  {' '}• تم حجب {unreviewedHiddenCount} سؤالاً قيد المراجعة تلقائياً عن شاشة الطالب.
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 tabular-nums">
            <div>
              <div className="text-slate-500">في دفتر الأخطاء</div>
              <div className="text-lg font-bold text-slate-900">
                {mistakes.filter((m) => !m.resolved).length}
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="text-slate-500">مستحق للمراجعة اليوم</div>
              <div className="text-lg font-bold text-blue-700">{dueMistakes.length}</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Single line, >= 40px target) */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100">
          {[
            { id: 'practice' as HubTab, label: 'التدريب الموجّه', icon: BookOpen },
            { id: 'interleaved' as HubTab, label: 'جلسة تداخل معرفي (50/30/20)', icon: Layers },
            {
              id: 'mistakes' as HubTab,
              label: `دفتر الأخطاء (${mistakes.filter((m) => !m.resolved).length})`,
              icon: BookmarkCheck
            },
            {
              id: 'spaced' as HubTab,
              label: `المراجعة المتباعدة (${dueMistakes.length})`,
              icon: RefreshCw
            },
            { id: 'test' as HubTab, label: 'وضع الاختبار', icon: ClipboardCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live region for polite announcements without stealing focus */}
      <div aria-live="polite" className="sr-only">
        {liveAnnouncement} {timerAnnouncement}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PRACTICE MODE */}
      {/* ======================================================== */}
      {activeTab === 'practice' && (
        <div className="space-y-4">
          {reviewedUnits.length === 0 || !currentQuestion ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                لا توجد أسئلة مراجَعة متاحة حالياً
              </h3>
              <p className="text-sm text-slate-600">
                يتم عرض الأسئلة التي اجتازت المراجعة الفنية والتحقق فقط.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5 shadow-xs">
              {/* Unit & Question Selector */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <label
                    htmlFor="practice-unit-select"
                    className="block text-xs font-bold text-slate-600"
                  >
                    الوحدة المراجَعة:
                  </label>
                  <select
                    id="practice-unit-select"
                    value={activeUnit.id}
                    onChange={(e) => handleSelectUnit(e.target.value)}
                    className="min-h-[40px] bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  >
                    {reviewedUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.subjectNameAr} — {u.title} ({u.practiceQuestions.length})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600 tabular-nums">
                  <span className="font-bold text-slate-800">
                    سؤال {questionIndex + 1} من {unitQuestions.length}
                  </span>
                  <span>•</span>
                  <span>الإصدار v{currentQuestion.questionVersion}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>مراجَع</span>
                  </span>
                </div>
              </div>

              {/* Question Prompt */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs text-slate-600 font-semibold">
                  ناتج التعلم: {currentQuestion.targetedLearningOutcome}
                  {currentQuestion.examSource ? ` • ${currentQuestion.examSource}` : ''}
                </div>
                <div className="text-base font-bold text-slate-900">
                  <MixedTextRenderer text={currentQuestion.questionText} />
                </div>
              </div>

              {/* Options (>= 40px touch target, icon+text state) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.options.map((opt) => {
                  const isChosen = selectedOption === opt.key;
                  const isCorrectOpt = opt.key === currentQuestion.correctKey;

                  let style =
                    'bg-white border-slate-300 text-slate-800 hover:border-blue-500';
                  if (practiceSubmitted) {
                    if (isCorrectOpt) {
                      style = 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold';
                    } else if (isChosen && !isCorrectOpt) {
                      style = 'bg-rose-50 border-rose-600 text-rose-950 font-bold';
                    }
                  } else if (isChosen) {
                    style = 'bg-blue-50 border-blue-600 text-blue-950 font-bold ring-2 ring-blue-600/20';
                  }

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={practiceSubmitted}
                      onClick={() => setSelectedOption(opt.key)}
                      className={`min-h-[48px] p-4 rounded-xl border text-right flex items-center justify-between gap-3 transition-colors cursor-pointer ${style}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-300 text-slate-800 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {opt.key}
                        </span>
                        <div className="text-sm min-w-0">
                          <MixedTextRenderer text={opt.text} />
                        </div>
                      </div>
                      {practiceSubmitted && isCorrectOpt && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                      )}
                      {practiceSubmitted && isChosen && !isCorrectOpt && (
                        <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Practice Action Bar: Check Answer, 3-tier Hint Ladder, Show Solution */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!selectedOption || practiceSubmitted}
                    onClick={handleCheckPracticeAnswer}
                    className="min-h-[40px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    تحقق من الإجابة
                  </button>

                  <button
                    type="button"
                    disabled={hintTier >= 3}
                    onClick={() => setHintTier((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : 3))}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 disabled:opacity-40 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-700" />
                    <span>
                      {hintTier === 0
                        ? 'تلميح 1: الفكرة'
                        : hintTier === 1
                        ? 'تلميح 2: القاعدة'
                        : hintTier === 2
                        ? 'تلميح 3: أول خطوة'
                        : 'اكتملت التلميحات'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSolution((prev) => !prev)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{showSolution ? 'إخفاء الحل' : 'أظهر الحل'}</span>
                  </button>
                </div>

                {/* Next / Prev Question */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={questionIndex === 0}
                    onClick={() => {
                      setQuestionIndex((i) => Math.max(0, i - 1));
                      resetPracticeQuestionState();
                    }}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 disabled:opacity-40 text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    السابق
                  </button>
                  <button
                    type="button"
                    disabled={questionIndex >= unitQuestions.length - 1}
                    onClick={() => {
                      setQuestionIndex((i) => Math.min(unitQuestions.length - 1, i + 1));
                      resetPracticeQuestionState();
                    }}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-40 text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    السؤال التالي
                  </button>
                </div>
              </div>

              {/* 3-Tier Hint Ladder Output */}
              {hintTier > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2 text-xs text-slate-800">
                  <div className="font-bold text-amber-900">التلميح المتدرج:</div>
                  {hintTier >= 1 && (
                    <div>
                      <strong>1. الفكرة:</strong> <MixedTextRenderer text={hints[0]} className="inline" />
                    </div>
                  )}
                  {hintTier >= 2 && (
                    <div>
                      <strong>2. القاعدة:</strong> <MixedTextRenderer text={hints[1]} className="inline" />
                    </div>
                  )}
                  {hintTier >= 3 && (
                    <div>
                      <strong>3. أول خطوة:</strong> <MixedTextRenderer text={hints[2]} className="inline" />
                    </div>
                  )}
                </div>
              )}

              {/* Immediate Feedback & Mistake Capture */}
              {practiceSubmitted && (
                <div
                  className={`p-4 rounded-xl border space-y-3 ${
                    selectedOption === currentQuestion.correctKey
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {selectedOption === currentQuestion.correctKey ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                          <span>إجابة صحيحة</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-rose-700" />
                          <span>إجابة غير صحيحة — الاختيار الصحيح هو ({currentQuestion.correctKey})</span>
                        </>
                      )}
                    </div>

                    {saveBadgeState === 'saved' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-white border border-emerald-300 px-3 py-1 rounded-lg">
                        <Check className="w-3.5 h-3.5" />
                        <span>تم الحفظ</span>
                      </span>
                    )}
                    {saveBadgeState === 'error' && (
                      <span className="text-xs font-bold text-rose-800">
                        {saveErrorText}
                      </span>
                    )}
                  </div>

                  {/* Mistake Capture prompt if wrong */}
                  {selectedOption !== currentQuestion.correctKey && (
                    <div className="p-3.5 rounded-xl bg-white border border-rose-200 space-y-3 text-xs text-slate-800">
                      <div className="font-bold text-slate-900">
                        سجّل هذا السؤال في دفتر الأخطاء وحدد سبب الخطأ للمراجعة المتباعدة:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 mb-1">تصنيف الخطأ:</label>
                          <select
                            value={selectedErrorType}
                            onChange={(e) => setSelectedErrorType(e.target.value as MistakeErrorType)}
                            className="w-full min-h-[40px] bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                          >
                            {Object.entries(MISTAKE_ERROR_LABELS).map(([k, label]) => (
                              <option key={k} value={k}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1">ملاحظتك المختصرة (اختياري):</label>
                          <input
                            type="text"
                            value={mistakeNoteInput}
                            onChange={(e) => setMistakeNoteInput(e.target.value)}
                            placeholder="مثال: نسيت مشتقة الزاوية الداخلية..."
                            className="w-full min-h-[40px] bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                          />
                        </div>
                      </div>
                      {selectedErrorType === 'CONCEPTUAL' && (
                        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                          الأخطاء المفاهيمية تُجدول تلقائياً للمراجعة الأولى بعد 24 ساعة مع توليد توجيه مفاهيمي.
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleCapturePracticeMistake}
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                      >
                        حفظ في دفتر الأخطاء
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step-by-Step Solution ("أظهر الحل") */}
              {showSolution && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2 text-xs text-slate-900">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>خطوات الحل التفصيلية:</span>
                  </div>
                  {currentQuestion.solutionSteps && currentQuestion.solutionSteps.length > 0 ? (
                    <ol className="space-y-1.5 list-decimal list-inside leading-relaxed">
                      {currentQuestion.solutionSteps.map((step, i) => (
                        <li key={i}>
                          <MixedTextRenderer text={step} className="inline" />
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <MixedTextRenderer text={currentQuestion.explanation} />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1.5: INTERLEAVED PRACTICE (50% / 30% / 20%) */}
      {/* ======================================================== */}
      {activeTab === 'interleaved' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                جلسة التداخل المعرفي الموزونة (50% حالي • 30% أخطاء مستحقة • 20% تراكمي عالي الوزن)
              </h3>
              <p className="text-xs text-slate-600">
                تدمج الجلسة مسائل الوحدة النشطة مع أخطائك المستحقة للمراجعة وأسئلة عالية الوزن من وحدات أخرى لمنع النسيان.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="الوحدة النشطة للجلسة المتداخلة"
                value={interleavedUnitId || activeUnit?.id || ''}
                onChange={(e) => handleRestartInterleavedSession(e.target.value)}
                className="min-h-[40px] bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              >
                {reviewedUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.subjectNameAr} — {u.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleRestartInterleavedSession()}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تحديث الجلسة</span>
              </button>
            </div>
          </div>

          {interleavedSession.length === 0 || !activeInterleavedItem ? (
            <div className="py-8 text-center text-sm text-slate-600">
              لا توجد أسئلة مراجَعة كافية لبناء جلسة التداخل المعرفي حالياً.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Session Distribution Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {(['current_unit', 'spaced_mistake', 'cumulative_high_weight'] as InterleavingBucket[]).map(
                    (bucket) => {
                      const count = interleavedSession.filter((i) => i.interleavingBucket === bucket).length;
                      const meta = INTERLEAVING_BUCKET_META[bucket];
                      return (
                        <span
                          key={bucket}
                          className={`px-3 py-1.5 rounded-lg border font-bold tabular-nums ${meta.badgeClass}`}
                        >
                          {meta.label}: {count}
                        </span>
                      );
                    }
                  )}
                </div>
                <span className="font-bold text-slate-700 tabular-nums">
                  بطاقة {safeInterleavedIndex + 1} من {interleavedSession.length}
                </span>
              </div>

              {/* Active Interleaved Card */}
              {(() => {
                const { unit, question, interleavingBucket } = activeInterleavedItem;
                const bucketMeta = INTERLEAVING_BUCKET_META[interleavingBucket];
                const chosen = interleavedSelectedMap[question.id];
                const isSubmitted = Boolean(interleavedSubmittedMap[question.id]);

                return (
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-slate-800">
                        {unit.subjectNameAr} • {unit.title}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg border font-bold ${bucketMeta.badgeClass}`}>
                        {bucketMeta.label}
                      </span>
                    </div>

                    <div className="text-base font-bold text-slate-900">
                      <MixedTextRenderer text={question.questionText} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {question.options.map((opt) => {
                        const isOptChosen = chosen === opt.key;
                        const isOptCorrect = opt.key === question.correctKey;
                        let style = 'bg-white border-slate-300 text-slate-800 hover:border-blue-500';
                        if (isSubmitted) {
                          if (isOptCorrect) style = 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold';
                          else if (isOptChosen && !isOptCorrect) style = 'bg-rose-50 border-rose-600 text-rose-950 font-bold';
                        } else if (isOptChosen) {
                          style = 'bg-blue-50 border-blue-600 text-blue-950 font-bold ring-2 ring-blue-600/20';
                        }

                        return (
                          <button
                            key={opt.key}
                            type="button"
                            disabled={isSubmitted}
                            onClick={() =>
                              setInterleavedSelectedMap((prev) => ({ ...prev, [question.id]: opt.key }))
                            }
                            className={`min-h-[44px] p-3.5 rounded-xl border text-right flex items-center gap-3 cursor-pointer ${style}`}
                          >
                            <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                              {opt.key}
                            </span>
                            <div className="text-sm">
                              <MixedTextRenderer text={opt.text} />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        disabled={!chosen || isSubmitted}
                        onClick={handleCheckInterleavedAnswer}
                        className="min-h-[40px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                      >
                        تحقق من الإجابة
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={safeInterleavedIndex === 0}
                          onClick={() => {
                            setInterleavedIndex((i) => Math.max(0, i - 1));
                            setInterleavedStatusMsg('');
                          }}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 disabled:opacity-40 text-xs font-bold cursor-pointer"
                        >
                          السابق
                        </button>
                        <button
                          type="button"
                          disabled={safeInterleavedIndex >= interleavedSession.length - 1}
                          onClick={() => {
                            setInterleavedIndex((i) => Math.min(interleavedSession.length - 1, i + 1));
                            setInterleavedStatusMsg('');
                          }}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-40 text-xs font-bold cursor-pointer"
                        >
                          البطاقة التالية
                        </button>
                      </div>
                    </div>

                    {isSubmitted && (
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 space-y-1.5">
                        {interleavedStatusMsg && (
                          <div className="font-bold text-blue-900">{interleavedStatusMsg}</div>
                        )}
                        <MixedTextRenderer text={question.explanation} />
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MISTAKE NOTEBOOK (دفتر الأخطاء) */}
      {/* ======================================================== */}
      {activeTab === 'mistakes' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5 shadow-xs">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <SlidersHorizontal className="w-4 h-4" />
                <span>تصفية الدفتر:</span>
              </span>
              <select
                aria-label="تصفية حسب المادة"
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="min-h-[40px] bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
              >
                <option value="ALL">جميع المواد</option>
                <option value="CALCULUS">التفاضل والتكامل</option>
                <option value="STATICS">الاستاتيكا</option>
              </select>

              <select
                aria-label="تصفية حسب نوع الخطأ"
                value={filterErrorType}
                onChange={(e) => setFilterErrorType(e.target.value)}
                className="min-h-[40px] bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
              >
                <option value="ALL">جميع تصنيفات الأخطاء</option>
                {Object.entries(MISTAKE_ERROR_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowResolvedMistakes((v) => !v)}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-bold whitespace-nowrap cursor-pointer ${
                  showResolvedMistakes
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-300'
                }`}
              >
                {showResolvedMistakes ? 'عرض غير المتقنة فقط' : 'إظهار المتقنة أيضاً'}
              </button>
            </div>

            {notebookSaveMessage && (
              <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>{notebookSaveMessage}</span>
              </span>
            )}
          </div>

          {filteredMistakes.length === 0 ? (
            <div className="py-10 text-center space-y-2 text-slate-600 text-sm">
              <BookmarkCheck className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="font-bold text-slate-800">لا توجد أخطاء مسجلة في هذا التصنيف</div>
              <p className="text-xs">
                عند حدوث أي خطأ أثناء التدريب أو وضع الاختبار، يمكنك إضافته هنا لتتبع نوع الخطأ ومراجعته.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMistakes.map((entry) => {
                const isEditing = editingMistakeId === entry.id;
                return (
                  <div
                    key={entry.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <span>{entry.subjectNameAr}</span>
                        <span>•</span>
                        <span>{MISTAKE_ERROR_LABELS[entry.errorType]}</span>
                        <span>•</span>
                        <span>v{entry.questionVersion}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700">
                        {entry.resolved ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>مكتمل المراجعة</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-blue-700" />
                            <span>فترة المراجعة: كل {entry.reviewIntervalDays} يوم</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-slate-900">
                      <MixedTextRenderer text={entry.questionText} />
                    </div>

                    <div className="text-xs text-slate-600">
                      إجابتك المسجلة: <strong className="font-mono">{entry.selectedKey}</strong> • الإجابة الصحيحة:{' '}
                      <strong className="font-mono text-emerald-800">{entry.correctKey}</strong>
                    </div>

                    {entry.conceptualHint && !isEditing && (
                      <div className="text-xs bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-amber-950 flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">توجيه مفاهيمي (مراجعة 24 ساعة): </span>
                          <span>{entry.conceptualHint}</span>
                        </div>
                      </div>
                    )}

                    {entry.studentNote && !isEditing && (
                      <div className="text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-700">
                        ملاحظتك: {entry.studentNote}
                      </div>
                    )}

                    {isEditing ? (
                      <div className="p-3 rounded-xl bg-white border border-slate-300 space-y-2 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <select
                            value={editErrorType}
                            onChange={(e) => setEditErrorType(e.target.value as MistakeErrorType)}
                            className="min-h-[40px] bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
                          >
                            {Object.entries(MISTAKE_ERROR_LABELS).map(([k, label]) => (
                              <option key={k} value={k}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={editNoteText}
                            onChange={(e) => setEditNoteText(e.target.value)}
                            placeholder="حدّث ملاحظتك حول الخطأ"
                            className="min-h-[40px] bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveMistakeEdit(entry.id)}
                            className="min-h-[40px] px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold cursor-pointer"
                          >
                            حفظ التعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingMistakeId(null)}
                            className="min-h-[40px] px-4 py-1.5 rounded-lg bg-slate-200 text-slate-800 font-bold cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleJumpToQuestion(entry.unitId, entry.questionId)}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>إعادة حل المسألة</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMistakeId(entry.id);
                            setEditErrorType(entry.errorType);
                            setEditNoteText(entry.studentNote || '');
                            setNotebookSaveMessage('');
                          }}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
                        >
                          تعديل التصنيف والملاحظة
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SPACED REPETITION (1/3/7/14) */}
      {/* ======================================================== */}
      {activeTab === 'spaced' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5 shadow-xs">
          {/* Configurable Intervals */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-end justify-between gap-4 text-xs">
            <div className="space-y-1.5 flex-1">
              <label htmlFor="spaced-intervals-input" className="block font-bold text-slate-900">
                فترات المراجعة المتباعدة القابلة للتعديل (بالأيام — افتراضي {DEFAULT_SPACED_INTERVALS.join('، ')}):
              </label>
              <input
                id="spaced-intervals-input"
                type="text"
                value={intervalDraftText}
                onChange={(e) => setIntervalDraftText(e.target.value)}
                dir="ltr"
                className="w-full md:w-64 min-h-[40px] bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-left"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveIntervals}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 text-white font-bold cursor-pointer whitespace-nowrap"
              >
                حفظ الفترات
              </button>
              {intervalSaveStatus && (
                <span className="font-bold text-emerald-700">{intervalSaveStatus}</span>
              )}
            </div>
          </div>

          {spacedOutcomeMsg && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
              <span>{spacedOutcomeMsg}</span>
            </div>
          )}

          {/* Due Cards */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              البطاقات المستحقة للمراجعة الآن ({dueMistakes.length})
            </h3>
            {dueMistakes.length === 0 ? (
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                لا توجد بطاقات متأخرة الآن. يمكنك المراجعة المبكرة للبطاقات المجدولة أدناه عند رغبتك.
              </div>
            ) : (
              dueMistakes.map((card) => {
                const fullQ = allReviewedQuestions.find(
                  (item) => item.question.id === card.questionId
                )?.question;
                return (
                  <div
                    key={card.id}
                    className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{card.subjectNameAr}</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-slate-700">
                          {MISTAKE_ERROR_LABELS[card.errorType]}
                        </span>
                      </div>
                      <span className="tabular-nums">
                        المرحلة الحالية: {card.reviewIntervalDays} يوم • مراجعات سابقة: {card.reviewCount}
                      </span>
                    </div>
                    {card.conceptualHint && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <span>{card.conceptualHint}</span>
                      </div>
                    )}
                    <div className="text-sm font-bold text-slate-900">
                      <MixedTextRenderer text={card.questionText} />
                    </div>
                    {fullQ && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {fullQ.options.map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() =>
                              setSpacedAnswerMap((prev) => ({ ...prev, [card.id]: opt.key }))
                            }
                            className={`min-h-[40px] p-2.5 rounded-lg border text-right flex items-center gap-2 cursor-pointer ${
                              spacedAnswerMap[card.id] === opt.key
                                ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                : 'bg-white text-slate-800 border-slate-300'
                            }`}
                          >
                            <span className="font-mono font-bold">({opt.key})</span>
                            <MixedTextRenderer text={opt.text} className="inline" />
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={!spacedAnswerMap[card.id]}
                      onClick={() => handleVerifySpacedCard(card)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-blue-600 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                    >
                      تأكيد المراجعة وتحديث الفترة
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Upcoming Cards (calm schedule view + optional early review) */}
          {upcomingMistakes.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                بطاقات مجدولة قادمة ({upcomingMistakes.length}) — الدورة النشطة: {spacedIntervals.join(' / ')} يوم
              </h3>
              <div className="space-y-2">
                {upcomingMistakes.map((card) => (
                  <div
                    key={card.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-slate-800 truncate">
                        <MixedTextRenderer text={card.questionText} className="inline" />
                      </div>
                      <div className="text-slate-600 tabular-nums">
                        {card.subjectNameAr} • الفاصل الحالي: {card.reviewIntervalDays} يوم • موعد المراجعة:{' '}
                        {new Date(card.nextReviewAt).toLocaleDateString('ar-EG')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleJumpToQuestion(card.unitId, card.questionId)}
                      className="min-h-[40px] px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-bold whitespace-nowrap cursor-pointer"
                    >
                      مراجعة مبكرة
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: TEST MODE (NO FEEDBACK UNTIL SUBMISSION) */}
      {/* ======================================================== */}
      {activeTab === 'test' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5 shadow-xs">
          {!testStarted ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">
                وضع الاختبار التقييمي المحاكي للامتحان
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                يتضمن هذا الوضع {allReviewedQuestions.length} أسئلة مراجَعة بدون تلميحات أو تصحيح فوري أثناء الحل؛
                يظهر التقييم والحلول التفصيلية فقط بعد الضغط على تسليم الاختبار.
              </p>
              <button
                type="button"
                disabled={allReviewedQuestions.length === 0}
                onClick={startTestMode}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
              >
                بدء الاختبار الآن (15 دقيقة)
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Calm Header Timer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="text-sm font-bold text-slate-900 tabular-nums">
                  {testSubmitted
                    ? `النتيجة: ${testCorrectCount} من ${allReviewedQuestions.length}`
                    : `الأسئلة المجابة: ${allReviewedQuestions.length - unansweredTestCount} من ${allReviewedQuestions.length}`}
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 font-mono text-sm font-bold tabular-nums">
                  <Clock className="w-4 h-4 text-slate-700" />
                  <span>{formatTimer(testSecondsLeft)}</span>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {allReviewedQuestions.map(({ unit, question }, idx) => {
                  const chosen = testAnswers[question.id];
                  const isCorrect = chosen === question.correctKey;

                  return (
                    <div
                      key={question.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span className="font-bold text-slate-800">
                          سؤال {idx + 1} • {unit.subjectNameAr}
                        </span>
                        <span>{question.targetedLearningOutcome}</span>
                      </div>

                      <div className="text-sm font-bold text-slate-900">
                        <MixedTextRenderer text={question.questionText} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        {question.options.map((opt) => {
                          const isOptChosen = chosen === opt.key;
                          const isOptCorrect = opt.key === question.correctKey;

                          let btnClass = 'bg-white border-slate-300 text-slate-800';
                          if (testSubmitted) {
                            if (isOptCorrect) {
                              btnClass = 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold';
                            } else if (isOptChosen && !isOptCorrect) {
                              btnClass = 'bg-rose-50 border-rose-600 text-rose-950 font-bold';
                            }
                          } else if (isOptChosen) {
                            btnClass = 'bg-blue-600 border-blue-600 text-white font-bold';
                          }

                          return (
                            <button
                              key={opt.key}
                              type="button"
                              disabled={testSubmitted}
                              onClick={() =>
                                setTestAnswers((prev) => ({
                                  ...prev,
                                  [question.id]: opt.key
                                }))
                              }
                              className={`min-h-[42px] p-3 rounded-xl border text-right flex items-center justify-between gap-2 cursor-pointer ${btnClass}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold">({opt.key})</span>
                                <MixedTextRenderer text={opt.text} className="inline" />
                              </div>
                              {testSubmitted && isOptCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                              )}
                              {testSubmitted && isOptChosen && !isOptCorrect && (
                                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {testSubmitted && (
                        <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 space-y-1">
                          <div className="font-bold flex items-center gap-1.5">
                            {isCorrect ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                                <span className="text-emerald-800">إجابة صحيحة</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-rose-700" />
                                <span className="text-rose-800">
                                  إجابة غير صحيحة — الصحيح ({question.correctKey})
                                </span>
                              </>
                            )}
                          </div>
                          <MixedTextRenderer text={question.explanation} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit / Confirmation / Post-Submit Actions */}
              {!testSubmitted ? (
                <div className="space-y-3 pt-2">
                  {!confirmSubmitOpen ? (
                    <button
                      type="button"
                      onClick={() => setConfirmSubmitOpen(true)}
                      className="min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                    >
                      إنهاء وتسليم الاختبار
                    </button>
                  ) : (
                    <div
                      role="dialog"
                      aria-label="تأكيد تسليم الاختبار"
                      className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-3 text-xs text-slate-900"
                    >
                      <div className="font-bold text-sm">
                        تأكيد تسليم الاختبار
                      </div>
                      <p className="tabular-nums">
                        {unansweredTestCount > 0
                          ? `الأسئلة غير المجابة: ${unansweredTestCount} من أصل ${allReviewedQuestions.length} سؤالاً. هل تريد التسليم الآن؟`
                          : `تمت الإجابة على جميع الأسئلة (${allReviewedQuestions.length}). هل تريد تسليم الاختبار وعرض النتيجة؟`}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={finalizeTestSubmission}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold cursor-pointer"
                        >
                          تأكيد التسليم
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmSubmitOpen(false)}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 font-bold cursor-pointer"
                        >
                          العودة لإكمال الإجابات
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                  <div className="flex flex-wrap items-center gap-2">
                    {testCorrectCount < allReviewedQuestions.length && (
                      <button
                        type="button"
                        onClick={handleAddWrongTestQuestionsToNotebook}
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
                      >
                        حفظ الأسئلة غير الصحيحة في دفتر الأخطاء
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={startTestMode}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
                    >
                      إعادة الاختبار
                    </button>
                  </div>
                  {testSavedStatus && (
                    <span className="text-xs font-bold text-emerald-800 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{testSavedStatus}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PracticeAndMistakesView;

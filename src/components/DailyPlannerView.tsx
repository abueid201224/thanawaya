import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  Coffee,
  AlertCircle,
  Zap,
  ArrowRight,
  Flame,
  Check,
  X,
  Target,
  RefreshCw
} from 'lucide-react';
import { DailyScheduleSlot, SlotType, PriorityLevel, DynamicRescheduleResult } from '../types';
import { calculateDynamicReschedule } from '../services/reschedulingEngine';

interface DailyPlannerViewProps {
  schedule: DailyScheduleSlot[];
  onUpdateSchedule: (newSchedule: DailyScheduleSlot[]) => void;
  onSelectSlotForTutor: (slot: DailyScheduleSlot) => void;
  onOpenBreakGuide: () => void;
}

export const DailyPlannerView: React.FC<DailyPlannerViewProps> = ({
  schedule,
  onUpdateSchedule,
  onSelectSlotForTutor,
  onOpenBreakGuide
}) => {
  // Timer State for active study session
  const [timerSeconds, setTimerSeconds] = useState(50 * 60); // 50 mins
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'study' | 'break'>('study');

  // Dynamic Reschedule Modal / Notification State
  const [rescheduleResult, setRescheduleResult] = useState<DynamicRescheduleResult | null>(null);

  // Modal / Form state for adding/editing slots
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  const [formTimeStart, setFormTimeStart] = useState('16:00');
  const [formTimeEnd, setFormTimeEnd] = useState('17:30');
  const [formSubjectCode, setFormSubjectCode] = useState('CALCULUS');
  const [formTopic, setFormTopic] = useState('');
  const [formSlotType, setFormSlotType] = useState<SlotType>('study');
  const [formPriority, setFormPriority] = useState<PriorityLevel>('high');
  const [formAiReason, setFormAiReason] = useState('');

  // Handle Timer Countdown
  React.useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
      if (timerMode === 'study') {
        onOpenBreakGuide();
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, timerMode, onOpenBreakGuide]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleSlotCompleted = (slotId: string) => {
    const updated = schedule.map((s) =>
      s.id === slotId ? { ...s, isCompleted: !s.isCompleted } : s
    );
    onUpdateSchedule(updated);
  };

  const handleDeleteSlot = (slotId: string) => {
    onUpdateSchedule(schedule.filter((s) => s.id !== slotId));
  };

  const handleOpenAddModal = () => {
    setEditingSlotId(null);
    setFormTimeStart('16:00');
    setFormTimeEnd('17:15');
    setFormSubjectCode('CALCULUS');
    setFormTopic('');
    setFormSlotType('study');
    setFormPriority('high');
    setFormAiReason('حصة تركيز وتطبيق على أسئلة الامتحانات');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slot: DailyScheduleSlot) => {
    setEditingSlotId(slot.id);
    setFormTimeStart(slot.timeStart);
    setFormTimeEnd(slot.timeEnd);
    setFormSubjectCode(slot.subjectCode);
    setFormTopic(slot.topic);
    setFormSlotType(slot.slotType);
    setFormPriority(slot.priority);
    setFormAiReason(slot.aiPriorityReason || '');
    setIsModalOpen(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();

    const subjectNameMap: Record<string, string> = {
      CALCULUS: 'التفاضل والتكامل',
      ALGEBRA_SOLID_GEO: 'الجبر والهندسة الفراغية',
      STATICS: 'الاستاتيكا',
      DYNAMICS: 'الديناميكا',
      PHYSICS: 'الفيزياء',
      CHEMISTRY: 'الكيمياء',
      LANGUAGES: 'اللغات',
      BREAK: 'استراحة وتجديد النشاط'
    };

    if (editingSlotId) {
      // Edit
      const updated = schedule.map((slot) => {
        if (slot.id === editingSlotId) {
          return {
            ...slot,
            timeStart: formTimeStart,
            timeEnd: formTimeEnd,
            subjectCode: formSubjectCode,
            subjectNameAr: subjectNameMap[formSubjectCode] || formSubjectCode,
            topic: formTopic,
            slotType: formSlotType,
            priority: formPriority,
            aiPriorityReason: formAiReason
          };
        }
        return slot;
      });
      onUpdateSchedule(updated);
    } else {
      // Add
      const newSlot: DailyScheduleSlot = {
        id: `slot_${Date.now()}`,
        timeStart: formTimeStart,
        timeEnd: formTimeEnd,
        subjectCode: formSubjectCode,
        subjectNameAr: subjectNameMap[formSubjectCode] || formSubjectCode,
        topic: formTopic,
        slotType: formSlotType,
        priority: formPriority,
        isCompleted: false,
        aiPriorityReason: formAiReason || 'حصة مضافة ومخصصة وفق خطتك'
      };
      onUpdateSchedule([...schedule, newSlot]);
    }

    setIsModalOpen(false);
  };

  const completedCount = schedule.filter((s) => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / (schedule.length || 1)) * 100);

  const handleTriggerDynamicReschedule = () => {
    const result = calculateDynamicReschedule(schedule);
    setRescheduleResult(result);
  };

  const handleApplyReschedule = () => {
    if (rescheduleResult) {
      onUpdateSchedule(rescheduleResult.redistributedSlots);
      setRescheduleResult(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Daily Routine & AI Priority Overview */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/60 border border-blue-800/40 p-6 lg:p-7 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              المخطط الدراسي اليومي الذكي • معدل وفق أهدافك الدراسية
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              جدولك اليومي للدراسة والمذاكرة والتدريب
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              تم توزيع الجلسات اليومية بين الفهم والتدريب العملي والاستراحات الموجهة. المعلم الذكي يواكب تقدمك ويقترح لك الأولوية في كل حصة لتغطية النقاط التي لا يخلو منها الامتحان.
            </p>

            {/* Quick stats in banner */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <div className="flex items-center gap-2 text-xs bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400">إنجاز اليوم:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {completedCount} من {schedule.length} مهام ({progressPercent}%)
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-slate-400">إجمالي الساعات المجدولة:</span>
                <span className="font-bold text-blue-400 font-mono">٦ ساعات و ٣٠ دقيقة</span>
              </div>
            </div>
          </div>

          {/* Pomodoro Timer Widget */}
          <div className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-5 min-w-[290px] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">
                  {timerMode === 'study' ? 'جلسة تركيز ومذاكرة (بومودورو)' : 'استراحة نشطة موجهة'}
                </span>
              </div>
              <button
                onClick={() => {
                  setTimerMode(timerMode === 'study' ? 'break' : 'study');
                  setTimerSeconds(timerMode === 'study' ? 10 * 60 : 50 * 60);
                  setIsTimerRunning(false);
                }}
                className="text-[10px] text-blue-400 hover:underline cursor-pointer"
              >
                تبديل لل{timerMode === 'study' ? 'استراحة' : 'مذاكرة'}
              </button>
            </div>

            {/* Timer Display */}
            <div className="text-center py-2 bg-slate-950 rounded-xl border border-slate-800 font-mono text-3xl font-extrabold tracking-wider text-amber-400">
              {formatTimer(timerSeconds)}
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-2 justify-center">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                  isTimerRunning
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isTimerRunning ? 'إيقاف مؤقت' : 'بدء الجلسة'}</span>
              </button>

              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(timerMode === 'study' ? 50 * 60 : 10 * 60);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                title="إعادة ضبط المؤقت"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenBreakGuide}
                className="px-3 py-2 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:bg-purple-900/40 text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
                title="فتح كبسولة نصائح الاستراحة وتحفيز فاينمان"
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>نصائح الراحة</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Actions & Add Slot Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold text-white">جدول مهام اليوم الدراسي التفاعلي</h3>
          <span className="text-xs text-slate-400 font-mono">({schedule.length} حصص وفترات)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerDynamicReschedule}
            className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>إعادة الجدولة الذكية (Dynamic Re-scheduling)</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حصة أو تدريب جديد</span>
          </button>
        </div>
      </div>

      {/* Schedule Slots List */}
      <div className="space-y-3.5">
        {schedule.map((slot, index) => {
          const isBreak = slot.slotType === 'break';

          return (
            <div
              key={slot.id}
              className={`rounded-2xl border transition-all p-4 lg:p-5 relative ${
                slot.isCompleted
                  ? 'bg-slate-900/40 border-slate-800/80 opacity-80'
                  : isBreak
                  ? 'bg-purple-950/20 border-purple-800/40 shadow-sm'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-lg'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Block: Checkbox, Time, Title */}
                <div className="flex items-start gap-3.5 flex-1">
                  {/* Completion Toggle */}
                  <button
                    onClick={() => handleToggleSlotCompleted(slot.id)}
                    className={`mt-1 w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                      slot.isCompleted
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'border-slate-600 hover:border-blue-400 text-transparent'
                    }`}
                    title={slot.isCompleted ? 'إلغاء الإكمال' : 'تحديد كمكتمل'}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Time Badge */}
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-800 text-blue-400 border border-slate-700">
                        {slot.timeStart} - {slot.timeEnd}
                      </span>

                      {/* Subject Badge */}
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-lg font-semibold ${
                          isBreak
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {slot.subjectNameAr}
                      </span>

                      {/* Slot Type */}
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800/70 text-slate-300">
                        {slot.slotType === 'study' && '📖 مذاكرة ومفاهيم'}
                        {slot.slotType === 'practice' && '✏️ تدريب وحل مسائل'}
                        {slot.slotType === 'revision' && '🔄 مراجعة ختامية'}
                        {slot.slotType === 'break' && '☕ راحة وتنفس'}
                      </span>

                      {/* Priority */}
                      {slot.priority === 'critical' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          أهمية قصوى
                        </span>
                      )}
                    </div>

                    {/* Topic Title */}
                    <h4
                      className={`text-base font-bold ${
                        slot.isCompleted ? 'text-slate-400 line-through' : 'text-white'
                      }`}
                    >
                      {slot.topic}
                    </h4>

                    {/* AI Dynamic Priority Reason */}
                    {slot.aiPriorityReason && (
                      <div className="flex items-start gap-1.5 text-xs text-indigo-300 bg-indigo-950/30 border border-indigo-800/30 rounded-xl p-2.5 mt-1.5 leading-relaxed">
                        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold">توجيه الأولوية الذكي: </span>
                          <span>{slot.aiPriorityReason}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Block: Action Buttons */}
                <div className="flex items-center flex-wrap gap-2 mr-9 lg:mr-0">
                  {!isBreak && (
                    <button
                      onClick={() => onSelectSlotForTutor(slot)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      title="بدء استشارة ومذاكرة هذا الدرس مع المعلم الذكي"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>شرح الدرس الذكي</span>
                    </button>
                  )}

                  {isBreak && (
                    <button
                      onClick={onOpenBreakGuide}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Coffee className="w-3.5 h-3.5" />
                      <span>نصائح الراحة والتحفيز</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenEditModal(slot)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                    title="تعديل توقيت أو بيانات الحصة"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                    title="حذف هذه الحصة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span>{editingSlotId ? 'تعديل موعد وحصة بالجدول' : 'إضافة حصة دراسية جديدة للجدول'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-4 text-xs">
              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">وقت البدء (س:د)</label>
                  <input
                    type="time"
                    value={formTimeStart}
                    onChange={(e) => setFormTimeStart(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">وقت الانتهاء (س:د)</label>
                  <input
                    type="time"
                    value={formTimeEnd}
                    onChange={(e) => setFormTimeEnd(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-slate-400 mb-1">المادة الدراسية</label>
                <select
                  value={formSubjectCode}
                  onChange={(e) => setFormSubjectCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="CALCULUS">التفاضل والتكامل</option>
                  <option value="ALGEBRA_SOLID_GEO">الجبر والهندسة الفراغية</option>
                  <option value="STATICS">الاستاتيكا</option>
                  <option value="DYNAMICS">الديناميكا</option>
                  <option value="PHYSICS">الفيزياء</option>
                  <option value="CHEMISTRY">الكيمياء</option>
                  <option value="LANGUAGES">اللغات</option>
                  <option value="BREAK">استراحة وتجديد النشاط</option>
                </select>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-slate-400 mb-1">عنوان الدرس / المهمة المستهدفة</label>
                <input
                  type="text"
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  placeholder="مثلاً: حل مسائل المعدلات الزمنية على الدائرة والكرة"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              {/* Type and Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">نوع الجلسة</label>
                  <select
                    value={formSlotType}
                    onChange={(e) => setFormSlotType(e.target.value as SlotType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="study">مذاكرة وفهم مفاهيم</option>
                    <option value="practice">تدريب وحل مسائل</option>
                    <option value="revision">مراجعة سريعة</option>
                    <option value="break">استراحة وتنفس</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">درجة الأولوية</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as PriorityLevel)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="critical">أهمية قصوى (مؤكدة بالامتحان)</option>
                    <option value="high">مرتفعة</option>
                    <option value="medium">متوسطة</option>
                  </select>
                </div>
              </div>

              {/* AI Reason */}
              <div>
                <label className="block text-slate-400 mb-1">سبب الأولوية أو ملاحظة شخصية</label>
                <textarea
                  value={formAiReason}
                  onChange={(e) => setFormAiReason(e.target.value)}
                  placeholder="مثلاً: حل 5 مسائل امتحانات سابقة لتثبيت الفكرة"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  حفظ في الجدول
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Re-scheduling Confirmation Modal */}
      {rescheduleResult && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <RefreshCw className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">محرك الجدولة الديناميكي (Dynamic Re-scheduling)</h3>
                  <span className="text-xs text-indigo-300 font-mono">خوارزمية موازنة العبء الدراسي التلقائية</span>
                </div>
              </div>
              <button
                onClick={() => setRescheduleResult(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results stats */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400">الحصص التي أعيد توزيعها:</span>
                <div className="text-base font-bold text-white mt-0.5">{rescheduleResult.slotsModified} حصص غير مكتملة</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400">فترة التطبيق المقترحة:</span>
                <div className="text-base font-bold text-indigo-300 mt-0.5 font-mono">١٨:٠٠ إلى ٢٢:٣٠</div>
              </div>
            </div>

            {/* Recovery strategy explanation */}
            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-800/40 text-xs text-slate-200 space-y-1.5 leading-relaxed">
              <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>استراتيجية التعافي والتركيز الذكية:</span>
              </div>
              <p>{rescheduleResult.recoveryStrategy}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRescheduleResult(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                إلغاء والاحتفاظ بالجدول الحالي
              </button>
              <button
                onClick={handleApplyReschedule}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>اعتماد وتطبيق الجدول الموزع آلياً</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

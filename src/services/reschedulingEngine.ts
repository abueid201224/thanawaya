import { DailyScheduleSlot, DynamicRescheduleResult, PriorityLevel } from '../types';

/**
 * Dynamic Re-scheduling Engine for Egyptian Thanaweya Amma (Math Section)
 * Automatically balances remaining study time when a student falls behind or misses a slot.
 */
export function calculateDynamicReschedule(
  currentSchedule: DailyScheduleSlot[],
  currentTimeString: string = '17:30'
): DynamicRescheduleResult {
  const uncompletedSlots = currentSchedule.filter((s) => !s.isCompleted && s.slotType !== 'break');
  const completedSlots = currentSchedule.filter((s) => s.isCompleted);

  // If everything is already done, return as-is
  if (uncompletedSlots.length === 0) {
    return {
      originalHours: 0,
      rescheduledHours: 0,
      slotsModified: 0,
      redistributedSlots: currentSchedule,
      recoveryStrategy: 'جميع حصص اليوم مكتملة بنجاح! لا توجد متأخرات تتطلب إعادة جدولة.',
      appliedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };
  }

  // Sort by priority: critical first, then high, then medium
  const priorityWeight: Record<PriorityLevel, number> = {
    critical: 3,
    high: 2,
    medium: 1
  };

  const sortedPending = [...uncompletedSlots].sort(
    (a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]
  );

  // Re-generate balanced evening slots from 18:00 to 22:30 with high-yield focus
  const eveningTimeline = [
    { start: '18:00', end: '19:15', duration: '75 دقيقة' },
    { start: '19:30', end: '20:45', duration: '75 دقيقة' },
    { start: '21:00', end: '22:15', duration: '75 دقيقة' }
  ];

  const rescheduledList: DailyScheduleSlot[] = [...completedSlots];
  const seenSlotKeys = new Set<string>(completedSlots.map((s) => `${s.subjectCode}_${s.topic}`));

  // Morning rollover schedule buffers for accumulated overflow
  const nextDaysTimeline = [
    { start: '08:00 (غداً)', end: '09:15 (غداً)', label: 'صباح الغد' },
    { start: '09:30 (غداً)', end: '10:45 (غداً)', label: 'صباح الغد' },
    { start: '08:00 (بعد غد)', end: '09:15 (بعد غد)', label: 'صباح بعد الغد' },
    { start: '09:30 (بعد غد)', end: '10:45 (بعد غد)', label: 'صباح بعد الغد' }
  ];

  let rolloverIndex = 0;

  sortedPending.forEach((slot, index) => {
    const slotKey = `${slot.subjectCode}_${slot.topic}`;
    // Deduplication check: avoid duplicate identical tasks
    if (seenSlotKeys.has(slotKey)) {
      return;
    }
    seenSlotKeys.add(slotKey);

    if (index < eveningTimeline.length) {
      // Allocate to optimized evening block
      rescheduledList.push({
        ...slot,
        timeStart: eveningTimeline[index].start,
        timeEnd: eveningTimeline[index].end,
        notes: `تمت إعادة الجدولة آلياً لتحقيق أعلى تركيز مسائي (${eveningTimeline[index].duration}).`,
        aiPriorityReason: `إعادة جدولة ديناميكية: تم رفع أولوية الدرس إلى الفترة المسائية لضمان عدم تأجيل النواتج الحرجة.`
      });

      // Add a smart 15-min recovery break after intensive slot if not last
      if (index < eveningTimeline.length - 1) {
        rescheduledList.push({
          id: `resched_break_${index}`,
          timeStart: eveningTimeline[index].end,
          timeEnd: eveningTimeline[index + 1].start,
          subjectCode: 'BREAK',
          subjectNameAr: 'فترة راحة واسترجاع نشط',
          topic: 'استراحة قصيرة وشرب ماء واستنشاق هواء نقي',
          slotType: 'break',
          priority: 'medium',
          isCompleted: false,
          notes: 'فترة راحة موجهة لتجديد النشاط العصبي والذهني.'
        });
      }
    } else {
      // Excess lower-priority slots rolled over smoothly to tomorrow / next morning buffers without collision
      const buffer = nextDaysTimeline[rolloverIndex % nextDaysTimeline.length];
      rolloverIndex++;

      rescheduledList.push({
        ...slot,
        id: `${slot.id}_rollover_${rolloverIndex}`,
        timeStart: buffer.start,
        timeEnd: buffer.end,
        notes: `تم استيعاب التراكم وترحيله آلياً إلى (${buffer.label}) لحماية ساعات النوم وتجنب الإجهاد الذهني الزائد.`,
        aiPriorityReason: `استيعاب التراكم: ترحيل منظم إلى موعد لاحق بدون تكرار الحصص.`,
        priority: 'medium'
      });
    }
  });

  // Sort by timeStart cleanly
  rescheduledList.sort((a, b) => a.timeStart.localeCompare(b.timeStart));

  return {
    originalHours: Math.round(uncompletedSlots.length * 1.5),
    rescheduledHours: Math.min(4, Math.round(sortedPending.length * 1.25)),
    slotsModified: uncompletedSlots.length,
    redistributedSlots: rescheduledList,
    recoveryStrategy:
      'تم الحفاظ على كافة إنجازات الطالب المكتملة، وتأمين الدروس ذات الوزن النسبي الأكبر في الفترة المسائية، مع استيعاب التراكم وترحيل الحصص المتبقية للأيام التالية دون أي تكرار.',
    appliedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
  };
}

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

  sortedPending.forEach((slot, index) => {
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
      // Excess lower-priority slots rolled over smoothly to tomorrow morning buffer
      rescheduledList.push({
        ...slot,
        timeStart: '08:00 (غداً)',
        timeEnd: '09:00 (غداً)',
        notes: 'تم ترحيل هذا الجزء آلياً إلى باكر الصباح لتجنب الإجهاد الذهني الزائد الليلة.',
        priority: 'medium'
      });
    }
  });

  // Sort by time
  const timeCompare = (a: DailyScheduleSlot, b: DailyScheduleSlot) => {
    return a.timeStart.localeCompare(b.timeStart);
  };
  rescheduledList.sort(timeCompare);

  return {
    originalHours: Math.round(uncompletedSlots.length * 1.5),
    rescheduledHours: Math.min(4, Math.round(sortedPending.length * 1.25)),
    slotsModified: uncompletedSlots.length,
    redistributedSlots: rescheduledList,
    recoveryStrategy:
      'تم تأمين الدروس ذات الوزن النسبي الأكبر (التفاضل والميكانيكا) في أفضل فترات التركيز المسائية مع حماية ساعات النوم الطبيعية وترحيل المواد التكميلية لصباح الغد.',
    appliedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
  };
}

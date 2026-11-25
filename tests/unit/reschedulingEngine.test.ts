import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDynamicReschedule } from '../../src/services/reschedulingEngine';
import type { DailyScheduleSlot } from '../../src/types';

test('calculateDynamicReschedule preserves completed slots, deduplicates topics, and rolls over overflow', () => {
  const slots: DailyScheduleSlot[] = [
    {
      id: 's_done',
      timeStart: '09:00',
      timeEnd: '10:15',
      subjectCode: 'CALCULUS',
      subjectNameAr: 'التفاضل والتكامل',
      topic: 'الاشتقاق الضمني',
      slotType: 'study',
      priority: 'high',
      isCompleted: true
    },
    {
      id: 's_dup',
      timeStart: '11:00',
      timeEnd: '12:15',
      subjectCode: 'CALCULUS',
      subjectNameAr: 'التفاضل والتكامل',
      topic: 'الاشتقاق الضمني',
      slotType: 'practice',
      priority: 'high',
      isCompleted: false
    },
    {
      id: 's_p1',
      timeStart: '13:00',
      timeEnd: '14:15',
      subjectCode: 'STATICS',
      subjectNameAr: 'الاستاتيكا',
      topic: 'الاحتكاك',
      slotType: 'practice',
      priority: 'critical',
      isCompleted: false
    },
    {
      id: 's_p2',
      timeStart: '14:30',
      timeEnd: '15:45',
      subjectCode: 'DYNAMICS',
      subjectNameAr: 'الديناميكا',
      topic: 'كمية الحركة',
      slotType: 'study',
      priority: 'high',
      isCompleted: false
    },
    {
      id: 's_p3',
      timeStart: '16:00',
      timeEnd: '17:15',
      subjectCode: 'PHYSICS',
      subjectNameAr: 'الفيزياء',
      topic: 'كيرشوف',
      slotType: 'revision',
      priority: 'medium',
      isCompleted: false
    },
    {
      id: 's_p4',
      timeStart: '17:30',
      timeEnd: '18:30',
      subjectCode: 'ALGEBRA_SOLID_GEO',
      subjectNameAr: 'الجبر والهندسة الفراغية',
      topic: 'ذات الحدين',
      slotType: 'revision',
      priority: 'medium',
      isCompleted: false
    }
  ];

  const result = calculateDynamicReschedule(slots, '17:45');

  // Completed slot stays completed
  const doneSlot = result.redistributedSlots.find((s) => s.id === 's_done');
  assert.ok(doneSlot);
  assert.equal(doneSlot?.isCompleted, true);

  // Duplicate uncompleted topic ("CALCULUS_الاشتقاق الضمني") was deduplicated
  const calcMatches = result.redistributedSlots.filter(
    (s) => s.subjectCode === 'CALCULUS' && s.topic === 'الاشتقاق الضمني'
  );
  assert.equal(calcMatches.length, 1);

  // Critical priority Statics appears in first evening block (18:00)
  const statSlot = result.redistributedSlots.find((s) => s.id === 's_p1');
  assert.equal(statSlot?.timeStart, '18:00');
});

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Serilog;
using ThanaweyaAmma.App.Models;

namespace ThanaweyaAmma.App.Services
{
    public interface IDailyPlannerService
    {
        Task<List<DailyScheduleSlot>> GetDailyScheduleAsync(DateTime date, CancellationToken cancellationToken = default);
        Task<DailyScheduleSlot> SaveSlotAsync(DailyScheduleSlot slot, CancellationToken cancellationToken = default);
        Task DeleteSlotAsync(Guid slotId, CancellationToken cancellationToken = default);
        Task<DailyScheduleSlot?> GetCurrentActiveSlotAsync(CancellationToken cancellationToken = default);
        Task<int> CalculateDailyDisciplineScoreAsync(Guid studentId, CancellationToken cancellationToken = default);
    }

    public class DailyPlannerService : IDailyPlannerService
    {
        private readonly List<DailyScheduleSlot> _inMemorySchedule = new();

        public DailyPlannerService()
        {
            SeedInitialSlots();
        }

        private void SeedInitialSlots()
        {
            _inMemorySchedule.Add(new DailyScheduleSlot
            {
                TimeStart = "15:30",
                TimeEnd = "17:00",
                SubjectCode = "CALCULUS",
                SubjectNameAr = "التفاضل والتكامل",
                Topic = "تطبيقات القيم العظمى والصغرى والمعدلات الزمنية المرتبطة",
                SlotType = "study",
                Priority = "critical",
                IsCompleted = true,
                AiPriorityReason = "أولوية قصوى: مسألة مؤكدة تشكل 14% من درجات ورقة التفاضل."
            });

            _inMemorySchedule.Add(new DailyScheduleSlot
            {
                TimeStart = "17:00",
                TimeEnd = "17:20",
                SubjectCode = "BREAK",
                SubjectNameAr = "استراحة وتجديد النشاط",
                Topic = "راحة بومودورو + تقنية الاسترجاع النشط الفوري",
                SlotType = "break",
                Priority = "medium",
                IsCompleted = true
            });

            _inMemorySchedule.Add(new DailyScheduleSlot
            {
                TimeStart = "17:20",
                TimeEnd = "18:45",
                SubjectCode = "STATICS",
                SubjectNameAr = "الاستاتيكا",
                Topic = "الاتزان العام وتطبيقات القضبان والسلالم المرتكزة",
                SlotType = "practice",
                Priority = "high",
                IsCompleted = false,
                AiPriorityReason = "تدريب عملي على 6 مسائل وزارية متدرجة الصعوبة."
            });

            _inMemorySchedule.Add(new DailyScheduleSlot
            {
                TimeStart = "19:30",
                TimeEnd = "21:00",
                SubjectCode = "PHYSICS",
                SubjectNameAr = "الفيزياء",
                Topic = "قوانين كيرشوف المعقدة وحساب التيارات في الدوائر ثلاثية الحلقات",
                SlotType = "study",
                Priority = "high",
                IsCompleted = false,
                AiPriorityReason = "إتقان استخدام الآلة الحاسبة لحل معادلات كيرشوف الثلاثية لتوفير الوقت."
            });
        }

        public Task<List<DailyScheduleSlot>> GetDailyScheduleAsync(DateTime date, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(_inMemorySchedule.ToList());
        }

        public Task<DailyScheduleSlot> SaveSlotAsync(DailyScheduleSlot slot, CancellationToken cancellationToken = default)
        {
            var existingIndex = _inMemorySchedule.FindIndex(x => x.Id == slot.Id);
            if (existingIndex >= 0)
            {
                _inMemorySchedule[existingIndex] = slot;
            }
            else
            {
                _inMemorySchedule.Add(slot);
            }

            Log.Information("[DailyPlanner] Slot '{Topic}' saved. Total slots: {Count}", slot.Topic, _inMemorySchedule.Count);
            return Task.FromResult(slot);
        }

        public Task DeleteSlotAsync(Guid slotId, CancellationToken cancellationToken = default)
        {
            _inMemorySchedule.RemoveAll(x => x.Id == slotId);
            Log.Information("[DailyPlanner] Slot ID {Id} deleted.", slotId);
            return Task.CompletedTask;
        }

        public Task<DailyScheduleSlot?> GetCurrentActiveSlotAsync(CancellationToken cancellationToken = default)
        {
            var active = _inMemorySchedule.FirstOrDefault(x => !x.IsCompleted) ?? _inMemorySchedule.FirstOrDefault();
            return Task.FromResult(active);
        }

        public Task<int> CalculateDailyDisciplineScoreAsync(Guid studentId, CancellationToken cancellationToken = default)
        {
            if (_inMemorySchedule.Count == 0) return Task.FromResult(100);

            int completed = _inMemorySchedule.Count(x => x.IsCompleted);
            int score = (int)Math.Round((double)completed / _inMemorySchedule.Count * 100);
            return Task.FromResult(score);
        }
    }
}

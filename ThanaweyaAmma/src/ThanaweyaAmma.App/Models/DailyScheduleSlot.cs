using System;
using Newtonsoft.Json;
using Postgrest.Attributes;
using Postgrest.Models;

namespace ThanaweyaAmma.App.Models
{
    [Table("daily_schedule_slots")]
    public class DailyScheduleSlot : BaseModel
    {
        [PrimaryKey("id", false)]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("student_id")]
        public Guid? StudentId { get; set; }

        [Column("time_start")]
        public string TimeStart { get; set; } = "16:00";

        [Column("time_end")]
        public string TimeEnd { get; set; } = "17:30";

        [Column("subject_code")]
        public string SubjectCode { get; set; } = "CALCULUS";

        [Column("subject_name_ar")]
        public string SubjectNameAr { get; set; } = "التفاضل والتكامل";

        [Column("topic")]
        public string Topic { get; set; } = string.Empty;

        [Column("slot_type")]
        public string SlotType { get; set; } = "study"; // "study", "practice", "revision", "break"

        [Column("priority")]
        public string Priority { get; set; } = "high"; // "critical", "high", "medium"

        [Column("is_completed")]
        public bool IsCompleted { get; set; } = false;

        [Column("ai_priority_reason")]
        public string? AiPriorityReason { get; set; }

        [Column("exam_essential_key")]
        public string? ExamEssentialKey { get; set; }

        [Column("schedule_date")]
        public DateTime ScheduleDate { get; set; } = DateTime.UtcNow.Date;

        [JsonIgnore]
        public string TimeRangeDisplay => $"{TimeStart} - {TimeEnd}";

        [JsonIgnore]
        public bool IsBreak => string.Equals(SlotType, "break", StringComparison.OrdinalIgnoreCase);
    }
}

using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Postgrest.Attributes;
using Postgrest.Models;

namespace ThanaweyaAmma.App.Models
{
    [Table("study_milestones")]
    public class StudyMilestone : BaseModel
    {
        [PrimaryKey("id", false)]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("subject_id")]
        public Guid? SubjectId { get; set; }

        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Column("description")]
        public string? Description { get; set; }

        [Column("target_month")]
        public string TargetMonth { get; set; } = "2026-10"; // '2026-10' through '2027-07'

        [Column("start_date")]
        public DateTime StartDate { get; set; }

        [Column("end_date")]
        public DateTime EndDate { get; set; }

        [Column("is_exam_milestone")]
        public bool IsExamMilestone { get; set; } = false;

        [Column("milestone_type")]
        public string MilestoneType { get; set; } = "CurriculumCoverage"; // 'CurriculumCoverage', 'MonthlyReview', 'PastPaperSolves', 'FinalRevisions', 'MinistryExam'

        [Column("learning_outcomes")]
        public List<string> LearningOutcomes { get; set; } = new();

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public bool IsCompleted { get; set; } = false;

        [JsonIgnore]
        public string DateRangeDisplay => $"{StartDate:yyyy/MM/dd} - {EndDate:yyyy/MM/dd}";
    }
}

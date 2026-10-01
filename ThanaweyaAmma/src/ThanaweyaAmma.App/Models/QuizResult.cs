using System;
using Newtonsoft.Json;
using Postgrest.Attributes;
using Postgrest.Models;

namespace ThanaweyaAmma.App.Models
{
    [Table("quiz_results")]
    public class QuizResult : BaseModel
    {
        [PrimaryKey("id", false)]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("student_id")]
        public Guid? StudentId { get; set; }

        [Column("subject_id")]
        public Guid? SubjectId { get; set; }

        [Column("quiz_title")]
        public string QuizTitle { get; set; } = string.Empty;

        [Column("quiz_type")]
        public string QuizType { get; set; } = "MCQ"; // 'MCQ', 'EssayVision', 'ComprehensiveExam'

        [Column("score")]
        public double Score { get; set; }

        [Column("max_score")]
        public double MaxScore { get; set; } = 30;

        [Column("percentage")]
        public double Percentage { get; set; }

        [Column("time_spent_seconds")]
        public int TimeSpentSeconds { get; set; }

        [Column("remedial_feedback")]
        public string? RemedialFeedback { get; set; }

        [Column("learning_outcomes_mastery")]
        public string? LearningOutcomesMasteryJson { get; set; }

        [Column("handwriting_image_url")]
        public string? HandwritingImageUrl { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public string FormattedPercentage => $"{Percentage:F1}%";
    }
}

using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Postgrest.Attributes;
using Postgrest.Models;

namespace ThanaweyaAmma.App.Models
{
    [Table("exam_essentials")]
    public class ExamEssential : BaseModel
    {
        [PrimaryKey("id", false)]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Column("subject_code")]
        public string SubjectCode { get; set; } = "CALCULUS";

        [Column("subject_name_ar")]
        public string SubjectNameAr { get; set; } = "التفاضل والتكامل";

        [Column("topic")]
        public string Topic { get; set; } = string.Empty;

        [Column("importance_rating")]
        public int ImportanceRating { get; set; } = 100;

        [Column("past_exam_occurrences")]
        public List<string> PastExamOccurrences { get; set; } = new();

        [Column("core_concept")]
        public string CoreConcept { get; set; } = string.Empty;

        [Column("exam_trap_warning")]
        public string ExamTrapWarning { get; set; } = string.Empty;

        [Column("sample_exam_question")]
        public string SampleExamQuestion { get; set; } = string.Empty;

        [Column("step_by_step_solution")]
        public string StepByStepSolution { get; set; } = string.Empty;
    }
}

using System;
using System.Collections.Generic;

namespace ThanaweyaAmma.App.Models
{
    public class McqOption
    {
        public string Key { get; set; } = "A"; // "A", "B", "C", "D"
        public string Text { get; set; } = string.Empty;
    }

    public class McqQuestion
    {
        public int Number { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public List<McqOption> Options { get; set; } = new();
        public string CorrectOptionKey { get; set; } = "A";
        public string Explanation { get; set; } = string.Empty;
        public string TargetedLearningOutcome { get; set; } = string.Empty;
        public string? SelectedOptionKey { get; set; }
    }

    public class EssayGradingEvaluation
    {
        public double ScoreAwarded { get; set; }
        public double MaxPossibleScore { get; set; }
        public string TranscriptionOfHandwriting { get; set; } = string.Empty;
        public bool MathematicalAccuracy { get; set; }
        public List<string> PositivePoints { get; set; } = new();
        public List<string> Deficiencies { get; set; } = new();
        public string RemedialGuidance { get; set; } = string.Empty;
        public string OfficialModelComparison { get; set; } = string.Empty;
    }
}

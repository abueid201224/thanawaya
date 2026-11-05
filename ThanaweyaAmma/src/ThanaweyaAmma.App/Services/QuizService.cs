using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Serilog;
using ThanaweyaAmma.App.Models;

namespace ThanaweyaAmma.App.Services
{
    public interface IQuizService
    {
        Task<List<McqQuestion>> GenerateConceptMcqExamAsync(
            string subjectCode,
            string topicName,
            int questionCount = 5,
            CancellationToken cancellationToken = default);

        Task<EssayGradingEvaluation> GradeHandwrittenEssayAsync(
            Stream handwrittenImageStream,
            string mimeType,
            string questionPrompt,
            string referenceModelAnswer,
            double maxScore = 4.0,
            CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Drafts training MCQs and advisory image-based feedback.
    /// AI output is not ministry-approved and must be reviewed by a qualified teacher before it is used
    /// for grading, mastery decisions, or progression.
    /// </summary>
    public class QuizService : IQuizService
    {
        private const int MaxHandwrittenImageBytes = 10 * 1024 * 1024;
        private static readonly HttpClient HttpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(60) };
        private readonly AppConfig _appConfig;
        private readonly ISupabaseService _supabaseService;

        public QuizService(AppConfig appConfig, ISupabaseService supabaseService)
        {
            _appConfig = appConfig ?? throw new ArgumentNullException(nameof(appConfig));
            _supabaseService = supabaseService ?? throw new ArgumentNullException(nameof(supabaseService));
        }

        public async Task<List<McqQuestion>> GenerateConceptMcqExamAsync(
            string subjectCode,
            string topicName,
            int questionCount = 5,
            CancellationToken cancellationToken = default)
        {
            Log.Information("[QuizService] Dynamically constructing {Count} MCQs for {Subject} on '{Topic}'...", questionCount, subjectCode, topicName);
            if (questionCount < 1 || questionCount > 20)
                throw new ArgumentOutOfRangeException(nameof(questionCount), "عدد الأسئلة يجب أن يكون بين 1 و20.");
            if (string.IsNullOrWhiteSpace(subjectCode) || string.IsNullOrWhiteSpace(topicName))
                throw new ArgumentException("يجب تحديد المادة والموضوع قبل إنشاء الأسئلة.");

            var apiKey = _appConfig.Credentials.GeminiApiKey;

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                Log.Information("[QuizService] Gemini API key is unavailable; no unreviewed fallback questions will be shown.");
                return new List<McqQuestion>();
            }

            try
            {
                var prompt = $@"
أنت مساعد لصياغة مسودة أسئلة تدريبية غير رسمية لطلاب الصف الثالث الثانوي (علمي رياضة).
المطلوب: صياغة {questionCount} أسئلة اختيار من متعدد (MCQ) للمادة: {subjectCode}، الموضوع: '{topicName}'.
هذه مسودة مولدة آلياً وليست امتحاناً أو محتوى معتمداً من وزارة التربية والتعليم. لا تنسب سؤالاً إلى مصدر أو امتحان رسمي، ويجب أن يراجع المعلم صحة السؤال والإجابة قبل استخدامهما في تقييم درجات أو إتقان.
الشروط:
1. الأسئلة تقيس المستويات العليا للتفكير ونواتج التعلم (فهم، تطبيق، تحليل).
2. كل سؤال يحتوي على 4 خيارات (أ، ب، ج، د) أو (A, B, C, D) مع خيار واحد صحيح وبدائل جذابة (distractors).
3. إرجاع النتيجة بصيغة JSON حصراً على النحو التالي:
[
  {{
    ""Number"": 1,
    ""QuestionText"": ""نص السؤال الرياضي أو الفيزيائي بدقة"",
    ""Options"": [
      {{ ""Key"": ""A"", ""Text"": ""الخيار الأول"" }},
      {{ ""Key"": ""B"", ""Text"": ""الخيار الثاني"" }},
      {{ ""Key"": ""C"", ""Text"": ""الخيار الثالث"" }},
      {{ ""Key"": ""D"", ""Text"": ""الخيار الرابع"" }}
    ],
    ""CorrectOptionKey"": ""A"",
    ""Explanation"": ""شرح خطوات الحل التفصيلية وسبب اختيار هذا الناتج"",
    ""TargetedLearningOutcome"": ""الناتج التعليمي المستهدف""
  }}
]
";

                var payload = new
                {
                    contents = new[]
                    {
                        new
                        {
                            role = "user",
                            parts = new[] { new { text = prompt } }
                        }
                    },
                    generationConfig = new
                    {
                        responseMimeType = "application/json",
                        temperature = 0.3
                    }
                };

                var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
                using var request = new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json")
                };
                request.Headers.TryAddWithoutValidation("x-goog-api-key", apiKey);

                using var response = await HttpClient.SendAsync(request, cancellationToken);
                response.EnsureSuccessStatusCode();

                var jsonResponse = await response.Content.ReadAsStringAsync(cancellationToken);
                var jObj = JObject.Parse(jsonResponse);
                var rawJson = jObj["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.ToString();

                if (!string.IsNullOrWhiteSpace(rawJson))
                {
                    var questions = JsonConvert.DeserializeObject<List<McqQuestion>>(rawJson);
                    if (IsValidQuestionSet(questions, questionCount))
                    {
                        Log.Information("[QuizService] Successfully generated {Count} questions via Gemini API.", questions.Count);
                        return questions!;
                    }
                }

                Log.Warning("[QuizService] Generated MCQ payload failed schema validation; returning no questions.");
                return new List<McqQuestion>();
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                Log.Error("[QuizService] MCQ generation failed. Error type: {ErrorType}", ex.GetType().Name);
                return new List<McqQuestion>();
            }
        }

        public async Task<EssayGradingEvaluation> GradeHandwrittenEssayAsync(
            Stream handwrittenImageStream,
            string mimeType,
            string questionPrompt,
            string referenceModelAnswer,
            double maxScore = 4.0,
            CancellationToken cancellationToken = default)
        {
            Log.Information("[QuizService] Initiating Gemini Vision multimodal handwriting inspection...");
            var apiKey = _appConfig.Credentials.GeminiApiKey;

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                throw new InvalidOperationException("التصحيح الآلي غير متاح حالياً لعدم إعداد خدمة الذكاء الاصطناعي. لم تُمنح أي درجة.");
            }
            if (handwrittenImageStream == null || !handwrittenImageStream.CanRead)
            {
                throw new ArgumentException("يجب توفير صورة إجابة قابلة للقراءة.", nameof(handwrittenImageStream));
            }
            if (string.IsNullOrWhiteSpace(questionPrompt) || string.IsNullOrWhiteSpace(referenceModelAnswer))
            {
                throw new ArgumentException("يجب توفير السؤال ونموذج الإجابة المرجعي قبل طلب التقييم.");
            }
            if (!double.IsFinite(maxScore) || maxScore <= 0)
            {
                throw new ArgumentOutOfRangeException(nameof(maxScore), "يجب أن تكون الدرجة العظمى رقماً موجباً ومحدداً.");
            }
            var normalizedMimeType = string.IsNullOrWhiteSpace(mimeType) ? "image/jpeg" : mimeType.Trim().ToLowerInvariant();
            if (normalizedMimeType != "image/jpeg" && normalizedMimeType != "image/png" && normalizedMimeType != "image/webp")
            {
                throw new ArgumentException("نوع الصورة المدعوم هو JPEG أو PNG أو WebP.", nameof(mimeType));
            }
            if (handwrittenImageStream.CanSeek && handwrittenImageStream.Length > MaxHandwrittenImageBytes)
            {
                throw new ArgumentException("حجم صورة الإجابة يجب ألا يتجاوز 10 ميغابايت.", nameof(handwrittenImageStream));
            }

            byte[] imageBytes;
            using (var memoryStream = new MemoryStream())
            {
                await handwrittenImageStream.CopyToAsync(memoryStream, cancellationToken);
                imageBytes = memoryStream.ToArray();
            }
            if (imageBytes.Length == 0 || imageBytes.Length > MaxHandwrittenImageBytes)
            {
                throw new ArgumentException("يجب توفير صورة غير فارغة لا يتجاوز حجمها 10 ميغابايت.", nameof(handwrittenImageStream));
            }

            var base64Image = Convert.ToBase64String(imageBytes);

            try
            {
                var evaluationPrompt = $@"
أنت مساعد تقويم آلي مبدئي لإجابة رياضية بخط اليد لطالب في المرحلة الثانوية.
التقييم استرشادي فقط، وليس تصحيحاً رسمياً أو بديلاً عن المعلم؛ لا تدّع اعتماداً وزارياً، ولا تجعل الدرجة الناتجة أساساً وحيداً لقرار مصيري.
السؤال المطروح:
{questionPrompt}

نموذج الإجابة المرجعي وتوزيع الدرجات الذي أدخله المستخدم (الدرجة العظمى: {maxScore}):
{referenceModelAnswer}

المطلوب:
1. قراءة الخط اليدوي بدقة وتفريغه (OCR Transcription).
2. التحقق من صحة الخطوات الرياضية والقوانين والتعويضات والناتج النهائي مع الوحدات.
3. اقتراح تقدير استرشادي من {maxScore}، واطلب مراجعة المعلم عند غموض الخط أو نقص المرجع.
4. تقديم تغذية راجعة علاجية ومقارنة بالنموذج المرجعي المقدم، لا بمصدر رسمي مستقل.

أرجع النتيجة بصيغة JSON حصراً بهذا المخطط:
{{
  ""ScoreAwarded"": 3.5,
  ""MaxPossibleScore"": {maxScore},
  ""TranscriptionOfHandwriting"": ""تفريغ ما كتبه الطالب"",
  ""MathematicalAccuracy"": true,
  ""PositivePoints"": [""نقطة قوة 1"", ""نقطة قوة 2""],
  ""Deficiencies"": [""نقطة ضعف إن وجدت""],
  ""RemedialGuidance"": ""إرشاد علاجي للطالب"",
  ""ReferenceAnswerComparison"": ""مقارنة استرشادية مع النموذج المرجعي الذي أدخله المستخدم""
}}
";

                var payload = new
                {
                    contents = new[]
                    {
                        new
                        {
                            role = "user",
                            parts = new object[]
                            {
                                new { text = evaluationPrompt },
                                new
                                {
                                    inlineData = new
                                    {
                                        mimeType = normalizedMimeType,
                                        data = base64Image
                                    }
                                }
                            }
                        }
                    },
                    generationConfig = new
                    {
                        responseMimeType = "application/json",
                        temperature = 0.2
                    }
                };

                var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
                using var request = new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json")
                };
                request.Headers.TryAddWithoutValidation("x-goog-api-key", apiKey);

                using var response = await HttpClient.SendAsync(request, cancellationToken);
                response.EnsureSuccessStatusCode();

                var jsonStr = await response.Content.ReadAsStringAsync(cancellationToken);
                var jObj = JObject.Parse(jsonStr);
                var rawResult = jObj["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.ToString();

                if (!string.IsNullOrWhiteSpace(rawResult))
                {
                    var result = JsonConvert.DeserializeObject<EssayGradingEvaluation>(rawResult);
                    if (result != null &&
                        !string.IsNullOrWhiteSpace(result.TranscriptionOfHandwriting) &&
                        result.PositivePoints != null &&
                        result.Deficiencies != null &&
                        !string.IsNullOrWhiteSpace(result.RemedialGuidance) &&
                        !string.IsNullOrWhiteSpace(result.ReferenceAnswerComparison) &&
                        double.IsFinite(result.ScoreAwarded) &&
                        result.ScoreAwarded >= 0 &&
                        result.ScoreAwarded <= maxScore &&
                        double.IsFinite(result.MaxPossibleScore) &&
                        Math.Abs(result.MaxPossibleScore - maxScore) < 0.000001)
                    {
                        Log.Information("[QuizService] Essay grading completed. Score: {Score}/{Max}", result.ScoreAwarded, result.MaxPossibleScore);
                        return result;
                    }
                }

                throw new InvalidOperationException("Failed to parse Gemini Vision evaluation payload.");
            }
            catch (Exception ex)
            {
                Log.Error("[QuizService] Gemini Vision essay grading failed. Error type: {ErrorType}", ex.GetType().Name);
                throw;
            }
        }

        private static bool IsValidQuestionSet(List<McqQuestion>? questions, int expectedCount)
        {
            if (questions == null || expectedCount <= 0 || questions.Count != expectedCount)
            {
                return false;
            }

            var questionNumbers = new HashSet<int>();
            var allowedOptionKeys = new HashSet<string>(new[] { "A", "B", "C", "D" }, StringComparer.OrdinalIgnoreCase);
            foreach (var question in questions)
            {
                if (question == null ||
                    question.Number < 1 || question.Number > expectedCount || !questionNumbers.Add(question.Number) ||
                    string.IsNullOrWhiteSpace(question.QuestionText) ||
                    string.IsNullOrWhiteSpace(question.Explanation) ||
                    string.IsNullOrWhiteSpace(question.TargetedLearningOutcome) ||
                    question.Options == null || question.Options.Count != 4)
                {
                    return false;
                }

                var optionKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                foreach (var option in question.Options)
                {
                    if (option == null ||
                        string.IsNullOrWhiteSpace(option.Key) ||
                        string.IsNullOrWhiteSpace(option.Text) ||
                        !allowedOptionKeys.Contains(option.Key.Trim()) ||
                        !optionKeys.Add(option.Key.Trim()))
                    {
                        return false;
                    }
                }

                var correctOptionKey = question.CorrectOptionKey?.Trim() ?? string.Empty;
                if (!allowedOptionKeys.Contains(correctOptionKey) || !optionKeys.Contains(correctOptionKey))
                {
                    return false;
                }
            }

            return true;
        }
    }
}

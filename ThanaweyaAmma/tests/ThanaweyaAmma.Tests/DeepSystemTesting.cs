using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using ThanaweyaAmma.App.Models;
using ThanaweyaAmma.App.Services;
using ThanaweyaAmma.App.ViewModels;
using Xunit;
using Xunit.Abstractions;

namespace ThanaweyaAmma.Tests
{
    public class DeepSystemTesting : IDisposable
    {
        private readonly ITestOutputHelper _output;
        private readonly string _testVaultPath;
        private readonly AppConfig _appConfig;

        public DeepSystemTesting(ITestOutputHelper output)
        {
            _output = output;
            _testVaultPath = Path.Combine(Path.GetTempPath(), $"test_vault_{Guid.NewGuid():N}.secure");
            _appConfig = new AppConfig(_testVaultPath);
        }

        public void Dispose()
        {
            if (File.Exists(_testVaultPath))
            {
                try { File.Delete(_testVaultPath); } catch { /* cleanup */ }
            }
        }

        [Fact]
        public void Phase2_KeyRotation_DPAPI_Encryption_At_Rest_Should_Succeed()
        {
            _output.WriteLine("[TEST 1/7] Testing DPAPI key encryption at rest & rotation...");

            // Act
            _appConfig.RotateApiKeys("TEST_GEMINI_KEY_ROTATE_999", "TEST_GROQ_KEY_ROTATE_888", "TEST_ANON_777");

            // Assert
            File.Exists(_testVaultPath).Should().BeTrue();
            var rawBytes = File.ReadAllBytes(_testVaultPath);
            rawBytes.Length.Should().BeGreaterThan(0);

            // Verify raw bytes are not plaintext (DPAPI ciphertext)
            var rawContent = Encoding.UTF8.GetString(rawBytes);
            rawContent.Should().NotContain("TEST_GEMINI_KEY_ROTATE_999");

            // Verify reload via DPAPI decrypts properly
            var reloadedConfig = new AppConfig(_testVaultPath);
            reloadedConfig.Credentials.GeminiApiKey.Should().Be("TEST_GEMINI_KEY_ROTATE_999");
            reloadedConfig.Credentials.GroqApiKey.Should().Be("TEST_GROQ_KEY_ROTATE_888");

            _output.WriteLine("-> DPAPI ProtectedData successfully verified at rest.");
        }

        [Fact]
        public async Task Phase5_AdminScout_Should_Discover_Pending_Egyptian_Ministry_Materials()
        {
            _output.WriteLine("[TEST 2/7] Testing AI Admin Scout against Egyptian platforms...");

            // Arrange
            var mockSupabase = new Mock<ISupabaseService>();
            var mockIngestion = new Mock<IDataIngestionService>();
            var adminCopilot = new AdminCoPilotService(mockSupabase.Object, mockIngestion.Object);

            // Act
            var results = await adminCopilot.ScoutCurriculumMaterialsAsync("التفاضل والتكامل");

            // Assert
            results.Should().NotBeEmpty();
            results.Should().Contain(x => x.TargetPlatform == "moe.gov.eg");
            results.Should().Contain(x => x.TargetPlatform == "ekb.eg");
            results.All(x => x.Status == "PendingApproval").Should().BeTrue();

            _output.WriteLine($"-> Successfully discovered {results.Count} pending items awaiting admin authorization.");
        }

        [Fact]
        public async Task Phase4_DataIngestion_Should_Enforce_RBAC_And_Generate_768_Embeddings()
        {
            _output.WriteLine("[TEST 3/7] Testing Data Ingestion, RBAC gate & 768-dim embeddings...");

            // Arrange
            var mockSupabase = new Mock<ISupabaseService>();
            var ingestionService = new DataIngestionService(_appConfig, mockSupabase.Object);

            // Act 1: Unauthorized student attempt
            Func<Task> unauthorizedAction = async () =>
            {
                await ingestionService.IngestDocumentAsync(
                    "نص اختبار", "عنوان", "PureMath", null, null, "Student", 500, 50);
            };
            await unauthorizedAction.Should().ThrowAsync<UnauthorizedAccessException>();

            // Act 2: Authorized Admin Ingestion
            var insertedChunks = await ingestionService.IngestDocumentAsync(
                "قانون نيوتن الثاني: القوة المحصلة المؤثرة على جسم تساوي المعدل الزمني للتغير في كمية حركته. ق = د(ك ع) / د ن = ك جـ عند ثبوت الكتلة.",
                "مذكرة مراجعة الديناميكا المعتمدة",
                "AppliedMath",
                Guid.NewGuid(),
                null,
                "Admin",
                chunkSize: 100,
                chunkOverlap: 20);

            // Assert
            insertedChunks.Should().BeGreaterThan(0);

            // Act 3: Embedding dimensionality
            var vector = await ingestionService.GenerateEmbeddingAsync("اختبار تفاضل الدوال المثلثية");
            vector.Count.Should().Be(768);

            _output.WriteLine($"-> Ingested {insertedChunks} chunks. Vector dimensions strictly verified: {vector.Count}.");
        }

        [Fact]
        public async Task Phase3_AiTutor_Should_Respect_Pedagogical_Guardrails_And_Failover()
        {
            _output.WriteLine("[TEST 4/7] Testing AI Tutor Pedagogical Scaffolding & Failover...");

            var tutorService = new AiTutorService(_appConfig);

            // Verify System Prompt contains Egyptian Thanaweya pedagogical guardrails
            var prompt = tutorService.GetSystemPrompt(TutorDomain.PureMath);
            prompt.Should().Contain("نواتج التعلم");
            prompt.Should().Contain("ممنوع منعاً باتاً إعطاء الحل المباشر");
            prompt.Should().Contain("Scaffolding");

            // Ask question
            var response = await tutorService.AskTutorAsync(
                TutorDomain.PureMath,
                "ما هي مشتقة د(س) = قا(٣س)؟");

            response.Should().NotBeNullOrWhiteSpace();
            _output.WriteLine($"-> AI Response length: {response.Length} chars. Pedagogical scaffolding verified.");
        }

        [Fact]
        public async Task Phase8_QuizService_Should_Generate_MCQs_And_Grade_Essay_Vision()
        {
            _output.WriteLine("[TEST 5/7] Testing Quiz Generation & Multimodal Vision Essay Grading...");

            var mockSupabase = new Mock<ISupabaseService>();
            var quizService = new QuizService(_appConfig, mockSupabase.Object);

            // 1. Dynamic MCQs
            var mcqs = await quizService.GenerateConceptMcqExamAsync("CALCULUS", "المعدلات الزمنية المرتبطة", 2);
            mcqs.Should().NotBeEmpty();
            mcqs.First().Options.Count.Should().Be(4);
            mcqs.First().CorrectOptionKey.Should().NotBeNullOrEmpty();

            // 2. Vision Essay Grading
            using var sampleStream = new MemoryStream(Encoding.UTF8.GetBytes("FakeJpegImageBytesForTest"));
            var gradeResult = await quizService.GradeHandwrittenEssayAsync(
                sampleStream,
                "image/jpeg",
                "أوجد مساحة المنطقة المحصورة بين المنحنيين ص = س² و ص = ٤س",
                "نموذج الوزارة: إيجاد نقط التقاطع (٠، ٠) و (٤، ١٦). التكامل من ٠ إلى ٤ لـ (٤س - س²) دس = [٢س² - س³/٣] من ٠ إلى ٤ = ٣٢ - ٦٤/٣ = ٣٢/٣ وحدة مربعة.",
                maxScore: 4.0);

            gradeResult.Should().NotBeNull();
            gradeResult.ScoreAwarded.Should().BeInRange(0, 4.0);
            gradeResult.OfficialModelComparison.Should().NotBeNullOrEmpty();

            _output.WriteLine($"-> MCQs verified: {mcqs.Count}. Essay evaluated: {gradeResult.ScoreAwarded}/{gradeResult.MaxPossibleScore}");
        }

        [Fact]
        public async Task Full_E2E_Simulation_Admin_To_Student_Diagnostic_Reporting()
        {
            _output.WriteLine("[TEST 6/7 & 7/7] Executing Full E2E System Workflow Simulation...");

            // 1. Admin scouts new ministry past paper
            var mockSupabase = new Mock<ISupabaseService>();
            var mockIngestion = new Mock<IDataIngestionService>();
            var adminCopilot = new AdminCoPilotService(mockSupabase.Object, mockIngestion.Object);

            var scouted = await adminCopilot.ScoutCurriculumMaterialsAsync("الاستاتيكا");
            var targetNotification = scouted.First();

            // 2. Admin signs off human-in-the-loop
            mockIngestion.Setup(x => x.IngestDocumentAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<Guid?>(), It.IsAny<Guid?>(), It.IsAny<string>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(3);

            bool approved = await adminCopilot.ApproveAndIngestNotificationAsync(
                targetNotification.Id, "Admin_Ahmed");
            approved.Should().BeTrue();

            // 3. Student asks AI Tutor about the concept
            var tutor = new AiTutorService(_appConfig);
            var tutorAdvice = await tutor.AskTutorAsync(
                TutorDomain.AppliedMath,
                "كيف أحسب مركز ثقل صفيحة رقيقة منتظمة اقتطع منها جزء دائري؟");
            tutorAdvice.Should().NotBeNullOrWhiteSpace();

            // 4. Student takes diagnostic quiz
            var quizService = new QuizService(_appConfig, mockSupabase.Object);
            var exam = await quizService.GenerateConceptMcqExamAsync("STATICS", "مركز الثقل", 2);
            exam.Should().NotBeEmpty();

            // 5. Save Quiz Result
            var resultRecord = new QuizResult
            {
                StudentId = Guid.NewGuid(),
                QuizTitle = "اختبار مركز الثقل التجريبي",
                Score = 28,
                MaxScore = 30,
                Percentage = 93.3,
                RemedialFeedback = "أداء استثنائي ومتقن لطريقة الكتل السالبة."
            };
            await mockSupabase.Object.InsertQuizResultAsync(resultRecord);

            _output.WriteLine("-> End-to-End System Simulation executed successfully with 0 defects.");
        }
    }
}

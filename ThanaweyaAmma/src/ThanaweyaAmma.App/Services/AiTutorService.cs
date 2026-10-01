using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Serilog;

namespace ThanaweyaAmma.App.Services
{
    public enum TutorDomain
    {
        PureMath,        // Calculus & Differentiation, Algebra & Solid Geometry
        AppliedMath,     // Statics & Dynamics
        PhysicsChemistry,// Physics & Chemistry
        Languages        // Arabic & English
    }

    public class ChatMessageDto
    {
        public string Role { get; set; } = "user"; // "user", "assistant", "system"
        public string Content { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public interface IAiTutorService
    {
        Task<string> AskTutorAsync(
            TutorDomain domain,
            string userQuestion,
            List<ChatMessageDto>? conversationHistory = null,
            string? contextualRagDocs = null,
            CancellationToken cancellationToken = default);

        string GetSystemPrompt(TutorDomain domain);
    }

    /// <summary>
    /// AI Tutor Service implementing specialized pedagogical agents for Egyptian Thanaweya Amma (Math Section).
    /// Features pedagogical scaffolding (no direct answers, focuses on 'نواتج التعلم الوزارية'),
    /// and an automated seamless failover loop from Groq (Llama-3.3-70b) to Google Gemini 1.5 Flash on 429 rate limits.
    /// </summary>
    public class AiTutorService : IAiTutorService
    {
        private static readonly HttpClient HttpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(45) };
        private readonly AppConfig _appConfig;

        public AiTutorService(AppConfig appConfig)
        {
            _appConfig = appConfig ?? throw new ArgumentNullException(nameof(appConfig));
        }

        public string GetSystemPrompt(TutorDomain domain)
        {
            var baseRules = @"
أنت 'المعلم الذكي الخبير' لطلاب شهادة إتمام الدراسة الثانوية العامة المصرية (شعبة الرياضيات - علمي رياضة).
ضوابط بيداغوجية وتربوية حاسمة (Pedagogical Guardrails):
1. ممنوع منعاً باتاً إعطاء الحل المباشر أو الإجابة النهائية (أ، ب، ج، د) بشكل مباشر وجاهز.
2. اعتمد استراتيجية التوجيه البنائي خطوة بخطوة (Scaffolding & Socratic Questioning) لتنشيط تفكير الطالب.
3. ركز دائماً على 'نواتج التعلم' المعتمدة من وزارة التربية والتعليم المصرية وملاحظات كتيب المفاهيم الرسمي.
4. اطلب من الطالب توضيح خطوته الأولى في التفكير قبل تزويده بالإرشاد التالي.
5. إذا أخطأ الطالب، بيّن له موضع الخلل الرياضي أو الفيزيائي بسؤال توجيهي دون إحباط.
6. استخدم صياغة رياضية وعلمية دقيقة وتنسيق LaTeX أو معادلات واضحة باللغة العربية والإنجليزية.
";

            return domain switch
            {
                TutorDomain.PureMath => baseRules + @"
مجال التخصص: الرياضيات البحتة (التفاضل والتكامل، الجبر العام والهندسة الفراغية).
المفاهيم المحورية:
- الاشتقاق الضمني والبارامتري والمعدلات الزمنية المرتبطة.
- نهايات العدد النيبيري (e) وتكاملات الدوال الأسية واللوغاريتمية.
- رسم المنحنيات والقيم العظمى والصغرى ونقاط الانقلاب والتحدب.
- مبدأ العد والتباديل والتوافيق ونظرية ذات الحدين والحد المشتمل على س^ك.
- محددات ومصفوفات ورتبة المصفوفة وقاعدة كرامر.
- الأعداد المركبة (الصورة المثلثية والأوسية ونظرية ديموافر والجذور النونية).
- معادلات المستقيم والمستوى والبعد العمودي والزاوية بين مستويين في الفراغ.",

                TutorDomain.AppliedMath => baseRules + @"
مجال التخصص: الرياضيات التطبيقية (الاستاتيكا والديناميكا).
المفاهيم المحورية:
- اتزان جسم على مستوى أفقي ومائل خشن وقوى الاحتكاك السكوني والحركي.
- عزوم القوى المستوية والفضائية ثلاثية الأبعاد وذراع العزم.
- القوى المتوازية المستوية ومحصلتها وشروط الاتزان العام (قضبان، سلالم).
- الازدواجات ومركز الثقل وطريقة الكتل السالبة.
- تفاضل وتكامل الدوال المتجهة وكمية الحركة وقوانين نيوتن الثلاثة.
- الدفع والتصادم ومبدأ الشغل وطاقة الحركة وحفظ الطاقة الميكانيكية والقدرة.",

                TutorDomain.PhysicsChemistry => baseRules + @"
مجال التخصص: العلوم الفيزيائية والكيميائية (الفيزياء والكيمياء لثانوية عامة).
المفاهيم المحورية:
- فيزياء: كيرشوف وتوصيل المقاومات، التأثير المغناطيسي، الحث الكهرومغناطيسي، المحول والدينامو، والفيزياء الحديثة (كومتون، التأثير الكهروضوئي، الليزر، أشباه الموصلات).
- كيمياء: عناصر السلسلة الانتقالية الأولى وحالات التأكسد، الاتزان الكيميائي والتحليل الحجمي والترسيب، الكيمياء الكهربية وخلايا جلفانية والصدأ، والكيمياء العضوية وتسميات وتفاعلات الهيدروكربونات ومشتقاتها.",

                TutorDomain.Languages => baseRules + @"
مجال التخصص: اللغات والإنسانيات (اللغة العربية واللغة الإنجليزية).
المفاهيم المحورية:
- لغة عربية: فنيات النحو الإعرابي المتقدم، قواعد الإملاء والبلاغة الحديثة، القراءة والنصوص المتحررة وصياغة المقال التعبيري الموزون.
- لغة إنجليزية: التراكيب النحوية المتقدمة، حروف الجر والمصطلحات، سؤال القطعة المتحررة، الترجمة الدقيقة وكتابة المقال المقالي (Analytical Essay).",

                _ => baseRules
            };
        }

        public async Task<string> AskTutorAsync(
            TutorDomain domain,
            string userQuestion,
            List<ChatMessageDto>? conversationHistory = null,
            string? contextualRagDocs = null,
            CancellationToken cancellationToken = default)
        {
            string systemPrompt = GetSystemPrompt(domain);

            if (!string.IsNullOrWhiteSpace(contextualRagDocs))
            {
                systemPrompt += $"\n\n[سياق موثق من مراجع وكتب الوزارة المعتمدة RAG]:\n{contextualRagDocs}";
            }

            // Attempt 1: Try Primary Provider (Groq API - fast response)
            var groqKey = _appConfig.Credentials.GroqApiKey;
            if (!string.IsNullOrWhiteSpace(groqKey))
            {
                try
                {
                    Log.Information("[AiTutorService] Dispatching question to primary provider (Groq - Llama-3.3-70b)...");
                    return await CallGroqApiAsync(groqKey, systemPrompt, userQuestion, conversationHistory, cancellationToken);
                }
                catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.TooManyRequests || ex.Message.Contains("429"))
                {
                    Log.Warning("[AiTutorService] Groq API rate limit (429) hit! Initiating instant seamless fallback to Google Gemini 1.5 Flash.");
                }
                catch (Exception ex)
                {
                    Log.Warning(ex, "[AiTutorService] Groq request failed. Triggering seamless failover to Gemini 1.5 Flash.");
                }
            }

            // Attempt 2: Automated Failover to Google Gemini 1.5 Flash
            var geminiKey = _appConfig.Credentials.GeminiApiKey;
            if (!string.IsNullOrWhiteSpace(geminiKey))
            {
                try
                {
                    Log.Information("[AiTutorService] Executing request on secondary provider (Gemini 1.5 Flash)...");
                    return await CallGeminiFlashApiAsync(geminiKey, systemPrompt, userQuestion, conversationHistory, cancellationToken);
                }
                catch (Exception ex)
                {
                    Log.Error(ex, "[AiTutorService] Gemini failover execution encountered an error.");
                }
            }

            // Offline / Resilient Local Scaffolding Guidance (in case no keys configured yet)
            Log.Warning("[AiTutorService] All remote providers unavailable or unconfigured. Returning pedagogical local scaffolding guidance.");
            return GenerateOfflinePedagogicalGuidance(domain, userQuestion);
        }

        private async Task<string> CallGroqApiAsync(
            string apiKey,
            string systemPrompt,
            string userQuestion,
            List<ChatMessageDto>? history,
            CancellationToken cancellationToken)
        {
            var messages = new List<object>
            {
                new { role = "system", content = systemPrompt }
            };

            if (history != null)
            {
                foreach (var msg in history)
                {
                    messages.Add(new { role = msg.Role, content = msg.Content });
                }
            }

            messages.Add(new { role = "user", content = userQuestion });

            var payload = new
            {
                model = "llama-3.3-70b-versatile",
                messages,
                temperature = 0.4,
                max_tokens = 1500
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions")
            {
                Content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json")
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            using var response = await HttpClient.SendAsync(request, cancellationToken);
            if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
            {
                throw new HttpRequestException("429 Too Many Requests", null, System.Net.HttpStatusCode.TooManyRequests);
            }

            response.EnsureSuccessStatusCode();
            var jsonString = await response.Content.ReadAsStringAsync(cancellationToken);
            var obj = JObject.Parse(jsonString);
            return obj["choices"]?[0]?["message"]?["content"]?.ToString() ?? "عفواً، لم أستطع صياغة الإجابة.";
        }

        private async Task<string> CallGeminiFlashApiAsync(
            string apiKey,
            string systemPrompt,
            string userQuestion,
            List<ChatMessageDto>? history,
            CancellationToken cancellationToken)
        {
            var contents = new List<object>();

            // Convert history
            if (history != null)
            {
                foreach (var msg in history)
                {
                    var role = msg.Role == "assistant" ? "model" : "user";
                    contents.Add(new
                    {
                        role,
                        parts = new[] { new { text = msg.Content } }
                    });
                }
            }

            contents.Add(new
            {
                role = "user",
                parts = new[] { new { text = userQuestion } }
            });

            var payload = new
            {
                systemInstruction = new
                {
                    parts = new[] { new { text = systemPrompt } }
                },
                contents,
                generationConfig = new
                {
                    temperature = 0.4,
                    maxOutputTokens = 2048
                }
            };

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}";
            var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json")
            };

            using var response = await HttpClient.SendAsync(request, cancellationToken);
            response.EnsureSuccessStatusCode();

            var jsonString = await response.Content.ReadAsStringAsync(cancellationToken);
            var obj = JObject.Parse(jsonString);
            return obj["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.ToString() 
                   ?? "مرحباً بك يا بطل الثانوية العامة! لنفكر معاً في معطيات مسألتك.";
        }

        private string GenerateOfflinePedagogicalGuidance(TutorDomain domain, string question)
        {
            return $@"أهلاً بك يا مهندس المستقبل! 📐
أنا معك لمعاونتك في مادة {domain}. سؤالك يدور حول:
""{question}""

💡 **الخطوة الأولى في التفكير (بيداغوجيا حل المشكلات):**
1. ما هي المعطيات الرياضية أو الفيزيائية المباشرة المستخرجة من رأس المسألة؟
2. ما هو القانون أو النظرية الأساسية الواردة في كتيب المفاهيم الوزاري المرتبطة بهذه الحالة؟
3. هل جربت كتابة معادلة الحركة أو الاتزان أو الاشتقاق المبدئي؟

اكتب لي خطوتك الأولى وسأقوم بتصويبها وتوجيهك فوراً للوصول للحل الصحيح بنفسك!";
        }
    }
}

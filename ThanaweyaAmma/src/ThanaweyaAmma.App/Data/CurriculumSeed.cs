using System;
using System.Collections.Generic;
using ThanaweyaAmma.App.Models;

namespace ThanaweyaAmma.App.Data
{
    public static class CurriculumSeed
    {
        public static List<Subject> GetInitialSubjects()
        {
            return new List<Subject>
            {
                new Subject
                {
                    Id = Guid.Parse("a0000001-0000-0000-0000-000000000001"),
                    Code = "CALCULUS",
                    NameAr = "التفاضل والتكامل",
                    NameEn = "Calculus & Differentiation",
                    Category = "Pure Mathematics",
                    TotalMarks = 30,
                    PassingMarks = 15,
                    ColorHex = "#2563EB",
                    IconName = "FunctionSquare"
                },
                new Subject
                {
                    Id = Guid.Parse("a0000001-0000-0000-0000-000000000002"),
                    Code = "ALGEBRA_SOLID_GEO",
                    NameAr = "الجبر والهندسة الفراغية",
                    NameEn = "Algebra & Solid Geometry",
                    Category = "Pure Mathematics",
                    TotalMarks = 30,
                    PassingMarks = 15,
                    ColorHex = "#7C3AED",
                    IconName = "Cube"
                },
                new Subject
                {
                    Id = Guid.Parse("a0000001-0000-0000-0000-000000000003"),
                    Code = "STATICS",
                    NameAr = "الاستاتيكا",
                    NameEn = "Statics",
                    Category = "Applied Mathematics",
                    TotalMarks = 30,
                    PassingMarks = 15,
                    ColorHex = "#D97706",
                    IconName = "Scale"
                },
                new Subject
                {
                    Id = Guid.Parse("a0000001-0000-0000-0000-000000000004"),
                    Code = "DYNAMICS",
                    NameAr = "الديناميكا",
                    NameEn = "Dynamics",
                    Category = "Applied Mathematics",
                    TotalMarks = 30,
                    PassingMarks = 15,
                    ColorHex = "#EA580C",
                    IconName = "Zap"
                },
                new Subject
                {
                    Id = Guid.Parse("a0000001-0000-0000-0000-000000000005"),
                    Code = "PHYSICS",
                    NameAr = "الفيزياء",
                    NameEn = "Physics",
                    Category = "Physical Sciences",
                    TotalMarks = 60,
                    PassingMarks = 30,
                    ColorHex = "#059669",
                    IconName = "Atom"
                },
                new Subject
                {
                    Id = Guid.Parse("a0000001-0000-0000-0000-000000000006"),
                    Code = "CHEMISTRY",
                    NameAr = "الكيمياء",
                    NameEn = "Chemistry",
                    Category = "Physical Sciences",
                    TotalMarks = 60,
                    PassingMarks = 30,
                    ColorHex = "#0891B2",
                    IconName = "FlaskConical"
                },
                new Subject
                {
                    Id = Guid.Parse("a0000001-0000-0000-0000-000000000007"),
                    Code = "ARABIC",
                    NameAr = "اللغة العربية",
                    NameEn = "Arabic Language",
                    Category = "Languages",
                    TotalMarks = 80,
                    PassingMarks = 40,
                    ColorHex = "#DC2626",
                    IconName = "BookMarked"
                },
                new Subject
                {
                    Id = Guid.Parse("a0000001-0000-0000-0000-000000000008"),
                    Code = "ENGLISH",
                    NameAr = "اللغة الإنجليزية",
                    NameEn = "English Language",
                    Category = "Languages",
                    TotalMarks = 50,
                    PassingMarks = 25,
                    ColorHex = "#4B5563",
                    IconName = "Globe"
                }
            };
        }

        public static List<StudyMilestone> GetInitialMilestones()
        {
            return new List<StudyMilestone>
            {
                new StudyMilestone
                {
                    Title = "اشتقاق الدوال المثلثية وتطبيقات المعدلات الزمنية",
                    Description = "الوحدة الأولى تفاضل وتكامل: الاشتقاق الضمني والبارامتري والمعدلات المرتبطة بالزمن",
                    TargetMonth = "2026-10",
                    StartDate = new DateTime(2026, 10, 1),
                    EndDate = new DateTime(2026, 10, 31),
                    MilestoneType = "CurriculumCoverage",
                    LearningOutcomes = new List<string> { "إتقان اشتقاق قا، قتا، ظتا", "حل مسائل المعدلات الزمنية الهندسية والفيزيائية" }
                },
                new StudyMilestone
                {
                    Title = "الاحتكاك وعزوم القوى حول نقطة في الفراغ",
                    Description = "الوحدتان 1 و 2 استاتيكا: اتزان جسم على مستوى خشن وحساب العزوم باتجاهات المتجهات",
                    TargetMonth = "2026-10",
                    StartDate = new DateTime(2026, 10, 1),
                    EndDate = new DateTime(2026, 10, 31),
                    MilestoneType = "CurriculumCoverage",
                    LearningOutcomes = new List<string> { "التمييز بين الاحتكاك النهائي وغير النهائي", "حساب عزم قوة ثلاثية الأبعاد وذراع العزم" }
                },
                new StudyMilestone
                {
                    Title = "الدوال الأسية واللوغاريتمية وتفاضل وتكامل الدوال المتجهة",
                    Description = "الوحدة الثانية تفاضل والوحدة الأولى ديناميكا: العدد النيبيري وقوانين نيوتن 1، 2",
                    TargetMonth = "2026-11",
                    StartDate = new DateTime(2026, 11, 1),
                    EndDate = new DateTime(2026, 11, 30),
                    MilestoneType = "CurriculumCoverage",
                    LearningOutcomes = new List<string> { "تطبيق قواعد التكامل بالتعويض والتجزيء", "تفاضل متجهات الموضع والسرعة والعجلة" }
                },
                new StudyMilestone
                {
                    Title = "مبدأ العد ونظرية ذات الحدين والمحددات والمصفوفات",
                    Description = "الوحدتان 1 و 2 جبر وهندسة فراغية",
                    TargetMonth = "2026-12",
                    StartDate = new DateTime(2026, 12, 1),
                    EndDate = new DateTime(2026, 12, 31),
                    MilestoneType = "CurriculumCoverage",
                    LearningOutcomes = new List<string> { "إيجاد رتبة المصفوفة وقاعدة كرامر", "حساب الحد المشتمل على س^ك والحد الخالي من س" }
                },
                new StudyMilestone
                {
                    Title = "الامتحانات التجريبية والمراجعة الشاملة للنصف الأول",
                    Description = "محاكاة شاملة ومؤشرات قياس أداء منتصف العام الأكاديمي",
                    TargetMonth = "2027-01",
                    StartDate = new DateTime(2027, 1, 1),
                    EndDate = new DateTime(2027, 1, 31),
                    MilestoneType = "MonthlyReview",
                    LearningOutcomes = new List<string> { "إدارة الوقت في ورقة الامتحان", "تحليل الأخطاء المفاهيمية ومعالجتها فورياً" }
                },
                new StudyMilestone
                {
                    Title = "رسم المنحنيات والقيم العظمى والصغرى والاتزان العام",
                    Description = "الوحدة 3 تفاضل والوحدات 3، 4 استاتيكا",
                    TargetMonth = "2027-02",
                    StartDate = new DateTime(2027, 2, 1),
                    EndDate = new DateTime(2027, 2, 28),
                    MilestoneType = "CurriculumCoverage",
                    LearningOutcomes = new List<string> { "تطبيقات القيم العظمى المطلقة والمحلية", "اتزان السلالم والقضبان المفصلية" }
                },
                new StudyMilestone
                {
                    Title = "الأعداد المركبة ومعادلة المستقيم والمستوى في الفراغ والدفع والتصادم",
                    Description = "الوحدة 3 جبر وفراغية والوحدتان 3 و 4 ديناميكا",
                    TargetMonth = "2027-03",
                    StartDate = new DateTime(2027, 3, 1),
                    EndDate = new DateTime(2027, 3, 31),
                    MilestoneType = "CurriculumCoverage",
                    LearningOutcomes = new List<string> { "نظرية ديموافر والجذور التكعيبية للواحد الصحيح", "قوانين الشغل وطاقة الحركة وحفظ كمية الحركة" }
                },
                new StudyMilestone
                {
                    Title = "الفيزياء الحديثة والكيمياء العضوية الشاملة",
                    Description = "الأطياف الذرية والليزر وأشباه الموصلات والهيدروكربونات ومشتقاتها",
                    TargetMonth = "2027-04",
                    StartDate = new DateTime(2027, 4, 1),
                    EndDate = new DateTime(2027, 4, 30),
                    MilestoneType = "CurriculumCoverage",
                    LearningOutcomes = new List<string> { "معادلات التحويلات العضوية والتسميات", "ظاهرة كومتون وإشعاع الجسم الأسود" }
                },
                new StudyMilestone
                {
                    Title = "ماراثون حل امتحانات الثانوية العامة للأعوام السابقة (2021 - 2026)",
                    Description = "حل أكثر من 30 نموذج امتحاني رسمي مع تدريب البابل شيت",
                    TargetMonth = "2027-05",
                    StartDate = new DateTime(2027, 5, 1),
                    EndDate = new DateTime(2027, 5, 31),
                    MilestoneType = "PastPaperSolves",
                    LearningOutcomes = new List<string> { "إتقان فنيات الأسئلة متدرجة الصعوبة (A, B, C)", "التكيف مع ضغط الامتحان الفعلي" }
                },
                new StudyMilestone
                {
                    Title = "معسكر المراجعة النهائية وكبسولات المفاهيم الوزارية",
                    Description = "مراجعات ليالي الامتحان المركزة والملخصات الذهنية الشاملة",
                    TargetMonth = "2027-06",
                    StartDate = new DateTime(2027, 6, 1),
                    EndDate = new DateTime(2027, 6, 20),
                    MilestoneType = "FinalRevisions",
                    LearningOutcomes = new List<string> { "تثبيت الروابط بين الفروع الرياضية والفيزيائية", "استحضار القوانين في ثوانٍ معدودة" }
                },
                new StudyMilestone
                {
                    Title = "امتحانات شهادة الثانوية العامة الرسمية 2027",
                    Description = "أداء امتحانات الدور الأول لشهادة الثانوية العامة الرسمية",
                    TargetMonth = "2027-07",
                    StartDate = new DateTime(2027, 7, 1),
                    EndDate = new DateTime(2027, 7, 25),
                    MilestoneType = "MinistryExam",
                    IsExamMilestone = true,
                    LearningOutcomes = new List<string> { "تحقيق الدرجات النهائية والالتحاق بكليات القمة" }
                }
            };
        }
    }
}

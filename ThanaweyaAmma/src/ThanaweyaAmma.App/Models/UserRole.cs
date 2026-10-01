using System;

namespace ThanaweyaAmma.App.Models
{
    public enum UserRole
    {
        Student,
        SupervisorAdmin
    }

    public class UserSession
    {
        public Guid UserId { get; set; } = Guid.NewGuid();
        public string FullName { get; set; } = "أحمد محمود القاضي";
        public string Email { get; set; } = "student@thanaweya.edu.eg";
        public string SeatingNumber { get; set; } = "٤٨١٩٢٠";
        public UserRole Role { get; set; } = UserRole.Student;
        public int DailyStreak { get; set; } = 18;
        public int DisciplineScore { get; set; } = 94;
        public int PreferredStudyHours { get; set; } = 7;
        public string TargetFaculty { get; set; } = "كلية الهندسة - جامعة القاهرة";
        public string Governorate { get; set; } = "القاهرة";

        public bool IsAdmin => Role == UserRole.SupervisorAdmin;
    }
}

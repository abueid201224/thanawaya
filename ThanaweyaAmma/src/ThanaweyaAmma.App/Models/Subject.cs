using System;
using Newtonsoft.Json;
using Postgrest.Attributes;
using Postgrest.Models;

namespace ThanaweyaAmma.App.Models
{
    [Table("subjects")]
    public class Subject : BaseModel
    {
        [PrimaryKey("id", false)]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("code")]
        public string Code { get; set; } = string.Empty;

        [Column("name_ar")]
        public string NameAr { get; set; } = string.Empty;

        [Column("name_en")]
        public string NameEn { get; set; } = string.Empty;

        [Column("category")]
        public string Category { get; set; } = string.Empty;

        [Column("total_marks")]
        public int TotalMarks { get; set; } = 60;

        [Column("passing_marks")]
        public int PassingMarks { get; set; } = 30;

        [Column("color_hex")]
        public string ColorHex { get; set; } = "#2563EB";

        [Column("icon_name")]
        public string IconName { get; set; } = "BookOpen";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public string DisplayTitle => $"{NameAr} ({NameEn})";
    }
}

using System;
using Newtonsoft.Json;
using Postgrest.Attributes;
using Postgrest.Models;

namespace ThanaweyaAmma.App.Models
{
    [Table("multimedia_library")]
    public class MultimediaItem : BaseModel
    {
        [PrimaryKey("id", false)]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Column("description")]
        public string? Description { get; set; }

        [Column("file_type")]
        public string FileType { get; set; } = "Video"; // 'Audio', 'Video', 'Doc'

        [Column("file_url")]
        public string FileUrl { get; set; } = string.Empty;

        [Column("subject_id")]
        public Guid? SubjectId { get; set; }

        [Column("upload_date")]
        public DateTime UploadDate { get; set; } = DateTime.UtcNow;

        [Column("source_type")]
        public string SourceType { get; set; } = "Web"; // 'Local', 'Web'

        [Column("file_size_bytes")]
        public long FileSizeBytes { get; set; }

        [Column("duration_seconds")]
        public int DurationSeconds { get; set; }

        [Column("thumbnail_url")]
        public string? ThumbnailUrl { get; set; }

        [Column("curator")]
        public string Curator { get; set; } = "Admin"; // 'Admin', 'AI Scout Agent'

        [Column("is_verified")]
        public bool IsVerified { get; set; } = false;

        [JsonIgnore]
        public string FormattedDuration => DurationSeconds > 0 
            ? TimeSpan.FromSeconds(DurationSeconds).ToString(@"mm\:ss") 
            : "--:--";

        [JsonIgnore]
        public bool IsVideo => string.Equals(FileType, "Video", StringComparison.OrdinalIgnoreCase);

        [JsonIgnore]
        public bool IsAudio => string.Equals(FileType, "Audio", StringComparison.OrdinalIgnoreCase);

        [JsonIgnore]
        public bool IsDoc => string.Equals(FileType, "Doc", StringComparison.OrdinalIgnoreCase);
    }
}

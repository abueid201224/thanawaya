using System;
using Newtonsoft.Json;
using Postgrest.Attributes;
using Postgrest.Models;

namespace ThanaweyaAmma.App.Models
{
    [Table("admin_notifications")]
    public class AdminNotification : BaseModel
    {
        [PrimaryKey("id", false)]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Column("summary")]
        public string Summary { get; set; } = string.Empty;

        [Column("source_url")]
        public string SourceUrl { get; set; } = string.Empty;

        [Column("target_platform")]
        public string TargetPlatform { get; set; } = "moe.gov.eg"; // 'moe.gov.eg', 'nagwa.com', 'ekb.eg'

        [Column("suggested_subject_id")]
        public Guid? SuggestedSubjectId { get; set; }

        [Column("detected_file_type")]
        public string DetectedFileType { get; set; } = "Doc";

        [Column("status")]
        public string Status { get; set; } = "PendingApproval"; // 'PendingApproval', 'Approved', 'Rejected', 'Ingested'

        [Column("discovered_at")]
        public DateTime DiscoveredAt { get; set; } = DateTime.UtcNow;

        [Column("reviewed_at")]
        public DateTime? ReviewedAt { get; set; }

        [Column("reviewed_by")]
        public string? ReviewedBy { get; set; }

        [JsonIgnore]
        public bool IsPending => string.Equals(Status, "PendingApproval", StringComparison.OrdinalIgnoreCase);
    }
}

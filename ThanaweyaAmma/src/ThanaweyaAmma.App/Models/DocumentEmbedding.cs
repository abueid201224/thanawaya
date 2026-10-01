using System;
using System.Collections.Generic;
using Postgrest.Attributes;
using Postgrest.Models;

namespace ThanaweyaAmma.App.Models
{
    [Table("document_embeddings")]
    public class DocumentEmbedding : BaseModel
    {
        [PrimaryKey("id", false)]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("subject_id")]
        public Guid? SubjectId { get; set; }

        [Column("multimedia_id")]
        public Guid? MultimediaId { get; set; }

        [Column("content_chunk")]
        public string ContentChunk { get; set; } = string.Empty;

        [Column("source_title")]
        public string SourceTitle { get; set; } = string.Empty;

        [Column("topic_category")]
        public string TopicCategory { get; set; } = string.Empty;

        [Column("page_number")]
        public int? PageNumber { get; set; }

        [Column("chunk_index")]
        public int ChunkIndex { get; set; } = 0;

        [Column("embedding")]
        public List<float> Embedding { get; set; } = new(768);

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

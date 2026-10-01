using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Postgrest;
using Serilog;
using Supabase;
using ThanaweyaAmma.App.Models;

namespace ThanaweyaAmma.App.Services
{
    public interface ISupabaseService
    {
        Task InitializeAsync(CancellationToken cancellationToken = default);
        Task<List<Subject>> GetSubjectsAsync(CancellationToken cancellationToken = default);
        Task<List<StudyMilestone>> GetMilestonesAsync(CancellationToken cancellationToken = default);
        Task<List<MultimediaItem>> GetMultimediaLibraryAsync(string? filterFileType = null, CancellationToken cancellationToken = default);
        Task<List<AdminNotification>> GetAdminNotificationsAsync(bool pendingOnly = true, CancellationToken cancellationToken = default);
        Task UpdateAdminNotificationStatusAsync(Guid notificationId, string status, string reviewer, CancellationToken cancellationToken = default);
        Task InsertQuizResultAsync(QuizResult result, CancellationToken cancellationToken = default);
        Task AddMultimediaItemAsync(MultimediaItem item, CancellationToken cancellationToken = default);
        Task<List<DocumentEmbedding>> MatchEmbeddingsAsync(List<float> queryEmbedding, float matchThreshold = 0.65f, int matchCount = 5, Guid? subjectId = null, CancellationToken cancellationToken = default);
    }

    public class SupabaseService : ISupabaseService
    {
        private readonly AppConfig _appConfig;
        private Supabase.Client? _client;
        private bool _isInitialized;

        public SupabaseService(AppConfig appConfig)
        {
            _appConfig = appConfig ?? throw new ArgumentNullException(nameof(appConfig));
        }

        public async Task InitializeAsync(CancellationToken cancellationToken = default)
        {
            if (_isInitialized) return;

            try
            {
                var creds = _appConfig.Credentials;
                if (string.IsNullOrWhiteSpace(creds.SupabaseUrl) || string.IsNullOrWhiteSpace(creds.SupabaseAnonKey))
                {
                    Log.Warning("[SupabaseService] Supabase URL or Anon Key is missing. Operating in offline/mock fallback mode.");
                    _isInitialized = true;
                    return;
                }

                var options = new SupabaseOptions
                {
                    AutoRefreshToken = true,
                    AutoConnectRealtime = true
                };

                _client = new Supabase.Client(creds.SupabaseUrl, creds.SupabaseAnonKey, options);
                await _client.InitializeAsync();
                _isInitialized = true;
                Log.Information("[SupabaseService] Supabase Client successfully initialized against {Url}", creds.SupabaseUrl);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[SupabaseService] Failed to initialize Supabase client.");
                _isInitialized = true; // Still allow app to boot with seed fallbacks
            }
        }

        public async Task<List<Subject>> GetSubjectsAsync(CancellationToken cancellationToken = default)
        {
            if (_client == null) return Data.CurriculumSeed.GetInitialSubjects();

            try
            {
                var response = await _client.From<Subject>()
                    .Order(x => x.NameAr, Constants.Ordering.Ascending)
                    .Get(cancellationToken);

                return response.Models.Count > 0 ? response.Models : Data.CurriculumSeed.GetInitialSubjects();
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "[SupabaseService] Failed to fetch subjects from remote. Using fallback.");
                return Data.CurriculumSeed.GetInitialSubjects();
            }
        }

        public async Task<List<StudyMilestone>> GetMilestonesAsync(CancellationToken cancellationToken = default)
        {
            if (_client == null) return Data.CurriculumSeed.GetInitialMilestones();

            try
            {
                var response = await _client.From<StudyMilestone>()
                    .Order(x => x.StartDate, Constants.Ordering.Ascending)
                    .Get(cancellationToken);

                return response.Models.Count > 0 ? response.Models : Data.CurriculumSeed.GetInitialMilestones();
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "[SupabaseService] Failed to fetch milestones from remote. Using fallback.");
                return Data.CurriculumSeed.GetInitialMilestones();
            }
        }

        public async Task<List<MultimediaItem>> GetMultimediaLibraryAsync(string? filterFileType = null, CancellationToken cancellationToken = default)
        {
            if (_client == null) return new List<MultimediaItem>();

            try
            {
                var query = _client.From<MultimediaItem>();
                if (!string.IsNullOrEmpty(filterFileType))
                {
                    query = (Postgrest.Table<MultimediaItem>)query.Filter(x => x.FileType, Constants.Operator.Equals, filterFileType);
                }

                var response = await query.Order(x => x.UploadDate, Constants.Ordering.Descending).Get(cancellationToken);
                return response.Models;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[SupabaseService] Error retrieving multimedia library items.");
                return new List<MultimediaItem>();
            }
        }

        public async Task<List<AdminNotification>> GetAdminNotificationsAsync(bool pendingOnly = true, CancellationToken cancellationToken = default)
        {
            if (_client == null) return new List<AdminNotification>();

            try
            {
                var query = _client.From<AdminNotification>();
                if (pendingOnly)
                {
                    query = (Postgrest.Table<AdminNotification>)query.Filter(x => x.Status, Constants.Operator.Equals, "PendingApproval");
                }

                var response = await query.Order(x => x.DiscoveredAt, Constants.Ordering.Descending).Get(cancellationToken);
                return response.Models;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[SupabaseService] Error fetching admin notifications.");
                return new List<AdminNotification>();
            }
        }

        public async Task UpdateAdminNotificationStatusAsync(Guid notificationId, string status, string reviewer, CancellationToken cancellationToken = default)
        {
            if (_client == null) return;

            try
            {
                await _client.From<AdminNotification>()
                    .Where(x => x.Id == notificationId)
                    .Set(x => x.Status, status)
                    .Set(x => x.ReviewedAt, DateTime.UtcNow)
                    .Set(x => x.ReviewedBy, reviewer)
                    .Update(cancellationToken: cancellationToken);

                Log.Information("[SupabaseService] Notification {Id} updated to status {Status} by {Reviewer}", notificationId, status, reviewer);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[SupabaseService] Failed to update notification {Id}", notificationId);
                throw;
            }
        }

        public async Task InsertQuizResultAsync(QuizResult result, CancellationToken cancellationToken = default)
        {
            if (_client == null) return;

            try
            {
                await _client.From<QuizResult>().Insert(result, cancellationToken: cancellationToken);
                Log.Information("[SupabaseService] Successfully persisted quiz result for quiz '{Title}'", result.QuizTitle);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[SupabaseService] Failed to insert quiz result.");
                throw;
            }
        }

        public async Task AddMultimediaItemAsync(MultimediaItem item, CancellationToken cancellationToken = default)
        {
            if (_client == null) return;

            try
            {
                await _client.From<MultimediaItem>().Insert(item, cancellationToken: cancellationToken);
                Log.Information("[SupabaseService] Multimedia item '{Title}' ({Type}) added to library.", item.Title, item.FileType);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[SupabaseService] Failed to add multimedia item.");
                throw;
            }
        }

        public async Task<List<DocumentEmbedding>> MatchEmbeddingsAsync(
            List<float> queryEmbedding,
            float matchThreshold = 0.65f,
            int matchCount = 5,
            Guid? subjectId = null,
            CancellationToken cancellationToken = default)
        {
            if (_client == null) return new List<DocumentEmbedding>();

            try
            {
                var rpcParams = new Dictionary<string, object>
                {
                    { "query_embedding", queryEmbedding },
                    { "match_threshold", matchThreshold },
                    { "match_count", matchCount }
                };

                if (subjectId.HasValue)
                {
                    rpcParams.Add("filter_subject_id", subjectId.Value);
                }

                var result = await _client.Rpc<List<DocumentEmbedding>>("match_document_embeddings", rpcParams);
                return result ?? new List<DocumentEmbedding>();
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "[SupabaseService] Vector similarity RPC failed. Fallback to empty context.");
                return new List<DocumentEmbedding>();
            }
        }
    }
}

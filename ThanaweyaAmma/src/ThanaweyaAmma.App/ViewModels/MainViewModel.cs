using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Input;
using Serilog;
using ThanaweyaAmma.App.Helpers;
using ThanaweyaAmma.App.Models;
using ThanaweyaAmma.App.Services;

namespace ThanaweyaAmma.App.ViewModels
{
    public class MainViewModel : ViewModelBase
    {
        private readonly ISupabaseService _supabaseService;
        private readonly IAiTutorService _aiTutorService;
        private readonly IAdminCoPilotService _adminCoPilotService;
        private readonly AppConfig _appConfig;

        // Collections
        public ObservableCollection<Subject> Subjects { get; } = new();
        public ObservableCollection<StudyMilestone> Milestones { get; } = new();
        public ObservableCollection<ChatMessageDto> ChatMessages { get; } = new();
        public ObservableCollection<MultimediaItem> MultimediaItems { get; } = new();
        public ObservableCollection<AdminNotification> PendingNotifications { get; } = new();

        // Selected State
        private Subject? _selectedSubject;
        public Subject? SelectedSubject
        {
            get => _selectedSubject;
            set
            {
                if (SetProperty(ref _selectedSubject, value) && value != null)
                {
                    UpdateDomainFromSubject(value);
                }
            }
        }

        private TutorDomain _currentDomain = TutorDomain.PureMath;
        public TutorDomain CurrentDomain
        {
            get => _currentDomain;
            set => SetProperty(ref _currentDomain, value);
        }

        private string _userChatInput = string.Empty;
        public string UserChatInput
        {
            get => _userChatInput;
            set => SetProperty(ref _userChatInput, value);
        }

        private string _activeView = "Dashboard"; // "Dashboard", "Chat", "VideoPlayer", "Quiz", "AdminCoPilot"
        public string ActiveView
        {
            get => _activeView;
            set => SetProperty(ref _activeView, value);
        }

        private int _academicProgressPercentage = 38;
        public int AcademicProgressPercentage
        {
            get => _academicProgressPercentage;
            set => SetProperty(ref _academicProgressPercentage, value);
        }

        // Commands
        public ICommand NavigateCommand { get; }
        public ICommand SendChatMessageCommand { get; }
        public ICommand ScoutWebCommand { get; }
        public ICommand ApproveNotificationCommand { get; }
        public ICommand RefreshMilestonesCommand { get; }

        public MainViewModel(
            ISupabaseService supabaseService,
            IAiTutorService aiTutorService,
            IAdminCoPilotService adminCoPilotService,
            AppConfig appConfig)
        {
            _supabaseService = supabaseService ?? throw new ArgumentNullException(nameof(supabaseService));
            _aiTutorService = aiTutorService ?? throw new ArgumentNullException(nameof(aiTutorService));
            _adminCoPilotService = adminCoPilotService ?? throw new ArgumentNullException(nameof(adminCoPilotService));
            _appConfig = appConfig ?? throw new ArgumentNullException(nameof(appConfig));

            NavigateCommand = new RelayCommand(p => ActiveView = p?.ToString() ?? "Dashboard");
            SendChatMessageCommand = new AsyncRelayCommand(ExecuteSendChatMessageAsync, () => !string.IsNullOrWhiteSpace(UserChatInput));
            ScoutWebCommand = new AsyncRelayCommand(ExecuteScoutWebAsync);
            ApproveNotificationCommand = new AsyncRelayCommand(ExecuteApproveNotificationAsync);
            RefreshMilestonesCommand = new AsyncRelayCommand(LoadInitialDataAsync);

            // Add Welcome Message
            ChatMessages.Add(new ChatMessageDto
            {
                Role = "assistant",
                Content = "أهلاً بك يا بطل الثانوية العامة (علمي رياضة) 📐✨\nأنا معلمك الذكي التخصصي، جاهز لإرشادك خطوة بخطوة في التفاضل والتكامل، الجبر والهندسة الفراغية، الاستاتيكا والديناميكا، الفيزياء، الكيمياء، واللغات.\nبماذا نود أن نبدأ اليوم وفق خطتنا من أكتوبر 2026 إلى يوليو 2027؟",
                Timestamp = DateTime.UtcNow
            });
        }

        public async Task LoadInitialDataAsync(CancellationToken cancellationToken = default)
        {
            IsBusy = true;
            StatusMessage = "جارٍ تحميل المواد والمراحل الزمنية...";

            try
            {
                await _supabaseService.InitializeAsync(cancellationToken);

                // Load Subjects
                var subjects = await _supabaseService.GetSubjectsAsync(cancellationToken);
                Subjects.Clear();
                foreach (var s in subjects) Subjects.Add(s);
                SelectedSubject = Subjects.FirstOrDefault();

                // Load Milestones (Oct 2026 - July 2027)
                var milestones = await _supabaseService.GetMilestonesAsync(cancellationToken);
                Milestones.Clear();
                foreach (var m in milestones) Milestones.Add(m);

                // Load Multimedia Library
                var media = await _supabaseService.GetMultimediaLibraryAsync(null, cancellationToken);
                MultimediaItems.Clear();
                foreach (var item in media) MultimediaItems.Add(item);

                // Load Admin Notifications
                var notifications = await _supabaseService.GetAdminNotificationsAsync(true, cancellationToken);
                PendingNotifications.Clear();
                foreach (var n in notifications) PendingNotifications.Add(n);

                StatusMessage = "تم تجهيز بيئة الطالب بنجاح.";
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[MainViewModel] Failed to load initial data.");
                StatusMessage = "حدث خطأ أثناء تحميل البيانات.";
            }
            finally
            {
                IsBusy = false;
            }
        }

        private async Task ExecuteSendChatMessageAsync(object? parameter, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(UserChatInput)) return;

            var userPrompt = UserChatInput.Trim();
            UserChatInput = string.Empty;

            ChatMessages.Add(new ChatMessageDto
            {
                Role = "user",
                Content = userPrompt,
                Timestamp = DateTime.UtcNow
            });

            IsBusy = true;
            StatusMessage = "المعلم الذكي يفكر في خطوتك الإرشادية...";

            try
            {
                var history = ChatMessages.TakeLast(6).ToList();
                var response = await _aiTutorService.AskTutorAsync(
                    CurrentDomain,
                    userPrompt,
                    history,
                    null,
                    cancellationToken);

                ChatMessages.Add(new ChatMessageDto
                {
                    Role = "assistant",
                    Content = response,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[MainViewModel] Chat communication error.");
                ChatMessages.Add(new ChatMessageDto
                {
                    Role = "assistant",
                    Content = "عذراً يا بني، حدث انقطاع مؤقت في الاتصال. لنحاول معاً مجدداً.",
                    Timestamp = DateTime.UtcNow
                });
            }
            finally
            {
                IsBusy = false;
                StatusMessage = string.Empty;
            }
        }

        private async Task ExecuteScoutWebAsync(object? parameter, CancellationToken cancellationToken)
        {
            IsBusy = true;
            StatusMessage = "كشاف المشرف الذكي يقوم بمسح منصات الوزارة وبنك المعرفة (moe.gov.eg, ekb.eg)...";

            try
            {
                var topic = SelectedSubject?.NameAr ?? "التفاضل والتكامل";
                var scouted = await _adminCoPilotService.ScoutCurriculumMaterialsAsync(topic, cancellationToken);

                foreach (var item in scouted)
                {
                    PendingNotifications.Add(item);
                }

                StatusMessage = $"تم رصد {scouted.Count} مواد ومذكرات امتحانية جديدة بانتظار موافقة المشرف.";
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[MainViewModel] Error scouting web materials.");
            }
            finally
            {
                IsBusy = false;
            }
        }

        private async Task ExecuteApproveNotificationAsync(object? parameter, CancellationToken cancellationToken)
        {
            if (parameter is AdminNotification notification)
            {
                IsBusy = true;
                StatusMessage = $"جارٍ اعتماد وتضمين وثيقة '{notification.Title}' في مستودع RAG...";

                try
                {
                    bool ok = await _adminCoPilotService.ApproveAndIngestNotificationAsync(
                        notification.Id,
                        "Admin_Ahmed",
                        cancellationToken);

                    if (ok)
                    {
                        PendingNotifications.Remove(notification);
                        StatusMessage = "تم الاعتماد والتضمين المتجهي بنجاح!";
                    }
                }
                catch (Exception ex)
                {
                    Log.Error(ex, "[MainViewModel] Failed to approve notification.");
                }
                finally
                {
                    IsBusy = false;
                }
            }
        }

        private void UpdateDomainFromSubject(Subject subject)
        {
            CurrentDomain = subject.Category switch
            {
                "Pure Mathematics" => TutorDomain.PureMath,
                "Applied Mathematics" => TutorDomain.AppliedMath,
                "Physical Sciences" => TutorDomain.PhysicsChemistry,
                "Languages" => TutorDomain.Languages,
                _ => TutorDomain.PureMath
            };
        }
    }
}

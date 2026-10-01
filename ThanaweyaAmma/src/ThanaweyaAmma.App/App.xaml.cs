using System;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;
using Microsoft.Extensions.DependencyInjection;
using Serilog;
using ThanaweyaAmma.App.Services;
using ThanaweyaAmma.App.ViewModels;

namespace ThanaweyaAmma.App
{
    public partial class App : Application
    {
        public static IServiceProvider ServiceProvider { get; private set; } = null!;

        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);

            // 1. Initialize High-Performance Rotating File Serilog Logging
            var logPath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "ThanaweyaAmmaMathCopilot",
                "logs",
                "copilot-.log");

            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .WriteTo.Console()
                .WriteTo.File(
                    logPath,
                    rollingInterval: RollingInterval.Day,
                    retainedFileCountLimit: 14,
                    fileSizeLimitBytes: 15 * 1024 * 1024,
                    rollOnFileSizeLimit: true,
                    outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {NewLine}{Exception}")
                .CreateLogger();

            Log.Information("====================================================================");
            Log.Information("Thanaweya Amma (Math Section) Copilot - Application Bootstrapped");
            Log.Information("Target: Windows .NET 8 WPF | Academic Cycle: 2026 - 2027");
            Log.Information("====================================================================");

            // 2. Global Unhandled Exception Protection
            AppDomain.CurrentDomain.UnhandledException += CurrentDomain_UnhandledException;
            DispatcherUnhandledException += App_DispatcherUnhandledException;
            TaskScheduler.UnobservedTaskException += TaskScheduler_UnobservedTaskException;

            // 3. Configure Dependency Injection & Recycled HttpClients
            var services = new ServiceCollection();
            ConfigureServices(services);
            ServiceProvider = services.BuildServiceProvider();

            // 4. Launch Main Window
            var mainWindow = ServiceProvider.GetRequiredService<MainWindow>();
            mainWindow.Show();
        }

        private static void ConfigureServices(IServiceCollection services)
        {
            // Register Recycled HTTP Client to prevent socket exhaustion
            services.AddSingleton(new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(60)
            });

            // Services
            services.AddSingleton<AppConfig>();
            services.AddSingleton<ISupabaseService, SupabaseService>();
            services.AddSingleton<IAiTutorService, AiTutorService>();
            services.AddSingleton<IDataIngestionService, DataIngestionService>();
            services.AddSingleton<IAdminCoPilotService, AdminCoPilotService>();
            services.AddSingleton<IQuizService, QuizService>();

            // ViewModels & Windows
            services.AddSingleton<MainViewModel>();
            services.AddSingleton<MainWindow>();
        }

        private void App_DispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
        {
            Log.Fatal(e.Exception, "[Dispatcher] Critical UI Thread Unhandled Exception caught.");
            MessageBox.Show(
                $"حدث استثناء غير متوقع في واجهة المستخدم:\n{e.Exception.Message}\nتم تسجيل التفاصيل في ملف السجل (Log).",
                "خطأ في منظومة الثانوية العامة",
                MessageBoxButton.OK,
                MessageBoxImage.Error);

            e.Handled = true; // Prevent abrupt crash when recoverable
        }

        private void CurrentDomain_UnhandledException(object sender, UnhandledExceptionEventArgs e)
        {
            if (e.ExceptionObject is Exception ex)
            {
                Log.Fatal(ex, "[AppDomain] Fatal Unhandled Domain Exception. IsTerminating: {IsTerminating}", e.IsTerminating);
            }
            else
            {
                Log.Fatal("[AppDomain] Non-exception fatal domain error: {Error}", e.ExceptionObject);
            }
        }

        private void TaskScheduler_UnobservedTaskException(object? sender, UnobservedTaskExceptionEventArgs e)
        {
            Log.Error(e.Exception, "[TaskScheduler] Unobserved Task Exception caught.");
            e.SetObserved(); // Mark observed to prevent runtime termination
        }

        protected override void OnExit(ExitEventArgs e)
        {
            Log.Information("[App] Application shutting down gracefully. Flushing log sink.");
            Log.CloseAndFlush();
            base.OnExit(e);
        }
    }
}

using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Threading;
using Serilog;

namespace ThanaweyaAmma.App.Controls
{
    public partial class EmbeddedVideoPlayerControl : UserControl
    {
        private readonly DispatcherTimer _timer;
        private bool _isPlaying;
        private double _playbackSpeed = 1.0;

        public EmbeddedVideoPlayerControl()
        {
            InitializeComponent();

            _timer = new DispatcherTimer
            {
                Interval = TimeSpan.FromMilliseconds(500)
            };
            _timer.Tick += Timer_Tick;
        }

        public void LoadMedia(string urlOrPath, string title)
        {
            try
            {
                TxtMediaTitle.Text = title;
                MediaPlayer.Source = new Uri(urlOrPath);
                PnlPlaceholder.Visibility = Visibility.Collapsed;
                MediaPlayer.Play();
                _isPlaying = true;
                BtnPlayPause.Content = "⏸ إيقاف مؤقت";
                _timer.Start();
                Log.Information("[VideoPlayer] Loaded media from '{Url}' - Title: '{Title}'", urlOrPath, title);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[VideoPlayer] Failed to load media from source: {Source}", urlOrPath);
                MessageBox.Show($"تعذر تشغيل الملف أو الرابط المحدد:\n{ex.Message}", "خطأ في مشغل الوسائط", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }

        private void Timer_Tick(object? sender, EventArgs e)
        {
            if (MediaPlayer.NaturalDuration.HasTimeSpan)
            {
                var total = MediaPlayer.NaturalDuration.TimeSpan.TotalSeconds;
                var current = MediaPlayer.Position.TotalSeconds;

                SliderTimeline.Maximum = total;
                SliderTimeline.Value = current;

                TxtCurrentTime.Text = MediaPlayer.Position.ToString(@"mm\:ss");
                TxtTotalTime.Text = MediaPlayer.NaturalDuration.TimeSpan.ToString(@"mm\:ss");
            }
        }

        private void BtnPlayPause_Click(object sender, RoutedEventArgs e)
        {
            if (_isPlaying)
            {
                MediaPlayer.Pause();
                _isPlaying = false;
                BtnPlayPause.Content = "▶ تشغيل";
                _timer.Stop();
            }
            else
            {
                MediaPlayer.Play();
                _isPlaying = true;
                BtnPlayPause.Content = "⏸ إيقاف مؤقت";
                _timer.Start();
                PnlPlaceholder.Visibility = Visibility.Collapsed;
            }
        }

        private void BtnStop_Click(object sender, RoutedEventArgs e)
        {
            MediaPlayer.Stop();
            _isPlaying = false;
            BtnPlayPause.Content = "▶ تشغيل";
            _timer.Stop();
            SliderTimeline.Value = 0;
            TxtCurrentTime.Text = "00:00";
        }

        private void SliderTimeline_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            if (Math.Abs(MediaPlayer.Position.TotalSeconds - e.NewValue) > 1.5)
            {
                MediaPlayer.Position = TimeSpan.FromSeconds(e.NewValue);
            }
        }

        private void SliderVolume_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            if (MediaPlayer != null)
            {
                MediaPlayer.Volume = e.NewValue;
            }
        }

        private void BtnSpeed_Click(object sender, RoutedEventArgs e)
        {
            _playbackSpeed = _playbackSpeed switch
            {
                1.0 => 1.25,
                1.25 => 1.5,
                1.5 => 2.0,
                _ => 1.0
            };

            MediaPlayer.SpeedRatio = _playbackSpeed;
            BtnSpeed.Content = $"{_playbackSpeed:0.0}x";
        }

        private void BtnOpenUrl_Click(object sender, RoutedEventArgs e)
        {
            // Sample dialog prompt for link playback
            var sampleUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
            LoadMedia(sampleUrl, "فيديو تعليمي: مراجعة قوانين نيوتن وتطبيقات البكرات في الديناميكا");
        }

        private void MediaPlayer_MediaOpened(object sender, RoutedEventArgs e)
        {
            if (MediaPlayer.NaturalDuration.HasTimeSpan)
            {
                TxtTotalTime.Text = MediaPlayer.NaturalDuration.TimeSpan.ToString(@"mm\:ss");
            }
        }

        private void MediaPlayer_MediaEnded(object sender, RoutedEventArgs e)
        {
            _isPlaying = false;
            BtnPlayPause.Content = "▶ تشغيل";
            _timer.Stop();
        }

        private void MediaPlayer_MediaFailed(object? sender, ExceptionRoutedEventArgs e)
        {
            Log.Error("[VideoPlayer] Media playback failed: {Error}", e.ErrorException?.Message);
            PnlPlaceholder.Visibility = Visibility.Visible;
        }
    }
}

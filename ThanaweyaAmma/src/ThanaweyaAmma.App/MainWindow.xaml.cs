using System;
using System.Windows;
using Serilog;
using ThanaweyaAmma.App.ViewModels;

namespace ThanaweyaAmma.App
{
    public partial class MainWindow : Window
    {
        private readonly MainViewModel _viewModel;

        public MainWindow(MainViewModel viewModel)
        {
            InitializeComponent();
            _viewModel = viewModel ?? throw new ArgumentNullException(nameof(viewModel));
            DataContext = _viewModel;

            Loaded += MainWindow_Loaded;
        }

        private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            Log.Information("[MainWindow] Window loaded. Dispatching initial data load...");
            await _viewModel.LoadInitialDataAsync();
        }
    }
}

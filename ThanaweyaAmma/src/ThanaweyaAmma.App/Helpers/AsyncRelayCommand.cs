using System;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Input;

namespace ThanaweyaAmma.App.Helpers
{
    public class AsyncRelayCommand : ICommand
    {
        private readonly Func<object?, CancellationToken, Task> _execute;
        private readonly Predicate<object?>? _canExecute;
        private CancellationTokenSource? _cts;
        private bool _isExecuting;

        public event EventHandler? CanExecuteChanged
        {
            add => CommandManager.RequerySuggested += value;
            remove => CommandManager.RequerySuggested -= value;
        }

        public bool IsExecuting
        {
            get => _isExecuting;
            private set
            {
                _isExecuting = value;
                CommandManager.InvalidateRequerySuggested();
            }
        }

        public AsyncRelayCommand(Func<object?, CancellationToken, Task> execute, Predicate<object?>? canExecute = null)
        {
            _execute = execute ?? throw new ArgumentNullException(nameof(execute));
            _canExecute = canExecute;
        }

        public AsyncRelayCommand(Func<Task> execute, Func<bool>? canExecute = null)
            : this((_, ct) => execute(), canExecute == null ? null : _ => canExecute())
        {
        }

        public bool CanExecute(object? parameter)
        {
            return !_isExecuting && (_canExecute?.Invoke(parameter) ?? true);
        }

        public async void Execute(object? parameter)
        {
            if (!CanExecute(parameter)) return;

            try
            {
                IsExecuting = true;
                _cts = new CancellationTokenSource();
                await _execute(parameter, _cts.Token);
            }
            catch (OperationCanceledException)
            {
                // Graceful cancellation handled
            }
            finally
            {
                _cts?.Dispose();
                _cts = null;
                IsExecuting = false;
            }
        }

        public void Cancel()
        {
            _cts?.Cancel();
        }
    }
}

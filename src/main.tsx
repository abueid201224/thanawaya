import 'katex/dist/katex.min.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'حدث خطأ غير متوقع أثناء تشغيل الواجهة.'
    };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6 font-sans"
        >
          <div className="max-w-md w-full rounded-2xl border border-rose-200 bg-white p-6 shadow-sm space-y-4 text-center">
            <h1 className="text-lg font-bold text-rose-800">
              تعذّر تحميل جزء من الواجهة مؤقتاً
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              تم حفظ بياناتك الدراسية محلياً. يمكنك إعادة تحميل التطبيق لاستئناف المذاكرة بأمان.
            </p>
            <div className="text-[11px] font-mono bg-slate-100 text-slate-700 rounded-lg p-2.5 break-all">
              {this.state.errorMessage}
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[40px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
            >
              إعادة تحميل التطبيق
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);

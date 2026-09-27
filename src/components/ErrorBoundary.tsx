import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("ErrorBoundary caught an issue:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#09090b] text-zinc-200 flex flex-col items-center justify-center p-6 select-none">
          <div className="max-w-md w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Görselleştirici Yeniden Yükleniyor</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Arayüz bileşeni güvenli modda sıfırlandı. Çizimlerinizi koruyarak devam edebilirsiniz.
              </p>
            </div>
            {this.state.error && (
              <pre className="p-2.5 bg-black/50 border border-zinc-800 rounded text-[10px] text-zinc-500 font-mono text-left max-h-24 overflow-auto">
                {this.state.error.message || 'Bilinmeyen hata'}
              </pre>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.onReset) this.props.onReset();
                }}
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Arayüzü Yenile
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

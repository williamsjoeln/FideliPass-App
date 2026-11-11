import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-900 font-heading mb-2">
              Terminal Restaurada
            </h2>
            <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed">
              La cámara o la pantalla anterior se cerró. Puedes continuar usando la terminal sin problemas.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full py-3.5 px-4 bg-[#007AFF] hover:bg-[#0062E0] text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
            >
              <RefreshCw size={16} />
              <span>Volver a la Terminal</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

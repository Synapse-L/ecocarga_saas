"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 rounded-3xl border border-red-100 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900/30 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mx-auto">
            <AlertTriangle className="text-red-600" size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-900 dark:text-white">Falha ao carregar componente</h4>
            <p className="text-xs text-gray-500 dark:text-slate-450 mt-1">Ocorreu um erro ao renderizar este bloco de dados.</p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="flex items-center gap-1 mx-auto text-xs font-bold text-gray-700 dark:text-slate-300 hover:text-primary transition-colors"
          >
            <RefreshCw size={12} />
            Tentar recarregar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

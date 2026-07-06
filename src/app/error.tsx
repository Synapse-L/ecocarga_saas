"use client";

// src/app/error.tsx — Global error boundary for Next.js App Router
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-slate-950 transition-colors duration-300">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
          <AlertTriangle className="text-red-500" size={32} />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Algo deu errado
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium leading-relaxed">
            Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.
          </p>
          {error.digest && (
            <p className="text-xs text-gray-400 dark:text-slate-600 mt-2 font-mono">
              ID: {error.digest}
            </p>
          )}
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full font-bold text-sm hover:opacity-90 transition-all active:scale-95"
        >
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

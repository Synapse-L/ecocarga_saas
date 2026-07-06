// src/app/loading.tsx — Global loading state (shown by Next.js during page transitions)
export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-slate-950 transition-colors duration-300">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-gray-400 font-bold uppercase tracking-wider animate-pulse">
          Carregando...
        </p>
      </div>
    </div>
  );
}

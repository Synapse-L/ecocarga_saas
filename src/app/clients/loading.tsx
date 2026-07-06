export default function ClientsLoading() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="w-64 bg-sidebar-bg border-r border-sidebar-border" />
      <div className="flex-1 ml-64 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-slate-800 rounded-xl" />
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-100 dark:bg-slate-900 rounded-3xl" />
            ))}
          </div>
          <div className="h-96 bg-gray-100 dark:bg-slate-900 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

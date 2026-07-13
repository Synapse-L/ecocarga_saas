export function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    'Enviado': 'bg-blue-50 text-blue-750 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40',
    'Negociação': 'bg-purple-50 text-purple-750 border-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/40',
    'Concluído': 'bg-emerald-50 text-emerald-750 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40',
    'Rascunho': 'bg-gray-100 text-gray-750 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    'Vencido': 'bg-red-50 text-red-750 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/40',
  };

  const label: any = {
    'Enviado': 'Enviada',
    'Negociação': 'Negociação',
    'Concluído': 'Aprovada',
    'Rascunho': 'Rascunho',
    'Vencido': 'Recusada',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[status] || styles['Rascunho']}`}>
      {label[status] || status}
    </span>
  );
}

// Maps a proposal's raw status to the Kanban column it belongs to.
export const getColumnKey = (status: string): string => {
  if (status === 'Negociação' || status === 'Enviado' || status === 'Rascunho') {
    return 'Em Andamento';
  }
  if (status === 'Concluído') {
    return 'Aprovadas';
  }
  if (status === 'Vencido') {
    return 'Desaprovadas';
  }
  return status;
};

// Orders a list of proposals according to a saved Kanban card order.
// Proposals not present in `order` are appended, sorted by creation date.
export const sortProposalsByKanbanOrder = <T extends { id: string | number; created_at: string }>(
  proposalsList: T[],
  order: string[]
): T[] => {
  return [...proposalsList].sort((a, b) => {
    const indexA = order.indexOf(a.id.toString());
    const indexB = order.indexOf(b.id.toString());

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    if (indexA !== -1) return 1;
    if (indexB !== -1) return -1;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
};

export type KanbanColumnConfig = {
  key: string;
  label: string;
  color: 'purple' | 'emerald' | 'red';
  statuses: string[];
  emptyMessage: string;
};

export const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    key: 'Negociação',
    label: 'Em Andamento',
    color: 'purple',
    statuses: ['Negociação', 'Enviado', 'Rascunho'],
    emptyMessage: 'Nenhuma proposta em andamento.'
  },
  {
    key: 'Concluído',
    label: 'Aprovadas',
    color: 'emerald',
    statuses: ['Concluído'],
    emptyMessage: 'Nenhuma proposta aprovada.'
  },
  {
    key: 'Vencido',
    label: 'Desaprovadas',
    color: 'red',
    statuses: ['Vencido'],
    emptyMessage: 'Nenhuma proposta recusada.'
  }
];

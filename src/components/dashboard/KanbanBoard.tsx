"use client";

import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Clock, Trash2 } from 'lucide-react';
import { DashboardProposal } from '@/lib/dashboard-data';
import { KANBAN_COLUMNS, sortProposalsByKanbanOrder } from '@/lib/kanban-utils';
import { StatusBadge } from '@/components/dashboard/StatusBadge';

const COLUMN_STYLES: Record<string, {
  header: string;
  dot: string;
  title: string;
  badge: string;
  hover: string;
}> = {
  purple: {
    header: 'bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100/50 dark:border-purple-900/20',
    dot: 'bg-purple-500',
    title: 'text-purple-700 dark:text-purple-400',
    badge: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400',
    hover: 'bg-purple-100/30 dark:bg-purple-950/20 border-dashed border-purple-400 dark:border-purple-600'
  },
  emerald: {
    header: 'bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20',
    dot: 'bg-emerald-500',
    title: 'text-emerald-700 dark:text-emerald-400',
    badge: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400',
    hover: 'bg-emerald-100/30 dark:bg-emerald-950/20 border-dashed border-emerald-400 dark:border-emerald-600'
  },
  red: {
    header: 'bg-red-50/50 dark:bg-red-950/10 border border-red-100/50 dark:border-red-900/20',
    dot: 'bg-red-500',
    title: 'text-red-700 dark:text-red-400',
    badge: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400',
    hover: 'bg-red-100/30 dark:bg-red-950/20 border-dashed border-red-400 dark:border-red-600'
  }
};

const getDaysInColumn = (p: any) => {
  const date = p.updated_at || p.created_at;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
};

const getDistanceToRect = (px: number, py: number, rect: DOMRect) => {
  const dx = Math.max(rect.left - px, 0, px - rect.right);
  const dy = Math.max(rect.top - py, 0, py - rect.bottom);
  return Math.sqrt(dx * dx + dy * dy);
};

type KanbanBoardProps = {
  proposals: DashboardProposal[];
  kanbanOrder: string[];
  search: string;
  onSearchChange: (value: string) => void;
  onReorder: (proposalId: string, targetStatus: string, insertIndex: number) => void;
  onDelete: (id: string) => void;
};

function KanbanBoardImpl({ proposals, kanbanOrder, search, onSearchChange, onReorder, onDelete }: KanbanBoardProps) {
  // Hover/drag state is local to this component so it never re-renders the rest of the dashboard.
  const [activeHoverColumn, setActiveHoverColumn] = useState<string | null>(null);
  const columnRectsRef = useRef<Array<{ status: string; rect: DOMRect; element: Element }>>([]);

  const sortedProposals = useMemo(() => {
    const filtered = search.trim()
      ? proposals.filter(p =>
          (p.client?.name || p.commercial_data?.client?.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (p.title || '').toLowerCase().includes(search.toLowerCase())
        )
      : proposals;
    return sortProposalsByKanbanOrder(filtered, kanbanOrder);
  }, [proposals, search, kanbanOrder]);

  const handleDragStart = () => {
    if (typeof window === 'undefined') return;
    const cols = document.querySelectorAll('[data-column-status]');
    columnRectsRef.current = Array.from(cols).map(col => ({
      status: col.getAttribute('data-column-status') || '',
      rect: col.getBoundingClientRect(),
      element: col
    }));
  };

  const handleDrag = (event: any, info: any) => {
    if (typeof window === 'undefined' || columnRectsRef.current.length === 0) return;
    const x = info.point.x - window.scrollX;
    const y = info.point.y - window.scrollY;

    let bestStatus = null;
    let minDistance = Infinity;

    for (const col of columnRectsRef.current) {
      const dist = getDistanceToRect(x, y, col.rect);
      if (dist < minDistance) {
        minDistance = dist;
        bestStatus = col.status;
      }
    }

    const targetStatus = minDistance < 300 ? bestStatus : null;

    if (targetStatus !== activeHoverColumn) {
      setActiveHoverColumn(targetStatus);
    }
  };

  const handleDragEnd = (event: any, info: any, proposalId: string) => {
    if (typeof window === 'undefined') return;
    const x = info.point.x - window.scrollX;
    const y = info.point.y - window.scrollY;

    let bestColumn: Element | null = null;
    let bestStatus: string | null = null;
    let minDistance = Infinity;

    for (const col of columnRectsRef.current) {
      const dist = getDistanceToRect(x, y, col.rect);
      if (dist < minDistance) {
        minDistance = dist;
        bestColumn = col.element;
        bestStatus = col.status;
      }
    }

    setActiveHoverColumn(null);
    columnRectsRef.current = [];

    if (bestStatus && minDistance < 300 && bestColumn) {
      const cardsInColumn = Array.from(bestColumn.querySelectorAll('[data-proposal-id]')) as HTMLElement[];
      const otherCards = cardsInColumn.filter(cardEl => cardEl.getAttribute('data-proposal-id') !== proposalId.toString());

      let insertIndex = otherCards.length;
      for (let i = 0; i < otherCards.length; i++) {
        const rect = otherCards[i].getBoundingClientRect();
        const cardMiddleY = rect.top + rect.height / 2;
        if (y < cardMiddleY) {
          insertIndex = i;
          break;
        }
      }

      onReorder(proposalId, bestStatus, insertIndex);
    }
  };

  return (
    <div>
      {/* Kanban search bar */}
      <div className="px-6 pt-4 pb-2">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Buscar no Kanban..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-9 pr-4 py-2 w-full border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50/20 dark:bg-slate-950/10 transition-colors">
        {KANBAN_COLUMNS.map(col => {
          const style = COLUMN_STYLES[col.color];
          const cards = sortedProposals.filter(p => col.statuses.includes(p.status));

          return (
            <div key={col.key} className="space-y-4 flex flex-col h-full">
              <div className={`flex items-center justify-between px-4 py-3 rounded-2xl ${style.header}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
                  <h3 className={`text-xs font-black uppercase tracking-wider ${style.title}`}>{col.label}</h3>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${style.badge}`}>
                  {cards.length}
                </span>
              </div>

              <div
                data-column-status={col.key}
                className={`space-y-3 pr-1 min-h-[400px] flex-1 transition-[background-color,border-color] duration-300 rounded-2xl border-2 ${
                  activeHoverColumn === col.key ? style.hover : 'border-transparent'
                }`}
              >
                {cards.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-900/40 border border-dashed border-gray-100 dark:border-slate-800 rounded-2xl">
                    {col.emptyMessage}
                  </div>
                ) : (
                  cards.map((prop) => {
                    const days = getDaysInColumn(prop);
                    const dayColor = days <= 3 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                      : days <= 7 ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20 dark:text-yellow-400'
                      : 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400';

                    return (
                      <motion.div
                        key={prop.id}
                        layout
                        layoutDependency={prop.status}
                        data-proposal-id={prop.id}
                        drag
                        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                        dragElastic={1}
                        dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
                        whileDrag={{
                          rotate: 4,
                          scale: 1.03,
                          zIndex: 50,
                          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.15)",
                          cursor: "grabbing"
                        }}
                        onDragStart={handleDragStart}
                        onDrag={handleDrag}
                        onDragEnd={(event, info) => handleDragEnd(event, info, prop.id.toString())}
                        className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-800/40 p-4 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition-[background-color,border-color,box-shadow] duration-200 group relative cursor-grab active:cursor-grabbing select-none touch-none animate-fade-in"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(prop.id.toString());
                          }}
                          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer z-10 pointer-events-auto"
                          title="Excluir Proposta"
                        >
                          <Trash2 size={13} />
                        </button>

                        <div className="pointer-events-none space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="overflow-hidden w-full pr-6">
                              <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider block truncate">
                                {prop.client?.name || 'Cliente s/ nome'}
                              </span>
                              <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-0.5 truncate">{prop.title}</h4>
                            </div>
                          </div>

                          <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full ${dayColor}`}>
                            <Clock size={8} />
                            {days === 0 ? 'Hoje' : `${days}d nesta coluna`}
                          </span>

                          <div className="flex justify-between items-end border-t border-gray-100 dark:border-slate-800/30 pt-2.5">
                            <div>
                              <p className="text-[8px] font-bold text-gray-400 dark:text-slate-500 uppercase">Valor</p>
                              <p className="text-xs font-black text-gray-900 dark:text-white">
                                R$ {(prop.commercial_data?.commercial?.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] font-bold text-gray-400 dark:text-slate-500 uppercase">Status</p>
                              <span className="inline-block mt-0.5 scale-90 origin-right">
                                <StatusBadge status={prop.status} />
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const KanbanBoard = React.memo(KanbanBoardImpl);

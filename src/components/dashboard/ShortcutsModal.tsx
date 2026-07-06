"use client";

import { Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[998]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[999] w-80 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Keyboard size={18} className="text-primary dark:text-accent" />
              <h3 className="font-black text-gray-900 dark:text-white">Atalhos de Teclado</h3>
            </div>
            <div className="space-y-2">
              {[['N', 'Nova Proposta'], ['K', 'Modo Kanban'], ['T', 'Modo Tabela'], ['G', 'Ver Gráficos'], ['?', 'Este painel'], ['Esc', 'Fechar']].map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-slate-400">{label}</span>
                  <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-xs font-mono font-bold text-gray-700 dark:text-slate-300">{key}</kbd>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

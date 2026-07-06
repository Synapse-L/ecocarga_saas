"use client";

import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Activity, DollarSign } from 'lucide-react';

interface InsightsSectionProps {
  stats: any;
}

export function InsightsSection({ stats }: InsightsSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Bloco Insights Comerciais */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors duration-300"
      >
        <div>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50 dark:border-slate-800">
            <Sparkles className="text-amber-500" size={20} />
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Insights Comerciais
            </h3>
          </div>

          <div className="space-y-4">
            {stats.insights.map((insight: any, i: number) => (
              <div
                key={i}
                className={`p-4 rounded-2xl border transition-all ${
                  insight.type === 'success'
                    ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30'
                    : insight.type === 'info'
                    ? 'bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30'
                    : 'bg-amber-50/50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30'
                }`}
              >
                <h4 className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase mb-1 flex items-center gap-1.5">
                  {insight.type === 'success' ? (
                    <TrendingUp size={14} className="text-emerald-500" />
                  ) : insight.type === 'info' ? (
                    <Activity size={14} className="text-blue-500" />
                  ) : (
                    <DollarSign size={14} className="text-amber-500" />
                  )}
                  {insight.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium leading-relaxed">
                  {insight.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Bloco Top Clientes (Ranking 10) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors duration-300"
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50 dark:border-slate-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
            Top 10 Clientes
          </h3>
          <span className="text-[9px] bg-primary/5 text-primary dark:bg-accent/5 dark:text-accent font-bold px-2 py-0.5 rounded">
            Faturamento
          </span>
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {stats.topClients.map((client: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between py-1 border-b border-gray-50/50 dark:border-slate-800/50 last:border-0"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-xs font-bold text-gray-400 dark:text-slate-600 min-w-4">#{index + 1}</span>
                <div className="truncate">
                  <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">{client.name}</span>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase">
                    {client.count} propostas
                  </span>
                </div>
              </div>
              <span className="text-xs font-black text-primary dark:text-accent flex-shrink-0">
                R$ {client.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Bloco Top Produtos */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors duration-300"
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50 dark:border-slate-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Top Produtos</h3>
          <span className="text-[9px] bg-primary/5 text-primary dark:bg-accent/5 dark:text-accent font-bold px-2 py-0.5 rounded">
            Unidades
          </span>
        </div>

        <div className="space-y-3">
          {stats.topProducts.slice(0, 5).map((prod: any, index: number) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-800 dark:text-slate-200 truncate pr-2">{prod.name}</span>
                <span className="font-bold text-gray-500 dark:text-slate-400">{prod.count} propostas</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden flex transition-colors">
                <div
                  className="bg-primary dark:bg-accent h-full rounded-full transition-all duration-500"
                  style={{ width: `${(prod.value / stats.kpis.totalValue.value) * 100}%` }}
                />
              </div>
              <div className="text-[9px] font-black text-right text-gray-400 dark:text-slate-500">
                R$ {prod.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} gerados
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

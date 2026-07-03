// 🧹 REMOVABLE MODULE — delete the /reports folder to remove this feature entirely
// This page uses pure CSS + SVG data visualization, mock analytics, and export simulations.

"use client";

import React, { useState } from 'react';
import { 
  BarChart3, Calendar, Download, Share2, TrendingUp, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, Users, Sparkles, RefreshCw, 
  ArrowRight, FileText, CheckCircle2, Award, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '@/components/AppSidebar';
import { useApp } from '@/context/AppContext';

// --- Types ---
interface FunnelStage {
  label: string;
  count: number;
  value: number;
  conversion: number; // percentage from previous stage
}

interface ProductRevenue {
  name: string;
  value: number;
  share: number;
  color: string;
}

interface CohortData {
  cohort: string; // Ex: Jan 2026
  size: number; // number of clients
  m1: number; // % repurchase Month 1
  m3: number; // % Month 3
  m6: number; // % Month 6
  m12: number; // % Month 12
}

// --- Mock Data ---
const FUNNEL_STAGES: FunnelStage[] = [
  { label: 'Contatos WhatsApp', count: 124, value: 1488000, conversion: 100 },
  { label: 'Qualificados (IA/Vendedor)', count: 78, value: 936000, conversion: 62.9 },
  { label: 'Proposta Enviada', count: 42, value: 504000, conversion: 53.8 },
  { label: 'Fechamento / Assinado', count: 27, value: 202000, conversion: 64.2 }
];

const PRODUCT_REVENUE: ProductRevenue[] = [
  { name: 'DC Fast Highway 150kW', value: 198000, share: 45.8, color: 'from-[#004D31] to-[#006B44]' },
  { name: 'Wallbox Pro 22kW', value: 120000, share: 27.7, color: 'from-[#B2D235] to-[#9cb72e]' },
  { name: 'DC Fast Charger 50kW', value: 62000, share: 14.3, color: 'from-blue-600 to-blue-500' },
  { name: 'Wallbox Business 22kW', value: 52000, share: 12.2, color: 'from-indigo-600 to-indigo-500' }
];

const COHORT_RECORDS: CohortData[] = [
  { cohort: 'Jan 2026', size: 10, m1: 20, m3: 40, m6: 70, m12: 90 },
  { cohort: 'Fev 2026', size: 12, m1: 16, m3: 33, m6: 58, m12: 0 },
  { cohort: 'Mar 2026', size: 15, m1: 26, m3: 46, m6: 0, m12: 0 },
  { cohort: 'Abr 2026', size: 18, m1: 22, m3: 0, m6: 0, m12: 0 },
  { cohort: 'Mai 2026', size: 22, m1: 0, m3: 0, m6: 0, m12: 0 }
];

const MOCK_ANOMALIES = [
  { id: 'an-1', title: 'Queda na Conversão de Frotas', desc: 'Conversão de leads corporativos caiu 22% esta semana em comparação com a média histórica.', type: 'critical' },
  { id: 'an-2', title: 'Atraso de Comissionamento', desc: 'Tempo médio de instalação em condomínios subiu de 7 para 12 dias no estado do Rio de Janeiro.', type: 'warning' }
];

export default function ReportsPage() {
  const { t } = useApp();
  const [dateRange, setDateRange] = useState('este-mes');
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingWA, setExportingWA] = useState(false);

  // PDF Export Simulator
  const handleExportPDF = () => {
    setExportingPDF(true);
    setTimeout(() => {
      setExportingPDF(false);
      
      // Simulate file download trigger
      const dummyContent = "Relatorio Executivo EcoCarga - PDF Simulador";
      const blob = new Blob([dummyContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'ecocarga_relatorio_executivo_junho.pdf');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('Relatório Executivo PDF compilado e baixado com sucesso!');
    }, 1500);
  };

  // WhatsApp Alert Simulator
  const handleSendWA = () => {
    setExportingWA(true);
    setTimeout(() => {
      setExportingWA(false);
      alert('Resumo semanal compilado e enviado diretamente para o WhatsApp do Gestor cadastrado!');
    }, 1200);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Container */}
      <main className="flex-1 flex flex-col ml-64 min-h-screen">
        {/* Header */}
        <header className="h-16 bg-background/80 backdrop-blur-md border-b border-border px-8 flex items-center justify-between sticky top-0 z-10 transition-colors duration-300">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-[#004D31] dark:text-[#B2D235]" size={20} />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Relatórios Executivos & BI</h1>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            {/* Range selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none"
            >
              <option value="hoje">Hoje</option>
              <option value="esta-semana">Esta Semana</option>
              <option value="este-mes">Este Mês (Junho)</option>
              <option value="ultimo-trimestre">Último Trimestre</option>
            </select>

            <button
              onClick={handleSendWA}
              disabled={exportingWA}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-55"
            >
              {exportingWA ? 'Enviando...' : <><Share2 size={14} /> Relatório WA</>}
            </button>

            <button
              onClick={handleExportPDF}
              disabled={exportingPDF}
              className="bg-[#004D31] dark:bg-[#B2D235] text-white dark:text-[#004D31] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-55 shadow-sm active:scale-[0.98]"
            >
              {exportingPDF ? 'Gerando...' : <><Download size={14} /> Exportar PDF</>}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 space-y-6">
          
          {/* Alertas de Anomalia (Critical Business Events) */}
          <div className="space-y-3">
            {MOCK_ANOMALIES.map(anom => (
              <div 
                key={anom.id}
                className={`p-4 rounded-2xl border flex items-start gap-3.5 transition-all ${
                  anom.type === 'critical' 
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 text-rose-850 dark:text-rose-400' 
                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-850 dark:text-amber-400'
                }`}
              >
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl flex-shrink-0 shadow-sm mt-0.5 animate-pulse">
                  <AlertTriangle className={anom.type === 'critical' ? 'text-rose-500' : 'text-amber-500'} size={18} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black uppercase tracking-wider">{anom.title}</h4>
                  <p className="text-[11px] leading-relaxed font-medium opacity-90">{anom.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* KPI Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1 */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-1">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Faturamento Líquido</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-gray-900 dark:text-white">R$ 432.000</span>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                  <ArrowUpRight size={12} />
                  +18.4%
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium">Acumulado vs mês anterior</p>
            </div>

            {/* KPI 2 */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-1">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Propostas Aprovadas</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-gray-900 dark:text-white">27 propostas</span>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                  <ArrowUpRight size={12} />
                  +8.5%
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium">Taxa de conversão: 64.2%</p>
            </div>

            {/* KPI 3 */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-1">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">MRR de Assinaturas</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-[#004D31] dark:text-[#B2D235]">R$ 12.500</span>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                  <ArrowUpRight size={12} />
                  +25.0%
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium">Contratos de carregamento ativo</p>
            </div>

            {/* KPI 4 */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-1">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Projeção Inteligente</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-primary dark:text-accent">R$ 510.000</span>
                <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                  Previsível
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium">Cálculo preditivo de regressão</p>
            </div>

          </div>

          {/* Graphical Section: Sales Funnel vs Revenue Shares */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Left: Funnel Chart (SVG-based) */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm lg:col-span-3 space-y-6">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-gray-900 dark:text-white">Funil de Vendas Corporativo</h3>
                <p className="text-[10px] text-gray-400">Fluxo de conversão desde o contato até a proposta ganha.</p>
              </div>

              {/* Custom SVG/HTML Funnel */}
              <div className="space-y-4">
                {FUNNEL_STAGES.map((stage, idx) => {
                  // Width percentages for funnel shape
                  const widths = ['w-full', 'w-[85%]', 'w-[70%]', 'w-[55%]'];
                  const colors = [
                    'bg-[#004D31]/10 border-[#004D31]/20 text-[#004D31] dark:text-[#a3c7ba]',
                    'bg-sky-50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/30 text-sky-700 dark:text-sky-400',
                    'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400',
                    'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  ];
                  
                  return (
                    <div key={stage.label} className="flex items-center gap-4 text-xs">
                      {/* Label block */}
                      <span className="w-40 font-bold text-gray-550 dark:text-gray-400 truncate">{stage.label}</span>
                      
                      {/* Visual Polygon Bar */}
                      <div className="flex-1 flex justify-center">
                        <div className={`h-11 rounded-2xl border ${widths[idx]} ${colors[idx]} flex items-center justify-between px-5 font-black transition-all hover:scale-[1.01] shadow-xs`}>
                          <span>{stage.count} Leads</span>
                          <span>R$ {(stage.value / 1000).toFixed(0)}k</span>
                        </div>
                      </div>

                      {/* Conversion Rate */}
                      <span className="w-16 font-extrabold text-right text-gray-900 dark:text-white">
                        {idx === 0 ? '-' : `${stage.conversion}%`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Revenue shares (Custom CSS progress charts) */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-6">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-gray-900 dark:text-white">Receita por Categoria</h3>
                <p className="text-[10px] text-gray-400">Distribuição do faturamento por modelo de hardware.</p>
              </div>

              {/* Progress bars list */}
              <div className="space-y-4 text-xs">
                {PRODUCT_REVENUE.map(prod => (
                  <div key={prod.name} className="space-y-1.5">
                    <div className="flex justify-between font-bold text-gray-400">
                      <span className="text-gray-900 dark:text-white line-clamp-1">{prod.name}</span>
                      <span>{prod.share}%</span>
                    </div>
                    
                    <div className="w-full h-2.5 bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${prod.color} rounded-full`}
                        style={{ width: `${prod.share}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-gray-400 font-medium">
                      <span>Participação técnica</span>
                      <span className="font-extrabold text-gray-900 dark:text-white">
                        R$ {prod.value.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Lower Grid: Cohort Analysis vs Predictive closed deals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Cohort analysis card */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 overflow-x-auto">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-gray-900 dark:text-white">Análise de Cohort (Recompra B2B)</h3>
                <p className="text-[10px] text-gray-400">Retenção e compras adicionais dos clientes ao longo dos meses.</p>
              </div>

              {/* Cohort Grid Table */}
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-850 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 pr-2">Grupo</th>
                    <th className="pb-3 pr-2 text-center">Tamanho</th>
                    <th className="pb-3 text-center">M1</th>
                    <th className="pb-3 text-center">M3</th>
                    <th className="pb-3 text-center">M6</th>
                    <th className="pb-3 text-center">M12</th>
                  </tr>
                </thead>
                <tbody className="font-bold text-gray-800 dark:text-slate-200">
                  {COHORT_RECORDS.map(rec => {
                    // Cell coloring helpers based on retention value
                    const getCellBg = (val: number) => {
                      if (val === 0) return 'bg-slate-50/20 dark:bg-slate-900/5 text-gray-300 dark:text-slate-700';
                      if (val < 25) return 'bg-[#004D31]/5 text-[#004D31] dark:text-[#a3c7ba] border border-primary/5';
                      if (val < 50) return 'bg-[#004D31]/15 text-[#004D31] dark:text-emerald-400';
                      if (val < 75) return 'bg-[#004D31]/30 text-[#004D31] dark:text-[#B2D235]';
                      return 'bg-primary dark:bg-primary text-white'; // High retention
                    };

                    return (
                      <tr key={rec.cohort} className="border-b border-gray-50/50 dark:border-slate-850/20">
                        <td className="py-3 pr-2 text-gray-900 dark:text-white font-black">{rec.cohort}</td>
                        <td className="py-3 pr-2 text-center text-gray-400 font-medium">{rec.size} empresas</td>
                        <td className={`py-3 text-center rounded-lg ${getCellBg(rec.m1)}`}>{rec.m1 > 0 ? `${rec.m1}%` : '-'}</td>
                        <td className={`py-3 text-center rounded-lg ${getCellBg(rec.m3)}`}>{rec.m3 > 0 ? `${rec.m3}%` : '-'}</td>
                        <td className={`py-3 text-center rounded-lg ${getCellBg(rec.m6)}`}>{rec.m6 > 0 ? `${rec.m6}%` : '-'}</td>
                        <td className={`py-3 text-center rounded-lg ${getCellBg(rec.m12)}`}>{rec.m12 > 0 ? `${rec.m12}%` : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Regression Predictive closing deals */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={16} className="text-primary dark:text-accent" />
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">Previsão de Fechamento (Regressão IA)</h3>
                </div>
                <p className="text-[10px] text-gray-400">Probabilidade matemática de ganho baseada em histórico e interações.</p>
              </div>

              {/* Predictive cards */}
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl border border-gray-55 dark:border-slate-850 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="font-black text-gray-900 dark:text-white">Posto Sol Nascente - Rodovia</span>
                    <span className="text-emerald-550 font-extrabold flex items-center gap-0.5">92% Prob.</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }} />
                  </div>
                  <p className="text-[9px] text-gray-400 font-medium">
                    Motivo: Resposta rápida no WA, proposta no valor esperado, reunião civil agendada.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-gray-55 dark:border-slate-850 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="font-black text-gray-900 dark:text-white">Shopping Metrô Boulevard</span>
                    <span className="text-amber-500 font-extrabold flex items-center gap-0.5">68% Prob.</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '68%' }} />
                  </div>
                  <p className="text-[9px] text-gray-400 font-medium">
                    Motivo: Estudo preliminar aprovado, mas aguarda parecer financeiro do conselho do shopping.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

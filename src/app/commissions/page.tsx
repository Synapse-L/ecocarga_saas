// 🧹 REMOVABLE MODULE — delete the /commissions folder to remove this feature entirely
// This page uses mock data, interactive simulations, and client-side exports for demonstration.

"use client";

import React, { useState } from 'react';
import { 
  DollarSign, TrendingUp, Target, Award, Settings2, Download, 
  ArrowUpRight, Clock, CheckCircle2, Sliders, Play, Plus, 
  User, RefreshCw, AlertCircle, Sparkles, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '@/components/AppSidebar';
import { useApp } from '@/context/AppContext';

// --- Types ---
type ActiveTab = 'vendedor' | 'gestor';

interface CommissionDeal {
  id: string;
  client: string;
  product: string;
  dealValue: number;
  commPercent: number;
  commValue: number;
  date: string;
  status: 'pago' | 'processando' | 'retido';
}

interface SalespersonPerformance {
  rank: number;
  name: string;
  salesVolume: number;
  commissionEarned: number;
  goalAchievement: number; // percentage
}

// --- Mock Data ---
const MOCK_DEALS: CommissionDeal[] = [
  { id: 'd-201', client: 'Residencial Green Park', product: '3x Wallbox Pro 22kW', dealValue: 35000, commPercent: 5, commValue: 1750, date: '25/06/2026', status: 'processando' },
  { id: 'd-202', client: 'Grand Hyatt Hotel', product: '2x Wallbox Business 22kW', dealValue: 32000, commPercent: 5, commValue: 1600, date: '18/05/2026', status: 'pago' },
  { id: 'd-203', client: 'Condomínio Spazio', product: '1x Wallbox Pro 22kW', dealValue: 12000, commPercent: 5, commValue: 600, date: '02/05/2026', status: 'pago' },
  { id: 'd-204', client: 'Empresa VoltCorp', product: 'Infraestrutura AC Geral', dealValue: 45000, commPercent: 4, commValue: 1800, date: '15/04/2026', status: 'pago' }
];

const MOCK_RANKING: SalespersonPerformance[] = [
  { rank: 1, name: 'Thiago Alencar (Você)', salesVolume: 185000, commissionEarned: 9250, goalAchievement: 123 },
  { rank: 2, name: 'Aline Souza', salesVolume: 140000, commissionEarned: 7000, goalAchievement: 93 },
  { rank: 3, name: 'Felipe Mello', salesVolume: 75000, commissionEarned: 3750, goalAchievement: 75 },
  { rank: 4, name: 'Beatriz Ramos', salesVolume: 32000, commissionEarned: 1600, goalAchievement: 32 }
];

const PRODUCT_CATEGORIES = [
  { id: 'ac-slow', name: 'AC Residencial 7.4kW', price: 6500, commDefault: 5 },
  { id: 'ac-fast', name: 'AC Wallbox Pro 22kW', price: 12000, commDefault: 5 },
  { id: 'ac-bus', name: 'AC Business 22kW (Dual)', price: 16000, commDefault: 5 },
  { id: 'dc-fast', name: 'DC Fast Charger 50kW', price: 62500, commDefault: 4 },
  { id: 'dc-ultra', name: 'DC Ultra Highway 150kW', price: 198000, commDefault: 3 }
];

export default function CommissionsPage() {
  const { t } = useApp();
  const [activeTab, setActiveTab] = useState<ActiveTab>('vendedor');
  
  // Vendedor State (Calculator)
  const [selectedProduct, setSelectedProduct] = useState(PRODUCT_CATEGORIES[1].id);
  const [customPrice, setCustomPrice] = useState(PRODUCT_CATEGORIES[1].price);
  const [quantity, setQuantity] = useState(1);
  const [customPercent, setCustomPercent] = useState(PRODUCT_CATEGORIES[1].commDefault);

  // Gestor State (Configuration Rates)
  const [rates, setRates] = useState(
    PRODUCT_CATEGORIES.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.commDefault }), {} as Record<string, number>)
  );
  
  const handleProductChange = (prodId: string) => {
    setSelectedProduct(prodId);
    const prod = PRODUCT_CATEGORIES.find(p => p.id === prodId);
    if (prod) {
      setCustomPrice(prod.price);
      setCustomPercent(prod.commDefault);
    }
  };

  // Commission Calculations
  const calculatedTotalSale = customPrice * quantity;
  const calculatedCommission = (calculatedTotalSale * customPercent) / 100;

  // CSV Export Logic
  const handleExportCSV = () => {
    // CSV headers and records
    const headers = 'Posição,Vendedor,Volume de Vendas (R$),Comissão Acumulada (R$),Atingimento da Meta (%)\n';
    const rows = MOCK_RANKING.map(r => 
      `${r.rank},${r.name},${r.salesVolume},${r.commissionEarned},${r.goalAchievement}`
    ).join('\n');
    
    const csvContent = '\uFEFF' + headers + rows; // Add BOM for Excel compatibility in Portuguese
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'ecocarga_relatorio_comissoes.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <DollarSign className="text-[#004D31] dark:text-[#B2D235]" size={20} />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Gestão de Comissões</h1>
          </div>

          {/* Tab Switcher */}
          <div className="bg-gray-100 dark:bg-slate-900 p-1 rounded-xl flex gap-1 text-xs font-bold border border-gray-200/50 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('vendedor')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'vendedor'
                  ? 'bg-white dark:bg-slate-950 text-[#004D31] dark:text-[#B2D235] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Painel do Vendedor
            </button>
            <button
              onClick={() => setActiveTab('gestor')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'gestor'
                  ? 'bg-white dark:bg-slate-950 text-[#004D31] dark:text-[#B2D235] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Painel do Gestor
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 space-y-8">
          
          <AnimatePresence mode="wait">
            {activeTab === 'vendedor' ? (
              /* ========================================================================= */
              /* PAINEL DO VENDEDOR */
              /* ========================================================================= */
              <motion.div
                key="vendedor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Upper Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Meta Card with Circular Progress Simulation */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Meta Mensal</p>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white">R$ 150.000</h3>
                      <div className="text-xs text-gray-400 font-medium">
                        Realizado: <span className="font-bold text-gray-900 dark:text-white">R$ 185.000</span>
                      </div>
                    </div>
                    
                    {/* Circle Loader Simulation */}
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-gray-100 dark:text-slate-800"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-emerald-500"
                          strokeDasharray="100, 100" // Explode target (exceeded 100%)
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute text-center flex flex-col">
                        <span className="text-sm font-black text-gray-900 dark:text-white leading-none">123%</span>
                        <span className="text-[8px] text-gray-400 font-bold uppercase mt-0.5">Atingido</span>
                      </div>
                    </div>
                  </div>

                  {/* Commission Earned Card */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-2">
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Comissão Acumulada</p>
                    <h3 className="text-2xl font-black text-[#004D31] dark:text-[#B2D235]">R$ 9.250,00</h3>
                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      R$ 7.500,00 já liberados para saque
                    </p>
                  </div>

                  {/* Ranking Card */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-2">
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Sua Posição no Time</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Award className="text-amber-500 animate-bounce" size={28} />
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white">1º Lugar</h3>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">Melhor desempenho de vendas de junho</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Area (Split Left/Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Left Column: Earnings Extrato */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm lg:col-span-3 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-gray-900 dark:text-white">Extrato de Vendas & Comissões</h3>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Junho/Julho</span>
                    </div>

                    <div className="space-y-3">
                      {MOCK_DEALS.map(deal => (
                        <div 
                          key={deal.id}
                          className="p-4 rounded-2xl border border-gray-55 dark:border-slate-850 bg-gray-50/20 dark:bg-slate-900/10 flex items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-black text-gray-900 dark:text-white line-clamp-1">{deal.client}</p>
                            <p className="text-[10px] text-gray-400 font-medium">
                              {deal.product} · Venda: R$ {deal.dealValue.toLocaleString('pt-BR')}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-xs font-black text-[#004D31] dark:text-[#B2D235]">
                                +R$ {deal.commValue.toLocaleString('pt-BR')}
                              </p>
                              <p className="text-[9px] font-bold text-gray-400">Taxa: {deal.commPercent}%</p>
                            </div>

                            <span className={`p-1.5 rounded-full ${
                              deal.status === 'pago' 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500' 
                                : deal.status === 'processando'
                                ? 'bg-amber-55/10 text-amber-500'
                                : 'bg-gray-100 text-gray-400'
                            }`}>
                              {deal.status === 'pago' ? (
                                <CheckCircle2 size={16} />
                              ) : (
                                <Clock size={16} />
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Interactive Calculator */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Sliders size={16} className="text-primary dark:text-accent" />
                        <h3 className="text-sm font-black text-gray-900 dark:text-white">Simulador de Comissão</h3>
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium">Simule o ganho de uma proposta comercial na hora.</p>
                    </div>

                    <div className="space-y-4 text-xs">
                      {/* Product select */}
                      <div className="space-y-1">
                        <label className="font-bold text-gray-400 uppercase">Selecione o Modelo de Carregador</label>
                        <select
                          value={selectedProduct}
                          onChange={(e) => handleProductChange(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none"
                        >
                          {PRODUCT_CATEGORIES.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Custom Price and Quantity */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-bold text-gray-400 uppercase">Preço Unitário (R$)</label>
                          <input
                            type="number"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-gray-400 uppercase">Quantidade</label>
                          <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Commission rate slider */}
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between font-bold text-gray-400 uppercase">
                          <span>Percentual de Comissão</span>
                          <span className="text-primary dark:text-accent font-black">{customPercent}%</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="0.5"
                          value={customPercent}
                          onChange={(e) => setCustomPercent(Number(e.target.value))}
                          className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#004D31] dark:accent-[#B2D235]"
                        />
                      </div>

                      {/* Results Box */}
                      <div className="p-4 rounded-2xl bg-gray-55/50 dark:bg-slate-950 border border-gray-100 dark:border-slate-850 space-y-3 mt-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400 font-medium">Valor Total do Pedido</span>
                          <span className="font-extrabold text-gray-900 dark:text-white">
                            R$ {calculatedTotalSale.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-slate-850">
                          <span className="text-gray-400 font-bold">Sua Comissão Estimada</span>
                          <span className="text-base font-black text-[#004D31] dark:text-[#B2D235]">
                            R$ {calculatedCommission.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ========================================================================= */
              /* PAINEL DO GESTOR */
              /* ========================================================================= */
              <motion.div
                key="gestor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Upper Consolidated Financial Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-2">
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Volume Geral de Vendas</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">R$ 432.000,00</h3>
                    <p className="text-xs text-gray-400 font-medium">Faturamento da equipe consolidado em junho</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-2">
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Total Comissões Devidas</p>
                    <h3 className="text-2xl font-black text-[#004D31] dark:text-[#B2D235]">R$ 21.600,00</h3>
                    <p className="text-xs text-gray-400 font-medium">Equivale a 5% da receita média geral</p>
                  </div>

                  {/* Actions Box */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Relatório Financeiro</p>
                    <button
                      onClick={handleExportCSV}
                      className="w-full bg-[#004D31] dark:bg-[#B2D235] text-white dark:text-[#004D31] py-3 rounded-2xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Download size={15} />
                      Exportar CSV Consolidado
                    </button>
                  </div>
                </div>

                {/* Split Team performance vs Rules config */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Left Column: Team Gamified Leaderboard */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm lg:col-span-3 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-gray-900 dark:text-white">Ranking de Performance da Equipe</h3>
                      <span className="text-[10px] text-emerald-500 font-extrabold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">Gamificado</span>
                    </div>

                    <div className="space-y-3">
                      {MOCK_RANKING.map((member, idx) => (
                        <div 
                          key={member.name}
                          className="p-4 rounded-2xl border border-gray-55 dark:border-slate-850 flex items-center justify-between gap-4 bg-gray-50/10 dark:bg-slate-900/10"
                        >
                          <div className="flex items-center gap-3">
                            {/* Position badge */}
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white ${
                              idx === 0 
                                ? 'bg-amber-500' 
                                : idx === 1 
                                ? 'bg-slate-400' 
                                : idx === 2
                                ? 'bg-amber-700'
                                : 'bg-gray-300 dark:bg-slate-800 text-gray-500'
                            }`}>
                              {idx + 1}
                            </span>
                            
                            <div>
                              <p className="text-xs font-bold text-gray-900 dark:text-white">{member.name}</p>
                              <p className="text-[10px] text-gray-400">Meta Atingida: {member.goalAchievement}%</p>
                            </div>
                          </div>

                          <div className="text-right text-xs">
                            <p className="font-extrabold text-gray-900 dark:text-white">
                              R$ {member.salesVolume.toLocaleString('pt-BR')}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium">Comissão: R$ {member.commissionEarned.toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Global Commission Rates configurator */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Settings2 size={16} className="text-primary dark:text-accent" />
                        <h3 className="text-sm font-black text-gray-900 dark:text-white">Configuração de Regras</h3>
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium">Configure a comissão padrão por tipo de carregador.</p>
                    </div>

                    <div className="space-y-4 text-xs">
                      {PRODUCT_CATEGORIES.map(p => (
                        <div key={p.id} className="space-y-2">
                          <div className="flex justify-between items-baseline font-medium">
                            <span className="text-gray-900 dark:text-white font-bold">{p.name}</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="20"
                                step="0.5"
                                value={rates[p.id] !== undefined ? rates[p.id] : p.commDefault}
                                onChange={(e) => setRates({ ...rates, [p.id]: Number(e.target.value) })}
                                className="w-10 text-center font-black text-[#004D31] dark:text-[#B2D235] border-b border-gray-200 focus:outline-none focus:border-[#004D31] bg-transparent"
                              />
                              <span className="text-gray-400 font-bold">%</span>
                            </div>
                          </div>
                          <p className="text-[9px] text-gray-450">Preço Base Sugerido: R$ {p.price.toLocaleString('pt-BR')}</p>
                        </div>
                      ))}

                      <button 
                        onClick={() => {
                          alert('Taxas globais salvas e atualizadas para propostas futuras!');
                        }}
                        className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-700 dark:text-white py-3 rounded-2xl text-xs font-black transition-all cursor-pointer mt-4 border border-gray-200/20"
                      >
                        Salvar Taxas Globais
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}

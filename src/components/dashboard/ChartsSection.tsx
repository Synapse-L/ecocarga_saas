"use client";

import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import {
  FileText,
  DollarSign,
  ArrowUpRight,
  CheckCircle2,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  Cpu,
} from 'lucide-react';

// ── Local sub-components ──────────────────────────────────────────────────────

function KPICard({
  title,
  value,
  subtitle,
  growth,
  icon: Icon,
}: {
  title: string;
  value: any;
  subtitle: string;
  growth?: number;
  icon: any;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden transition-colors duration-300"
    >
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider leading-none">
          {title}
        </span>
        <div className="p-2 bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-slate-400 rounded-xl transition-colors">
          <Icon size={16} />
        </div>
      </div>

      <div className="mt-auto">
        <h4 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{value}</h4>

        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase">{subtitle}</span>

          {growth !== undefined && (
            <div
              className={`flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                growth >= 0
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                  : 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
              }`}
            >
              {growth >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              <span>
                {growth >= 0 ? '+' : ''}
                {growth.toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MarketStatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: any;
  subtitle: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800/60 transition-colors">
      <span className="text-[10px] font-bold uppercase text-gray-400 dark:text-slate-500 tracking-wider block">
        {title}
      </span>
      <h4 className="text-lg font-black text-gray-900 dark:text-white mt-1.5">{value}</h4>
      <span className="text-[9px] text-gray-400 dark:text-slate-500 font-medium block mt-1">{subtitle}</span>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ChartsSectionProps {
  stats: any;
  theme: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChartsSection({ stats, theme }: ChartsSectionProps) {
  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#1f2937' : '#e2e8f0';
  const textFill = isDark ? '#94a3b8' : '#64748b';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-xl shadow-lg transition-colors duration-300">
          <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="text-sm font-black mt-1" style={{ color: p.color || p.fill }}>
              {p.name}:{' '}
              {p.name.includes('Faturamento') || p.name.includes('Valor') || p.name.includes('Receita')
                ? `R$ ${p.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* Section 1: Executive KPIs */}
      <div data-tour="kpis" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <KPICard
          title="Total de Propostas"
          value={stats.kpis.totalProposals.value}
          subtitle="propostas totais"
          growth={stats.kpis.totalProposals.growth}
          icon={FileText}
        />
        <KPICard
          title="Valor Total Proposto"
          value={`R$ ${stats.kpis.totalValue.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
          subtitle="volume total histórico"
          icon={DollarSign}
        />
        <KPICard
          title="Receita Potencial"
          value={`R$ ${stats.kpis.potentialValue.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
          subtitle="em aberto / negociação"
          icon={ArrowUpRight}
        />
        <KPICard
          title="Taxa de Conversão"
          value={`${stats.kpis.conversionRate.value.toFixed(0)}%`}
          subtitle="negócios fechados"
          growth={stats.kpis.conversionRate.growth}
          icon={CheckCircle2}
        />
        <KPICard
          title="Ticket Médio"
          value={`R$ ${stats.kpis.averageTicket.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
          subtitle="valor médio do projeto"
          icon={Activity}
        />
        <KPICard
          title="Tempo de Fechamento"
          value={`${stats.kpis.avgClosingTimeDays.value} dias`}
          subtitle="média criação a aprovação"
          icon={Clock}
        />
      </div>

      {/* Section 2: Recharts Analytics Grid */}
      <div data-tour="charts" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Evolution of Proposals AreaChart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-950 dark:text-white">
              Propostas por Mês
            </h3>
            <span className="text-[10px] bg-primary/5 text-primary dark:bg-accent/5 dark:text-accent font-bold px-2.5 py-1 rounded-md">
              Últimos 12 meses
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.charts.evolutionData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCriadas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#004D31" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#004D31" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFechadas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B2D235" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#B2D235" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="name" stroke={textFill} fontSize={10} tickLine={false} />
                <YAxis stroke={textFill} fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Criadas"
                  stroke="#004D31"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCriadas)"
                />
                <Area
                  type="monotone"
                  dataKey="Fechadas"
                  stroke="#B2D235"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorFechadas)"
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, marginTop: 10 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Chart 2: Projected Revenue BarChart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-950 dark:text-white">
              Receita Prevista por Mês
            </h3>
            <span className="text-[10px] bg-primary/5 text-primary dark:bg-accent/5 dark:text-accent font-bold px-2.5 py-1 rounded-md">
              Faturamento Realizado
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.charts.evolutionData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="name" stroke={textFill} fontSize={10} tickLine={false} />
                <YAxis stroke={textFill} fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Faturamento" name="Receita Fechada" fill="#004D31" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Chart 3: Conversion Funnel Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors duration-300"
        >
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-950 dark:text-white mb-4">
            Funil de Conversão
          </h3>
          <div className="h-64 w-full flex items-center">
            <ResponsiveContainer width="100%" height="90%">
              <FunnelChart>
                <Tooltip content={<CustomTooltip />} />
                <Funnel dataKey="value" data={stats.charts.funnelData} isAnimationActive>
                  <LabelList position="right" fill={textFill} dataKey="loss" stroke="none" fontSize={10} />
                  <LabelList
                    position="inside"
                    fill="#fff"
                    stroke="none"
                    dataKey="name"
                    fontSize={11}
                    fontWeight="bold"
                  />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Chart 4: Status Distribution Donut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors duration-300"
        >
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-950 dark:text-white mb-4">
            Distribuição de Status
          </h3>
          <div className="h-64 w-full flex items-center justify-between">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={stats.charts.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stats.charts.statusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2 pl-4 border-l border-gray-100 dark:border-slate-800 transition-colors">
              {stats.charts.statusData.map((entry: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs font-bold text-gray-600 dark:text-slate-350">{entry.name}</span>
                  </div>
                  <span className="text-xs font-black text-gray-900 dark:text-white">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Section 3: Mercado de Mobilidade Elétrica */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-2 mb-6 border-b border-gray-50 dark:border-slate-800 pb-4">
          <Cpu className="text-primary dark:text-accent" size={24} />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Mercado de Mobilidade Elétrica</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MarketStatCard
            title="Carregadores Propostos"
            value={stats.market.proposedChargers}
            subtitle="quantidade total de totens"
          />
          <MarketStatCard
            title="Potência Instalada"
            value={`${stats.market.totalPowerKW.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kW`}
            subtitle="soma dos kW propostos"
          />
          <MarketStatCard
            title="Receita Potencial"
            value={`R$ ${stats.market.potentialValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
            subtitle="vendas previstas mobilidade"
          />
          <MarketStatCard
            title="Ticket Médio por Projeto"
            value={`R$ ${stats.kpis.averageTicket.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
            subtitle="ticket geral de carregador"
          />
        </div>
      </div>
    </>
  );
}

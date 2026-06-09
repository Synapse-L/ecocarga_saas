"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Copy, 
  MoreVertical, 
  LayoutDashboard, 
  Settings, 
  Users, 
  LogOut,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Cpu,
  Sliders,
  Sparkles,
  DollarSign,
  Activity,
  ArrowUpRight,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { PDFService } from '@/lib/pdf-service';
import { ProposalPage6 } from '@/components/ProposalPage6';
import { ProposalCover } from '@/components/ProposalCover';
import { useApp } from '@/context/AppContext';
import { getDashboardStats, DashboardProposal } from '@/lib/dashboard-data';
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
  LabelList
} from 'recharts';

type ReorderPage = {
  id: string;
  type: 'template' | 'saas-cover' | 'saas-page6';
  label: string;
  index: number | null;
};

export default function Dashboard() {
  const { profile, t, theme } = useApp();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<any[]>([]);
  const router = useRouter();
  
  // Dashboard evolved stats state
  const [stats, setStats] = useState<any>(null);

  // Table filtering, sorting, pagination states
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // PDF download & view states
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [currentProposal, setCurrentProposal] = useState<any>(null);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [reorderPages, setReorderPages] = useState<ReorderPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();

    // Close options menu when clicking outside
    const handleOutsideClick = () => {
      setActiveMenuId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch Proposals
      const { data: proposalData } = await supabase
        .from('proposals')
        .select(`
          *,
          client:clients(name),
          template:templates(file_url)
        `)
        .order('created_at', { ascending: false });
      
      const realData = proposalData || [];
      setProposals(realData);
      
      // Calculate commercial intelligence stats
      const computed = getDashboardStats(realData);
      setStats(computed);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // PDF action handlers
  const handleView = async (proposal: any) => {
    setViewingId(proposal.id);
    setCurrentProposal(proposal.commercial_data);
    
    setTimeout(async () => {
      try {
        if (!proposal.template?.file_url) {
          await PDFService.viewOnlyPage6('proposal-page-6');
        } else {
          const pageCount = await PDFService.getTemplatePageCount(proposal.template.file_url);
          const pageOrder: Array<{ type: 'template' | 'saas-cover' | 'saas-page6'; index?: number }> = [];
          
          pageOrder.push({ type: 'saas-cover' as const });
          
          for (let i = 1; i < Math.min(5, pageCount); i++) {
            pageOrder.push({ type: 'template' as const, index: i });
          }
          
          pageOrder.push({ type: 'saas-page6' as const });
          
          for (let i = 6; i < pageCount; i++) {
            pageOrder.push({ type: 'template' as const, index: i });
          }

          await PDFService.viewCustomOrderedPdf(
            proposal.template.file_url,
            'proposal-cover',
            'proposal-page-6',
            pageOrder
          );
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao visualizar PDF');
      } finally {
        setViewingId(null);
      }
    }, 500);
  };

  const handleDuplicate = async (proposal: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('proposals')
        .insert({
          user_id: user.id,
          client_id: proposal.client_id,
          template_id: proposal.template_id,
          title: `${proposal.title} (Cópia)`,
          commercial_data: proposal.commercial_data,
          status: 'Rascunho'
        });

      if (error) throw error;
      fetchDashboardData();
    } catch (err) {
      console.error('Erro ao duplicar proposta:', err);
      alert('Erro ao duplicar proposta');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta proposta?')) return;
    try {
      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchDashboardData();
    } catch (err) {
      console.error('Erro ao excluir proposta:', err);
      alert('Erro ao excluir proposta');
    }
  };

  const handleDownload = async (proposal: any) => {
    if (!proposal.template?.file_url) {
      setDownloadingId(proposal.id);
      setCurrentProposal(proposal.commercial_data);
      setTimeout(async () => {
        try {
          await PDFService.downloadTestProposal(
            'proposal-cover',
            'proposal-page-6',
            `Proposta_TESTE_Completa_${proposal.client?.name || proposal.id}`
          );
        } catch (err) {
          console.error(err);
          alert('Erro ao gerar PDF');
        } finally {
          setDownloadingId(null);
        }
      }, 500);
      return;
    }

    setSelectedProposal(proposal);
    setCurrentProposal(proposal.commercial_data);
    setLoadingPages(true);
    setIsReorderModalOpen(true);

    try {
      const pageCount = await PDFService.getTemplatePageCount(proposal.template.file_url);
      const initialPages: ReorderPage[] = [];
      
      initialPages.push({
        id: 'saas-cover',
        type: 'saas-cover',
        label: t('stepClient') + ' (SaaS)',
        index: null
      });

      for (let i = 1; i < Math.min(5, pageCount); i++) {
        initialPages.push({
          id: `template-${i}`,
          type: 'template',
          label: `${t('templatePageLabel')} ${i + 1}`,
          index: i
        });
      }

      initialPages.push({
        id: 'saas-page6',
        type: 'saas-page6',
        label: `${t('techSpecsPage6')} (SaaS)`,
        index: null
      });

      for (let i = 6; i < pageCount; i++) {
        initialPages.push({
          id: `template-${i}`,
          type: 'template',
          label: `${t('templatePageLabel')} ${i + 1}`,
          index: i
        });
      }

      setReorderPages(initialPages);
    } catch (err) {
      console.error('Erro ao ler páginas do template:', err);
      alert('Erro ao carregar páginas do modelo');
      setIsReorderModalOpen(false);
    } finally {
      setLoadingPages(false);
    }
  };

  const handleConfirmDownload = async () => {
    if (!selectedProposal) return;
    setDownloadingId(selectedProposal.id);
    setIsReorderModalOpen(false);

    setTimeout(async () => {
      try {
        const pageOrderPayload = reorderPages.map(page => ({
          type: page.type,
          index: page.index !== null ? page.index : undefined
        }));

        await PDFService.generateCustomOrderedPdf(
          selectedProposal.template.file_url,
          'proposal-cover',
          'proposal-page-6',
          pageOrderPayload,
          `Proposta_${selectedProposal.client?.name || selectedProposal.id}`
        );
      } catch (err) {
        console.error(err);
        alert('Erro ao gerar PDF com a ordem personalizada');
      } finally {
        setDownloadingId(null);
        setSelectedProposal(null);
      }
    }, 500);
  };

  const movePage = (index: number, direction: 'up' | 'down') => {
    const newPages = [...reorderPages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newPages.length) return;
    
    const temp = newPages[index];
    newPages[index] = newPages[targetIndex];
    newPages[targetIndex] = temp;
    
    setReorderPages(newPages);
  };

  // CSV Export utility
  const handleExportCSV = () => {
    if (!stats || !stats.allProposals) return;
    
    const headers = ['Titulo', 'Cliente', 'Produto', 'Potencia', 'Valor (R$)', 'Status', 'Data Criacao'];
    const rows = filteredProposals.map(p => [
      p.title,
      p.client?.name || p.commercial_data?.client?.name || 'Cliente s/ nome',
      p.commercial_data?.commercial?.productName || '',
      p.commercial_data?.commercial?.power || '',
      p.commercial_data?.commercial?.price || 0,
      p.status,
      new Date(p.created_at).toLocaleDateString('pt-BR')
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Relatorio_Propostas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter, sort & paginate proposals locally
  const getFilteredProposals = (): DashboardProposal[] => {
    if (!stats || !stats.allProposals) return [];
    let list = [...stats.allProposals] as DashboardProposal[];

    // 1. Search text filter
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) ||
        (p.client?.name || '').toLowerCase().includes(q) ||
        (p.commercial_data?.commercial?.productName || '').toLowerCase().includes(q)
      );
    }

    // 2. Status filter
    if (statusFilter !== 'All') {
      list = list.filter(p => {
        if (statusFilter === 'Concluído') return p.status === 'Concluído';
        if (statusFilter === 'Enviado') return p.status === 'Enviado';
        if (statusFilter === 'Rascunho') return p.status === 'Rascunho';
        if (statusFilter === 'Negociação') return p.status === 'Negociação';
        if (statusFilter === 'Vencido') return p.status === 'Vencido';
        return true;
      });
    }

    // 3. Period filter
    if (periodFilter !== 'all') {
      const now = new Date();
      list = list.filter(p => {
        const pd = new Date(p.created_at);
        const diffDays = (now.getTime() - pd.getTime()) / (1000 * 3600 * 24);
        
        if (periodFilter === '7d') return diffDays <= 7;
        if (periodFilter === '30d') return diffDays <= 30;
        if (periodFilter === 'month') return pd.getMonth() === now.getMonth() && pd.getFullYear() === now.getFullYear();
        if (periodFilter === 'year') return pd.getFullYear() === now.getFullYear();
        return true;
      });
    }

    // 4. Sorting
    list.sort((a, b) => {
      let valA: any = a[sortBy as keyof DashboardProposal] || '';
      let valB: any = b[sortBy as keyof DashboardProposal] || '';

      if (sortBy === 'client') {
        valA = a.client?.name || a.commercial_data?.client?.name || '';
        valB = b.client?.name || b.commercial_data?.client?.name || '';
      } else if (sortBy === 'price') {
        valA = a.commercial_data?.commercial?.price || 0;
        valB = b.commercial_data?.commercial?.price || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  };

  const filteredProposals = getFilteredProposals();
  const totalPages = Math.max(1, Math.ceil(filteredProposals.length / itemsPerPage));
  const paginatedProposals = filteredProposals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Recharts custom styling vars
  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#1f2937' : '#e2e8f0';
  const textFill = isDark ? '#94a3b8' : '#64748b';

  // Custom tooltips for graphs
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-xl shadow-lg transition-colors duration-300">
          <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="text-sm font-black mt-1" style={{ color: p.color || p.fill }}>
              {p.name}: {p.name.includes('Faturamento') || p.name.includes('Valor') || p.name.includes('Receita')
                ? `R$ ${p.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-slate-950 transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary dark:text-accent" size={48} />
          <p className="text-sm text-gray-400 font-bold uppercase tracking-wider animate-pulse">Carregando painel comercial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50 dark:bg-slate-950 transition-colors duration-300">
      {/* Hidden renderer for PDF capturing (ALWAYS light/white background as user wants) */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {currentProposal && (
          <>
            <ProposalCover data={currentProposal} representativeName={profile?.full_name} />
            <ProposalPage6 data={currentProposal} />
          </>
        )}
      </div>

      {/* Sidebar (UNTOUCHED) */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col fixed h-full z-20 transition-colors duration-300">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">ProposalPro</span>
          </div>

          <nav className="space-y-1">
            <NavItem icon={LayoutDashboard} label={t('dashboard')} href="/" active />
            <NavItem icon={FileText} label={t('proposals')} href="#" />
            <NavItem icon={Users} label={t('clients')} href="#" />
            <NavItem icon={Cpu} label={t('chargers')} href="/models" />
            <NavItem icon={Sliders} label={t('templates')} href="/templates" />
            <NavItem icon={Settings} label={t('settings')} href="/settings" />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-850 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
              {profile?.full_name?.substring(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{profile?.full_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Plano Pro</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-2 py-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col ml-64 min-h-screen">
        {/* Header (Layout kept identical, button/search preserved) */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-10 transition-colors duration-300">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('dashboard')}</h1>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder={t('search')} 
                className="pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-800 rounded-full bg-gray-50/50 dark:bg-slate-950 text-gray-950 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/10 w-64 text-sm transition-all"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <button 
              onClick={() => router.push('/proposals/new')}
              className="bg-primary text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm active:scale-95 text-sm cursor-pointer"
            >
              <Plus size={20} />
              {t('newProposal')}
            </button>
          </div>
        </header>

        {/* Evolved Scrollable Content Area */}
        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          
          {/* Section 1: Executive KPIs (Cards Inteligentes) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <KPICard 
              title={t('totalProposals')}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Evolution of Proposals AreaChart */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-950 dark:text-white">Propostas por Mês</h3>
                <span className="text-[10px] bg-primary/5 text-primary dark:bg-accent/5 dark:text-accent font-bold px-2.5 py-1 rounded-md">Últimos 12 meses</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.charts.evolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCriadas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#004D31" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#004D31" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorFechadas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#B2D235" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#B2D235" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" stroke={textFill} fontSize={10} tickLine={false} />
                    <YAxis stroke={textFill} fontSize={10} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Criadas" stroke="#004D31" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCriadas)" />
                    <Area type="monotone" dataKey="Fechadas" stroke="#B2D235" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFechadas)" />
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
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-950 dark:text-white">Receita Prevista por Mês</h3>
                <span className="text-[10px] bg-primary/5 text-primary dark:bg-accent/5 dark:text-accent font-bold px-2.5 py-1 rounded-md">Faturamento Realizado</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.charts.evolutionData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-950 dark:text-white mb-4">Funil de Conversão</h3>
              <div className="h-64 w-full flex items-center">
                <ResponsiveContainer width="100%" height="90%">
                  <FunnelChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Funnel
                      dataKey="value"
                      data={stats.charts.funnelData}
                      isAnimationActive
                    >
                      <LabelList position="right" fill={textFill} dataKey="loss" stroke="none" fontSize={10} />
                      <LabelList position="inside" fill="#fff" stroke="none" dataKey="name" fontSize={11} fontWeight="bold" />
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
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-950 dark:text-white mb-4">Distribuição de Status</h3>
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

          {/* Section 4: IA Insights, Top Clientes & Top Produtos */}
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
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Insights Comerciais</h3>
                </div>
                
                <div className="space-y-4">
                  {stats.insights.map((insight: any, i: number) => (
                    <div 
                      key={i} 
                      className={`p-4 rounded-2xl border transition-all ${
                        insight.type === 'success' ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30' :
                        insight.type === 'info' ? 'bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30' :
                        'bg-amber-50/50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30'
                      }`}
                    >
                      <h4 className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase mb-1 flex items-center gap-1.5">
                        {insight.type === 'success' ? <TrendingUp size={14} className="text-emerald-500" /> :
                         insight.type === 'info' ? <Activity size={14} className="text-blue-500" /> :
                         <DollarSign size={14} className="text-amber-500" />}
                        {insight.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 font-medium leading-relaxed">{insight.description}</p>
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
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Top 10 Clientes</h3>
                <span className="text-[9px] bg-primary/5 text-primary dark:bg-accent/5 dark:text-accent font-bold px-2 py-0.5 rounded">Faturamento</span>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {stats.topClients.map((client: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-1 border-b border-gray-50/50 dark:border-slate-800/50 last:border-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-xs font-bold text-gray-400 dark:text-slate-600 min-w-4">#{index + 1}</span>
                      <div className="truncate">
                        <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">{client.name}</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase">{client.count} propostas</span>
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
                <span className="text-[9px] bg-primary/5 text-primary dark:bg-accent/5 dark:text-accent font-bold px-2 py-0.5 rounded">Unidades</span>
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

          {/* Section 5: Timeline & Tabela de Propostas Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Tabela de Propostas (2/3 width) */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Tabela Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
                
                {/* Tabela Header & Controls */}
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Gerenciador de Propostas</h2>
                    
                    <button 
                      onClick={handleExportCSV}
                      className="text-xs font-bold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-accent border border-gray-100 dark:border-slate-800 px-3.5 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-850 transition-all flex items-center gap-1.5"
                    >
                      <FileSpreadsheet size={16} />
                      Exportar CSV
                    </button>
                  </div>

                  {/* Filter and Period Selectors */}
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2 border border-gray-100 dark:border-slate-800 rounded-xl px-3 py-1.5 bg-gray-50/30 dark:bg-slate-950/20 text-xs font-bold text-gray-500 dark:text-slate-400 transition-colors">
                      <Filter size={14} />
                      <span>Filtros:</span>
                    </div>

                    {/* Status Dropdown */}
                    <select 
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                      className="border border-gray-100 dark:border-slate-800 rounded-xl px-3 py-1.5 bg-white dark:bg-slate-900 text-xs font-bold text-gray-700 dark:text-slate-350 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                    >
                      <option value="All">Status: Todos</option>
                      <option value="Rascunho">Status: Rascunho</option>
                      <option value="Enviado">Status: Enviada</option>
                      <option value="Negociação">Status: Negociação</option>
                      <option value="Concluído">Status: Aprovada</option>
                      <option value="Vencido">Status: Recusada</option>
                    </select>

                    {/* Period Dropdown */}
                    <select 
                      value={periodFilter}
                      onChange={(e) => { setPeriodFilter(e.target.value); setCurrentPage(1); }}
                      className="border border-gray-100 dark:border-slate-800 rounded-xl px-3 py-1.5 bg-white dark:bg-slate-900 text-xs font-bold text-gray-700 dark:text-slate-350 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                    >
                      <option value="all">Período: Histórico</option>
                      <option value="7d">Últimos 7 dias</option>
                      <option value="30d">Últimos 30 dias</option>
                      <option value="month">Este mês</option>
                      <option value="year">Este ano</option>
                    </select>
                  </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50 dark:bg-slate-950/50 text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-gray-50 dark:border-slate-800 select-none transition-colors">
                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-100/30 dark:hover:bg-slate-850/30 transition-colors" onClick={() => toggleSort('client')}>
                          <div className="flex items-center gap-1.5">
                            {t('clientName')}
                            <ArrowUpDown size={12} className="text-gray-400" />
                          </div>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-100/30 dark:hover:bg-slate-850/30 transition-colors" onClick={() => toggleSort('title')}>
                          <div className="flex items-center gap-1.5">
                            {t('title')}
                            <ArrowUpDown size={12} className="text-gray-400" />
                          </div>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-100/30 dark:hover:bg-slate-850/30 transition-colors" onClick={() => toggleSort('price')}>
                          <div className="flex items-center gap-1.5">
                            Valor
                            <ArrowUpDown size={12} className="text-gray-400" />
                          </div>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-100/30 dark:hover:bg-slate-850/30 transition-colors" onClick={() => toggleSort('created_at')}>
                          <div className="flex items-center gap-1.5">
                            {t('date')}
                            <ArrowUpDown size={12} className="text-gray-400" />
                          </div>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-100/30 dark:hover:bg-slate-850/30 transition-colors" onClick={() => toggleSort('status')}>
                          <div className="flex items-center gap-1.5">
                            {t('status')}
                            <ArrowUpDown size={12} className="text-gray-400" />
                          </div>
                        </th>
                        <th className="px-6 py-4 text-right">{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800 transition-colors">
                      {paginatedProposals.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400 font-medium text-sm">
                            Nenhuma proposta atende a estes critérios de filtro.
                          </td>
                        </tr>
                      ) : (
                        paginatedProposals.map((prop) => (
                          <tr key={prop.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-950/20 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">{prop.client?.name || 'Cliente s/ nome'}</div>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-600 dark:text-slate-350 font-medium">
                              <span className="truncate max-w-[150px] block">{prop.title}</span>
                            </td>
                            <td className="px-6 py-4 text-xs font-black text-gray-900 dark:text-white">
                              R$ {(prop.commercial_data?.commercial?.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-500 dark:text-slate-400">
                              {new Date(prop.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={prop.status} />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleView(prop)}
                                  disabled={viewingId === prop.id || downloadingId === prop.id}
                                  title={t('view')} 
                                  className="p-2 text-gray-400 hover:text-primary dark:hover:text-accent hover:bg-primary/5 dark:hover:bg-accent/5 rounded-lg transition-all disabled:opacity-30 cursor-pointer"
                                >
                                  {viewingId === prop.id ? <Loader2 className="animate-spin" size={16} /> : <ExternalLink size={16} />}
                                </button>
                                <button 
                                  onClick={() => handleDownload(prop)}
                                  disabled={downloadingId === prop.id || viewingId === prop.id}
                                  title={t('download')} 
                                  className="p-2 text-gray-400 hover:text-primary dark:hover:text-accent hover:bg-primary/5 dark:hover:bg-accent/5 rounded-lg transition-all disabled:opacity-30 cursor-pointer"
                                >
                                  {downloadingId === prop.id ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                                </button>
                                <button 
                                  onClick={() => handleDuplicate(prop)}
                                  title={t('duplicate')} 
                                  className="p-2 text-gray-400 hover:text-primary dark:hover:text-accent hover:bg-primary/5 dark:hover:bg-accent/5 rounded-lg transition-all cursor-pointer"
                                >
                                  <Copy size={16} />
                                </button>
                                <div className="relative">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(activeMenuId === prop.id ? null : prop.id);
                                    }}
                                    title={t('actions')}
                                    className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                                  >
                                    <MoreVertical size={16} />
                                  </button>
                                  
                                  {activeMenuId === prop.id && (
                                    <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-lg z-30 py-1 text-left">
                                      <button
                                        onClick={() => {
                                          handleDelete(prop.id);
                                          setActiveMenuId(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-2 cursor-pointer"
                                      >
                                        {t('delete')}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Pagination */}
                {totalPages > 1 && (
                  <div className="p-6 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-gray-500 transition-colors">
                    <span>
                      Exibindo {paginatedProposals.length} de {filteredProposals.length} propostas
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(v => Math.max(1, v - 1))}
                        className="p-2 rounded-lg border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-850 disabled:opacity-20 cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="px-2">Página {currentPage} de {totalPages}</span>
                      <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(v => Math.min(totalPages, v + 1))}
                        className="p-2 rounded-lg border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-850 disabled:opacity-20 cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Linha do Tempo (Recent Activities - 1/3 width) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
              <div className="flex items-center gap-2 mb-6 pb-3 border-b border-gray-50 dark:border-slate-800">
                <Calendar className="text-primary dark:text-accent" size={20} />
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Atividade Recente</h3>
              </div>

              <div className="relative border-l border-gray-100 dark:border-slate-800 ml-3.5 space-y-6 transition-colors">
                {stats.timelineEvents.map((evt: any, i: number) => (
                  <div key={i} className="relative pl-7 group">
                    {/* Timeline bullet indicator */}
                    <div className="absolute -left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-white dark:bg-slate-900 border-2 border-primary dark:border-accent group-hover:scale-125 transition-transform" />
                    
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold block">{evt.date} às {evt.time}</span>
                    <span className="text-xs font-bold text-gray-950 dark:text-white block mt-0.5">{evt.action}</span>
                    <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium block mt-0.5">
                      {evt.client} • {evt.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Reordering Modal (UNTOUCHED page count and custom ordered downloads) */}
      <AnimatePresence>
        {isReorderModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 flex flex-col max-h-[85vh] transition-colors duration-300"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-950/50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {t('organizePdfPages')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    {t('organizePdfHelp')}
                  </p>
                </div>
                <button 
                  onClick={() => setIsReorderModalOpen(false)}
                  className="text-gray-400 hover:text-gray-750 dark:hover:text-white font-bold text-sm cursor-pointer"
                >
                  {t('close')}
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {loadingPages ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="animate-spin text-primary dark:text-accent" size={32} />
                    <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">{t('loadingTemplatePages')}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reorderPages.map((page, index) => {
                      const isSaas = page.type === 'saas-cover' || page.type === 'saas-page6';
                      return (
                        <motion.div
                          key={page.id}
                          layout
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                            isSaas 
                              ? 'bg-emerald-50/70 border-emerald-200/60 dark:bg-emerald-950/20 dark:border-emerald-900/60 shadow-sm shadow-emerald-100/50 dark:shadow-none' 
                              : 'bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-705'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isSaas ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-gray-400'
                            }`}>
                              <span className="text-xs font-bold">{index + 1}</span>
                            </div>
                            
                            <div>
                              <span className={`text-sm font-bold block ${isSaas ? 'text-emerald-950 dark:text-emerald-250' : 'text-gray-800 dark:text-slate-200'}`}>
                                {page.label}
                              </span>
                              <div className="mt-1">
                                {isSaas ? (
                                  <span className="bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/10 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                    {t('saasPageLabel')}
                                  </span>
                                ) : (
                                  <span className="bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200/50 dark:border-slate-800 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                    {t('templatePageLabel')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Reordering Actions */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => movePage(index, 'up')}
                              className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-20 transition-all cursor-pointer"
                              title="Mover para cima"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                            </button>
                            <button
                              type="button"
                              disabled={index === reorderPages.length - 1}
                              onClick={() => movePage(index, 'down')}
                              className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-20 transition-all cursor-pointer"
                              title="Mover para baixo"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReorderModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  disabled={loadingPages}
                  onClick={handleConfirmDownload}
                  className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 text-sm shadow-sm cursor-pointer"
                >
                  {t('confirmAndDownload')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Subcomponents helper
function NavItem({ icon: Icon, label, active = false, href = "#" }: { icon: any, label: string, active?: boolean, href?: string }) {
  return (
    <a 
      href={href} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
        active 
          ? 'bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent shadow-sm' 
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-850 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
      {active && <motion.div layoutId="activeNav" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary dark:bg-accent" />}
    </a>
  );
}

function KPICard({ title, value, subtitle, growth, icon: Icon }: { title: string; value: any; subtitle: string; growth?: number; icon: any }) {
  return (
    <motion.div 
      whileHover={{ y: -3 }}
      className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden transition-colors duration-300"
    >
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider leading-none">{title}</span>
        <div className="p-2 bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-slate-400 rounded-xl transition-colors">
          <Icon size={16} />
        </div>
      </div>
      
      <div className="mt-auto">
        <h4 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{value}</h4>
        
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase">{subtitle}</span>
          
          {growth !== undefined && (
            <div className={`flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md ${
              growth >= 0 
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                : 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
            }`}>
              {growth >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              <span>{growth >= 0 ? '+' : ''}{growth.toFixed(0)}%</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MarketStatCard({ title, value, subtitle }: { title: string; value: any; subtitle: string }) {
  return (
    <div className="p-5 rounded-2xl bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800/60 transition-colors">
      <span className="text-[10px] font-bold uppercase text-gray-400 dark:text-slate-500 tracking-wider block">{title}</span>
      <h4 className="text-lg font-black text-gray-900 dark:text-white mt-1.5">{value}</h4>
      <span className="text-[9px] text-gray-400 dark:text-slate-500 font-medium block mt-1">{subtitle}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
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

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
  Clock,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { PDFService } from '@/lib/pdf-service';
import { ProposalPage6 } from '@/components/ProposalPage6';
import { ProposalCover } from '@/components/ProposalCover';

type ReorderPage = {
  id: string;
  type: 'template' | 'saas-cover' | 'saas-page6';
  label: string;
  index: number | null;
};

export default function Dashboard() {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [currentProposal, setCurrentProposal] = useState<any>(null);

  // Reordering PDF Pages state
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [reorderPages, setReorderPages] = useState<ReorderPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);

  // Proposal actions states
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

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profileData || { full_name: user.email?.split('@')[0] });

      // Fetch Proposals
      const { data: proposalData } = await supabase
        .from('proposals')
        .select(`
          *,
          client:clients(name),
          template:templates(file_url)
        `)
        .order('created_at', { ascending: false });
      
      setProposals(proposalData || []);
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

  const handleView = async (proposal: any) => {
    setViewingId(proposal.id);
    setCurrentProposal(proposal.commercial_data);
    
    // Wait for the hidden component to render
    setTimeout(async () => {
      try {
        if (!proposal.template?.file_url) {
          console.log('Nenhum template PDF associado. Visualizando apenas a Página 6 HTML.');
          await PDFService.viewOnlyPage6('proposal-page-6');
        } else {
          // Generate default page order: SaaS Cover + template pages (excluding cover & page 6) + SaaS Page 6
          const pageCount = await PDFService.getTemplatePageCount(proposal.template.file_url);
          const pageOrder: Array<{ type: 'template' | 'saas-cover' | 'saas-page6'; index?: number }> = [];
          
          // Cover page (index 0)
          pageOrder.push({ type: 'saas-cover' as const });
          
          // Template pages index 1 to 4 (if they exist)
          for (let i = 1; i < Math.min(5, pageCount); i++) {
            pageOrder.push({ type: 'template' as const, index: i });
          }
          
          // Page 6 (index 5)
          pageOrder.push({ type: 'saas-page6' as const });
          
          // Any remaining template pages from index 6 onwards
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
      setProposals(proposals.filter(p => p.id !== id));
    } catch (err) {
      console.error('Erro ao excluir proposta:', err);
      alert('Erro ao excluir proposta');
    }
  };

  const stats = [
    { label: 'Total Propostas', value: proposals.length.toString(), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Em Aberto', value: proposals.filter(p => p.status === 'Enviado').length.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Concluídas', value: proposals.filter(p => p.status === 'Concluído').length.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Conversão', value: proposals.length > 0 ? `${Math.round((proposals.filter(p => p.status === 'Concluído').length / proposals.length) * 100)}%` : '0%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const handleDownload = async (proposal: any) => {
    if (!proposal.template?.file_url) {
      // Se não houver template, gera e baixa a CAPA e a PÁGINA 6 juntas (modo de testes)
      setDownloadingId(proposal.id);
      setCurrentProposal(proposal.commercial_data);
      setTimeout(async () => {
        try {
          console.log('Nenhum template PDF associado. Baixando Capa + Página 6 em PDF combinado (Modo de Testes).');
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

    // Se houver template, abre o modal de reordenação
    setSelectedProposal(proposal);
    setCurrentProposal(proposal.commercial_data);
    setLoadingPages(true);
    setIsReorderModalOpen(true);

    try {
      const pageCount = await PDFService.getTemplatePageCount(proposal.template.file_url);
      const initialPages: ReorderPage[] = [];
      
      // Cover page (SaaS) replaces template index 0
      initialPages.push({
        id: 'saas-cover',
        type: 'saas-cover',
        label: 'Capa da Proposta (SaaS)',
        index: null
      });

      // Intermediate pages from template (indexes 1 to 4)
      for (let i = 1; i < Math.min(5, pageCount); i++) {
        initialPages.push({
          id: `template-${i}`,
          type: 'template',
          label: `Página ${i + 1} do Modelo`,
          index: i
        });
      }

      // Page 6 (SaaS) replaces template index 5
      initialPages.push({
        id: 'saas-page6',
        type: 'saas-page6',
        label: 'Ficha Técnica e Comercial (SaaS)',
        index: null
      });

      // Remaining template pages from index 6 onwards
      for (let i = 6; i < pageCount; i++) {
        initialPages.push({
          id: `template-${i}`,
          type: 'template',
          label: `Página ${i + 1} do Modelo`,
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

    // Wait for the hidden component to render
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
    
    // Swap
    const temp = newPages[index];
    newPages[index] = newPages[targetIndex];
    newPages[targetIndex] = temp;
    
    setReorderPages(newPages);
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Hidden renderer for PDF capturing */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {currentProposal && (
          <>
            <ProposalCover data={currentProposal} representativeName={profile?.full_name} />
            <ProposalPage6 data={currentProposal} />
          </>
        )}
      </div>

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-20">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-xl font-bold tracking-tight">ProposalPro</span>
          </div>

          <nav className="space-y-1">
            <NavItem icon={LayoutDashboard} label="Dashboard" href="/" active />
            <NavItem icon={FileText} label="Propostas" href="#" />
            <NavItem icon={Users} label="Clientes" href="#" />
            <NavItem icon={Cpu} label="Carregadores" href="/models" />
            <NavItem icon={Settings} label="Templates" href="/templates" />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
              {profile?.full_name?.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">{profile?.full_name}</p>
              <p className="text-xs text-gray-500 truncate">Plano Pro</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-2 py-2 text-gray-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col ml-64 min-h-screen">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-full bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 w-64 text-sm transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button 
              onClick={() => router.push('/proposals/new')}
              className="bg-primary text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm active:scale-95"
            >
              <Plus size={20} />
              Nova Proposta
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                  <stat.icon size={24} />
                </div>
                <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </motion.div>
            ))}
          </div>

          {/* Recent Proposals Table */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold">Propostas Recentes</h2>
              <button className="text-primary text-sm font-bold hover:underline">Ver todas</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Título</th>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {proposals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        Nenhuma proposta encontrada. Clique em "Nova Proposta" para começar.
                      </td>
                    </tr>
                  ) : (
                    proposals.map((prop) => (
                      <tr key={prop.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{prop.client?.name || 'Cliente s/ nome'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{prop.title}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(prop.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={prop.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleView(prop)}
                              disabled={viewingId === prop.id || downloadingId === prop.id}
                              title="Visualizar" 
                              className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all disabled:opacity-30"
                            >
                              {viewingId === prop.id ? <Loader2 className="animate-spin" size={18} /> : <ExternalLink size={18} />}
                            </button>
                            <button 
                              onClick={() => handleDownload(prop)}
                              disabled={downloadingId === prop.id || viewingId === prop.id}
                              title="Baixar" 
                              className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all disabled:opacity-30"
                            >
                              {downloadingId === prop.id ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                            </button>
                            <button 
                              onClick={() => handleDuplicate(prop)}
                              title="Duplicar" 
                              className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                            >
                              <Copy size={18} />
                            </button>
                            <div className="relative">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === prop.id ? null : prop.id);
                                }}
                                title="Mais Opções"
                                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                              >
                                <MoreVertical size={18} />
                              </button>
                              
                              {activeMenuId === prop.id && (
                                <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-100 rounded-xl shadow-lg z-30 py-1 text-left">
                                  <button
                                    onClick={() => {
                                      handleDelete(prop.id);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                  >
                                    Excluir
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
          </motion.div>
        </div>
      </main>

      {/* Reordering Modal */}
      <AnimatePresence>
        {isReorderModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Organizar Páginas do PDF
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Defina a ordem em que as páginas aparecerão no PDF final.
                  </p>
                </div>
                <button 
                  onClick={() => setIsReorderModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700 font-bold text-sm"
                >
                  Fechar
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {loadingPages ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="animate-spin text-primary" size={32} />
                    <span className="text-xs text-gray-500 font-medium">Analisando páginas do modelo...</span>
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
                              ? 'bg-emerald-50/70 border-emerald-200/60 shadow-sm shadow-emerald-100/50' 
                              : 'bg-white border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isSaas ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                              <span className="text-xs font-bold">{index + 1}</span>
                            </div>
                            
                            <div>
                              <span className={`text-sm font-bold block ${isSaas ? 'text-emerald-950' : 'text-gray-800'}`}>
                                {page.label}
                              </span>
                              <div className="mt-1">
                                {isSaas ? (
                                  <span className="bg-emerald-500/20 text-emerald-800 border border-emerald-500/10 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                    Página criada pelo SaaS
                                  </span>
                                ) : (
                                  <span className="bg-gray-100 text-gray-600 border border-gray-200/50 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                    Página do Modelo
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
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 transition-all"
                              title="Mover para cima"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                            </button>
                            <button
                              type="button"
                              disabled={index === reorderPages.length - 1}
                              onClick={() => movePage(index, 'down')}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 transition-all"
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
              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReorderModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={loadingPages}
                  onClick={handleConfirmDownload}
                  className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  Confirmar e Baixar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false, href = "#" }: { icon: any, label: string, active?: boolean, href?: string }) {
  return (
    <a 
      href={href} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
        active 
          ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
      {active && <motion.div layoutId="activeNav" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
    </a>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    'Enviado': 'bg-blue-50 text-blue-700 border-blue-100',
    'Concluído': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'Rascunho': 'bg-gray-100 text-gray-700 border-gray-200',
    'Vencido': 'bg-red-50 text-red-700 border-red-100',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] || styles['Rascunho']}`}>
      {status}
    </span>
  );
}


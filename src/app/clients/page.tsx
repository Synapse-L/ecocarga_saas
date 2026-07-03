// 🧹 REMOVABLE MODULE — delete the /clients folder to remove this feature entirely
// This page uses mock data and interactive states for demonstration.

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Plus, Filter, Users, Building2, Car, Fuel, Hotel, 
  TrendingUp, ArrowLeft, Phone, Mail, MapPin, FileText, 
  Wrench, CheckCircle2, AlertCircle, X, ChevronRight, MessageSquare, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '@/components/AppSidebar';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

// --- DB Mapping Helpers ---
function mapDbClientToClient(dbClient: any, dbProposals: any[] = []): Client {
  const clientProps = dbProposals.filter(p => p.client_id === dbClient.id);
  const totalSpent = clientProps
    .filter(p => p.status === 'Concluído')
    .reduce((sum, p) => sum + (p.commercial_data?.commercial?.price || 0), 0);
    
  const proposals = clientProps.map(p => ({
    id: p.id,
    title: p.title || 'Proposta',
    value: p.commercial_data?.commercial?.price || 0,
    date: new Date(p.created_at).toLocaleDateString('pt-BR'),
    status: (p.status === 'Concluído' ? 'aprovada' : p.status === 'Vencido' ? 'recusada' : 'pendente') as any
  }));

  const installations = clientProps
    .filter(p => p.status === 'Concluído' || p.status === 'Enviado')
    .map((p, idx) => ({
      id: `i-${p.id}`,
      model: p.commercial_data?.commercial?.productName || 'Carregador Eco',
      status: (p.status === 'Concluído' ? 'concluido' : 'instalando') as any,
      date: p.status === 'Concluído' ? new Date(p.updated_at || p.created_at).toLocaleDateString('pt-BR') : 'Previsão: em breve'
    }));

  return {
    id: dbClient.id,
    name: dbClient.name,
    cnpj: dbClient.cnpj || '',
    phone: dbClient.phone || '',
    email: dbClient.email || '',
    address: dbClient.address || '',
    segment: (dbClient.segment || 'condominio') as ClientSegment,
    potential: (dbClient.potential || 'morno') as BusinessPotential,
    createdAt: new Date(dbClient.created_at).toLocaleDateString('pt-BR'),
    totalSpent,
    proposals,
    installations
  };
}

// --- Types ---
type ClientSegment = 'condominio' | 'frota' | 'posto' | 'hotel';
type BusinessPotential = 'frio' | 'morno' | 'quente' | 'altissimo';

interface Proposal {
  id: string;
  title: string;
  value: number;
  date: string;
  status: 'aprovada' | 'pendente' | 'recusada';
}

interface LinkedInstallation {
  id: string;
  model: string;
  status: 'agendado' | 'instalando' | 'concluido';
  date: string;
}

interface Client {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  segment: ClientSegment;
  potential: BusinessPotential;
  proposals: Proposal[];
  installations: LinkedInstallation[];
  createdAt: string;
  totalSpent: number;
}

// --- Mock Data ---
const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c-1',
    name: 'Condomínio Residencial Green Park',
    cnpj: '12.345.678/0001-90',
    phone: '(11) 98765-4321',
    email: 'sindico@greenpark.com.br',
    address: 'Av. das Nações, 1500 - Jardim América, São Paulo - SP',
    segment: 'condominio',
    potential: 'quente',
    createdAt: '12/03/2026',
    totalSpent: 45000,
    proposals: [
      { id: 'p-101', title: 'Instalação 3 Carregadores Wallbox 22kW', value: 35000, date: '15/03/2026', status: 'aprovada' },
      { id: 'p-102', title: 'Contrato de Manutenção Anual Preventiva', value: 10000, date: '20/03/2026', status: 'aprovada' }
    ],
    installations: [
      { id: 'i-201', model: 'EcoCarga Wallbox Pro 22kW', status: 'concluido', date: '25/03/2026' },
      { id: 'i-202', model: 'EcoCarga Wallbox Pro 22kW', status: 'concluido', date: '25/03/2026' },
      { id: 'i-203', model: 'EcoCarga Wallbox Pro 22kW', status: 'concluido', date: '25/03/2026' }
    ]
  },
  {
    id: 'c-2',
    name: 'Logix Frotas & Distribuição',
    cnpj: '98.765.432/0001-10',
    phone: '(11) 91122-3344',
    email: 'manutencao@logixfrotas.com.br',
    address: 'Rua Industrial, 450 - Galpão B - Tamboré, Barueri - SP',
    segment: 'frota',
    potential: 'altissimo',
    createdAt: '01/04/2026',
    totalSpent: 125000,
    proposals: [
      { id: 'p-103', title: 'Infraestrutura + 2 Carregadores Ultra-Rápidos DC 50kW', value: 125000, date: '05/04/2026', status: 'aprovada' },
      { id: 'p-104', title: 'Expansão 4 Vagas Adicionais AC 22kW', value: 68000, date: '10/06/2026', status: 'pendente' }
    ],
    installations: [
      { id: 'i-204', model: 'EcoCarga DC Fast 50kW', status: 'instalando', date: 'Previsão: 02/07/2026' },
      { id: 'i-205', model: 'EcoCarga DC Fast 50kW', status: 'instalando', date: 'Previsão: 02/07/2026' }
    ]
  },
  {
    id: 'c-3',
    name: 'Posto Sol Nascente - Rede Ipiranga',
    cnpj: '45.678.123/0002-40',
    phone: '(19) 97766-5544',
    email: 'gerencia@postosolnascente.com.br',
    address: 'Rodovia Anhanguera, KM 118 - Campinas - SP',
    segment: 'posto',
    potential: 'quente',
    createdAt: '22/04/2026',
    totalSpent: 0,
    proposals: [
      { id: 'p-105', title: 'Carregador Ultra-Rápido Highway 150kW Dual', value: 198000, date: '25/04/2026', status: 'pendente' }
    ],
    installations: []
  },
  {
    id: 'c-4',
    name: 'Grand Hyatt Hotel & Spa',
    cnpj: '33.222.111/0001-55',
    phone: '(11) 95544-3322',
    email: 'facilities@grandhyatt.com.br',
    address: 'Av. das Nações Unidas, 13301 - Itaim Bibi, São Paulo - SP',
    segment: 'hotel',
    potential: 'morno',
    createdAt: '10/05/2026',
    totalSpent: 32000,
    proposals: [
      { id: 'p-106', title: 'Instalação 2 Carregadores Wallbox Business 22kW', value: 32000, date: '12/05/2026', status: 'aprovada' }
    ],
    installations: [
      { id: 'i-206', model: 'EcoCarga Wallbox Business 22kW', status: 'concluido', date: '18/05/2026' },
      { id: 'i-207', model: 'EcoCarga Wallbox Business 22kW', status: 'concluido', date: '18/05/2026' }
    ]
  },
  {
    id: 'c-5',
    name: 'Condomínio Residencial Bella Vista',
    cnpj: '22.333.444/0001-22',
    phone: '(21) 96655-4433',
    email: 'administracao@bellavista.com.br',
    address: 'Av. das Américas, 4200 - Barra da Tijuca, Rio de Janeiro - RJ',
    segment: 'condominio',
    potential: 'frio',
    createdAt: '01/06/2026',
    totalSpent: 0,
    proposals: [
      { id: 'p-107', title: 'Instalação Carregador de Teste 7.4kW', value: 8500, date: '03/06/2026', status: 'recusada' }
    ],
    installations: []
  }
];

const SEGMENT_CONFIG: Record<ClientSegment, { label: string; icon: any; color: string; bg: string }> = {
  condominio: { label: 'Condomínio', icon: Building2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40' },
  frota:      { label: 'Frota',      icon: Car,       color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40' },
  posto:      { label: 'Posto',      icon: Fuel,      color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40' },
  hotel:      { label: 'Hotel',      icon: Hotel,     color: 'text-indigo-600 dark:text-indigo-400',   bg: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/40' },
};

const POTENTIAL_CONFIG: Record<BusinessPotential, { label: string; bg: string; text: string; dot: string }> = {
  frio:      { label: 'Frio', bg: 'bg-gray-100 dark:bg-gray-850', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' },
  morno:     { label: 'Morno', bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-600 dark:text-sky-400', dot: 'bg-sky-500' },
  quente:    { label: 'Quente', bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' },
  altissimo: { label: 'Altíssimo', bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' },
};

export default function ClientsPage() {
  const { t } = useApp();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<ClientSegment | 'all'>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientCNPJ, setNewClientCNPJ] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientSegment, setNewClientSegment] = useState<ClientSegment>('condominio');
  const [newClientPotential, setNewClientPotential] = useState<BusinessPotential>('morno');

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_lead', false)
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      const { data: proposalsData, error: proposalsError } = await supabase
        .from('proposals')
        .select('*')
        .eq('user_id', user.id);

      if (proposalsError) throw proposalsError;

      if (!clientsData || clientsData.length === 0) {
        // Seed initial clients
        const seededClients = INITIAL_CLIENTS.map(c => ({
          user_id: user.id,
          name: c.name,
          cnpj: c.cnpj,
          phone: c.phone,
          email: c.email,
          address: c.address,
          segment: c.segment,
          potential: c.potential,
          is_lead: false
        }));

        const { data: inserted, error: insertError } = await supabase
          .from('clients')
          .insert(seededClients)
          .select();

        if (insertError) throw insertError;
        
        setClients(inserted.map(dbC => {
          const mockC = INITIAL_CLIENTS.find(c => c.name === dbC.name);
          if (mockC) {
            const mapped = mapDbClientToClient(dbC, proposalsData || []);
            return {
              ...mapped,
              proposals: mapped.proposals.length > 0 ? mapped.proposals : mockC.proposals,
              installations: mapped.installations.length > 0 ? mapped.installations : mockC.installations,
              totalSpent: mapped.proposals.length > 0 ? mapped.totalSpent : mockC.totalSpent
            };
          }
          return mapDbClientToClient(dbC, proposalsData || []);
        }));
      } else {
        setClients(clientsData.map(dbC => {
          const mockC = INITIAL_CLIENTS.find(c => c.name === dbC.name);
          const mapped = mapDbClientToClient(dbC, proposalsData || []);
          if (mockC && mapped.proposals.length === 0) {
            return {
              ...mapped,
              proposals: mockC.proposals,
              installations: mockC.installations,
              totalSpent: mockC.totalSpent
            };
          }
          return mapped;
        }));
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.cnpj.includes(searchQuery) ||
                          c.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSegment = selectedSegment === 'all' || c.segment === selectedSegment;
    return matchesSearch && matchesSegment;
  });

  const getSegmentCount = (seg: ClientSegment) => clients.filter(c => c.segment === seg).length;

  const handleUpdatePotential = async (clientId: string, potential: BusinessPotential) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ potential })
        .eq('id', clientId);

      if (error) throw error;

      setClients(prev => prev.map(c => c.id === clientId ? { ...c, potential } : c));
      if (selectedClient && selectedClient.id === clientId) {
        setSelectedClient({ ...selectedClient, potential });
      }
    } catch (err: any) {
      alert('Erro ao atualizar potencial: ' + err.message);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const rawClient = {
        user_id: user.id,
        name: newClientName,
        cnpj: newClientCNPJ || '00.000.000/0001-00',
        phone: newClientPhone || '(11) 99999-9999',
        email: newClientEmail || 'contato@empresa.com.br',
        address: newClientAddress || 'Endereço Comercial',
        segment: newClientSegment,
        potential: newClientPotential,
        is_lead: false
      };

      const { data, error } = await supabase
        .from('clients')
        .insert(rawClient)
        .select()
        .single();

      if (error) throw error;

      const newClientObj = mapDbClientToClient(data, []);
      setClients(prev => [newClientObj, ...prev]);
      setIsAddModalOpen(false);
      
      // Clear fields
      setNewClientName('');
      setNewClientCNPJ('');
      setNewClientPhone('');
      setNewClientEmail('');
      setNewClientAddress('');
      setNewClientSegment('condominio');
      setNewClientPotential('morno');
    } catch (err: any) {
      alert('Erro ao cadastrar cliente: ' + err.message);
    }
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
            <Users className="text-[#004D31] dark:text-[#B2D235]" size={20} />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">CRM & Gestão de Clientes</h1>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#004D31] dark:bg-[#B2D235] hover:opacity-90 text-white dark:text-[#004D31] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <Plus size={16} />
            Cadastrar Cliente
          </button>
        </header>

        {/* Content Area */}
        <div className="p-8 space-y-6">
          
          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Total de Clientes</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-gray-900 dark:text-white">{clients.length}</span>
                <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">+2 este mês</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Receita Consolidada</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-[#004D31] dark:text-[#B2D235]">R$ 202.000</span>
                <span className="text-xs font-semibold text-gray-400 ml-1">faturado</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Propostas em Aberto</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-amber-550">2 propostas</span>
                <span className="text-xs font-medium text-gray-400">R$ 266k total</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Estações Instaladas</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-blue-500">5 carregadores</span>
                <span className="text-xs text-gray-400 font-medium ml-1">ativos</span>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text"
                  placeholder="Buscar clientes por nome, CNPJ, e-mail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all text-gray-905 dark:text-white"
                />
              </div>
              
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                <button
                  onClick={() => setSelectedSegment('all')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedSegment === 'all' 
                      ? 'bg-[#004D31] dark:bg-[#B2D235] border-[#004D31] dark:border-[#B2D235] text-white dark:text-[#004D31] shadow-sm' 
                      : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 text-gray-600 dark:text-gray-450 hover:border-gray-200 dark:hover:border-slate-700'
                  }`}
                >
                  Todos ({clients.length})
                </button>

                {(Object.keys(SEGMENT_CONFIG) as ClientSegment[]).map(seg => {
                  const cfg = SEGMENT_CONFIG[seg];
                  const Icon = cfg.icon;
                  const active = selectedSegment === seg;
                  return (
                    <button
                      key={seg}
                      onClick={() => setSelectedSegment(seg)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                        active
                          ? 'bg-[#004D31] dark:bg-[#B2D235] border-[#004D31] dark:border-[#B2D235] text-white dark:text-[#004D31] shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 text-gray-600 dark:text-gray-450 hover:border-gray-200 dark:hover:border-slate-700'
                      }`}
                    >
                      <Icon size={14} className={active ? 'text-white dark:text-[#004D31]' : cfg.color} />
                      {cfg.label} ({getSegmentCount(seg)})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Clients Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
                <Loader2 className="animate-spin mx-auto text-[#004D31] dark:text-[#B2D235] mb-3" size={36} />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Carregando clientes do banco...</h3>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredClients.map((client, index) => {
                  const segCfg = SEGMENT_CONFIG[client.segment];
                  const SegIcon = segCfg.icon;
                  const potCfg = POTENTIAL_CONFIG[client.potential];
                  
                  return (
                    <motion.div
                      layout
                      key={client.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => setSelectedClient(client)}
                      className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between h-56"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${segCfg.color} ${segCfg.bg}`}>
                            <SegIcon size={10} />
                            {segCfg.label}
                          </span>
                          
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${potCfg.bg} ${potCfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${potCfg.dot}`} />
                            {potCfg.label}
                          </span>
                        </div>

                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-[#004D31] dark:group-hover:text-[#B2D235] transition-colors line-clamp-1">
                          {client.name}
                        </h3>
                        
                        <div className="space-y-1.5 text-xs text-gray-400 dark:text-gray-500 font-medium">
                          <p className="flex items-center gap-1.5">
                            <Mail size={13} />
                            <span className="truncate">{client.email}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Phone size={13} />
                            <span>{client.phone}</span>
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-55/50 dark:border-slate-850/50 flex items-center justify-between mt-auto">
                        <div className="text-xs">
                          <p className="text-gray-400">Total Faturado</p>
                          <p className="font-extrabold text-gray-900 dark:text-white mt-0.5">
                            R$ {client.totalSpent.toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-[#004D31] dark:text-[#B2D235] group-hover:translate-x-1 transition-transform">
                          Ficha Completa
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}

            {!loading && filteredClients.length === 0 && (
              <div className="col-span-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
                <Users className="mx-auto text-gray-300 dark:text-slate-700 mb-3" size={48} />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nenhum cliente encontrado</h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-md mx-auto">
                  Refine sua busca por nome ou altere o filtro de segmento de mercado.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* --- SLIDING CLIENT DRAWER --- */}
      <AnimatePresence>
        {selectedClient && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClient(null)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white dark:bg-slate-950 shadow-2xl border-l border-gray-100 dark:border-slate-800 z-50 overflow-y-auto flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-gray-50 dark:border-slate-850 sticky top-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedClient(null)}
                    className="p-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-400 cursor-pointer"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <span className="text-xs font-bold text-gray-400 uppercase">Ficha Cadastral do Cliente</span>
                </div>
                <button 
                  onClick={() => setSelectedClient(null)}
                  className="p-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-400 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-8 space-y-8 flex-1">
                
                {/* Profile Banner */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div 
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                        SEGMENT_CONFIG[selectedClient.segment].bg
                      }`}
                    >
                      {React.createElement(SEGMENT_CONFIG[selectedClient.segment].icon, {
                        size: 26,
                        className: SEGMENT_CONFIG[selectedClient.segment].color
                      })}
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                        {selectedClient.name}
                      </h2>
                      <p className="text-xs text-gray-400 font-medium">CNPJ: {selectedClient.cnpj}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                      SEGMENT_CONFIG[selectedClient.segment].color
                    } ${SEGMENT_CONFIG[selectedClient.segment].bg}`}>
                      {SEGMENT_CONFIG[selectedClient.segment].label}
                    </span>
                    
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-900 px-2.5 py-0.5 rounded-full border border-gray-100 dark:border-slate-800">
                      Desde {selectedClient.createdAt}
                    </span>
                  </div>
                </div>

                {/* Potencial de Negócio Seletor */}
                <div className="bg-gray-50 dark:bg-slate-900/40 border border-gray-100 dark:border-slate-900 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-400">
                      <TrendingUp size={15} className="text-[#004D31] dark:text-[#B2D235]" />
                      Potencial Futuro de Negócio
                    </div>
                    <span className="text-[10px] font-extrabold text-[#004D31] dark:text-[#B2D235] uppercase">Interativo</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(POTENTIAL_CONFIG) as BusinessPotential[]).map(pot => {
                      const cfg = POTENTIAL_CONFIG[pot];
                      const active = selectedClient.potential === pot;
                      return (
                        <button
                          key={pot}
                          type="button"
                          onClick={() => handleUpdatePotential(selectedClient.id, pot)}
                          className={`py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                            active
                              ? 'bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-850 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5'
                              : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1.5 ${cfg.dot}`} />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Contact and Address Details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Dados de Contato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="p-4 rounded-2xl border border-gray-100 dark:border-slate-900 space-y-1 bg-slate-50/20 dark:bg-slate-900/10">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">WhatsApp / Telefone</span>
                      <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                        <Phone size={14} className="text-emerald-500" />
                        {selectedClient.phone}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border border-gray-100 dark:border-slate-900 space-y-1 bg-slate-50/20 dark:bg-slate-900/10">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">E-mail Comercial</span>
                      <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                        <Mail size={14} className="text-[#004D31] dark:text-[#B2D235]" />
                        {selectedClient.email}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border border-gray-100 dark:border-slate-900 col-span-full space-y-1 bg-slate-50/20 dark:bg-slate-900/10">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Endereço Técnico da Planta</span>
                      <p className="font-bold text-gray-900 dark:text-white flex items-start gap-1.5 leading-snug text-xs mt-0.5">
                        <MapPin size={14} className="text-rose-550 flex-shrink-0 mt-0.5" />
                        {selectedClient.address}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Linked Proposals */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Propostas Comerciais</h3>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                      R$ {selectedClient.totalSpent.toLocaleString('pt-BR')} investidos
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedClient.proposals.map(prop => (
                      <div 
                        key={prop.id}
                        className="p-4 rounded-2xl border border-gray-100 dark:border-slate-905 flex items-center justify-between gap-4 bg-white dark:bg-slate-900/20"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-extrabold text-gray-900 dark:text-white line-clamp-1">{prop.title}</p>
                          <p className="text-[10px] text-gray-400 font-medium">Emitido em {prop.date} · Código: {prop.id}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs font-black text-gray-900 dark:text-white">R$ {prop.value.toLocaleString('pt-BR')}</p>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                              prop.status === 'aprovada' 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' 
                                : prop.status === 'pendente'
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                            }`}>
                              {prop.status}
                            </span>
                          </div>
                          <FileText size={16} className="text-gray-300 dark:text-slate-700" />
                        </div>
                      </div>
                    ))}

                    {selectedClient.proposals.length === 0 && (
                      <div className="text-center p-6 border border-dashed border-gray-100 dark:border-slate-850 rounded-2xl text-gray-400 text-xs">
                        Nenhuma proposta emitida para este cliente.
                      </div>
                    )}
                  </div>
                </div>

                {/* Linked Installations */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Instalações Vinculadas</h3>
                  
                  <div className="space-y-3">
                    {selectedClient.installations.map(inst => (
                      <div 
                        key={inst.id}
                        className="p-4 rounded-2xl border border-gray-100 dark:border-slate-900 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <Wrench size={16} className="text-[#004D31] dark:text-[#B2D235]" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{inst.model}</p>
                            <p className="text-[10px] text-gray-400">{inst.date}</p>
                          </div>
                        </div>

                        <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          inst.status === 'concluido'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${inst.status === 'concluido' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                          {inst.status}
                        </span>
                      </div>
                    ))}

                    {selectedClient.installations.length === 0 && (
                      <div className="text-center p-6 border border-dashed border-gray-100 dark:border-slate-850 rounded-2xl text-gray-400 text-xs">
                        Nenhum carregador instalado ou planejado.
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Interactive Tooltip */}
                <div className="flex gap-2 pt-4">
                  <a 
                    href={`https://wa.me/${selectedClient.phone.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl text-xs font-bold transition-all hover:bg-emerald-700 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={15} />
                    Contatar WhatsApp
                  </a>
                  <button 
                    onClick={() => alert(`Iniciando proposta mock para ${selectedClient.name}`)}
                    className="flex-1 bg-[#004D31] dark:bg-[#B2D235] text-white dark:text-[#004D31] py-3 rounded-2xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer"
                  >
                    Nova Proposta
                  </button>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- ADD CLIENT MODAL --- */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-black"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-950 rounded-3xl border border-gray-150 dark:border-slate-850 shadow-2xl max-w-lg w-full overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-50 dark:border-slate-850/50 flex justify-between items-center bg-white/50 dark:bg-slate-950/50 backdrop-blur-md sticky top-0">
                <h3 className="text-base font-black text-gray-900 dark:text-white">Cadastrar Novo Cliente</h3>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg text-gray-400 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddClient} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-gray-400 uppercase">Razão Social ou Nome do Cliente *</label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Ex: Condomínio Edifício Copan"
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/10 focus:bg-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase">CNPJ / CPF</label>
                    <input
                      type="text"
                      value={newClientCNPJ}
                      onChange={(e) => setNewClientCNPJ(e.target.value)}
                      placeholder="12.345.678/0001-90"
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-400 uppercase">E-mail Comercial</label>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="exemplo@dominio.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-400 uppercase">Endereço da Planta Técnica</label>
                  <input
                    type="text"
                    value={newClientAddress}
                    onChange={(e) => setNewClientAddress(e.target.value)}
                    placeholder="Rua, Número, Bairro, Cidade - UF"
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase">Segmento de Negócio</label>
                    <select
                      value={newClientSegment}
                      onChange={(e) => setNewClientSegment(e.target.value as ClientSegment)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-150 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2"
                    >
                      <option value="condominio">🏢 Condomínio</option>
                      <option value="frota">🚚 Frota</option>
                      <option value="posto">⛽ Posto de Gasolina</option>
                      <option value="hotel">🏨 Hotel</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase">Potencial do Lead</label>
                    <select
                      value={newClientPotential}
                      onChange={(e) => setNewClientPotential(e.target.value as BusinessPotential)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-150 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2"
                    >
                      <option value="frio">❄️ Frio</option>
                      <option value="morno">🌤️ Morno</option>
                      <option value="quente">🔥 Quente</option>
                      <option value="altissimo">⚡ Altíssimo</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-55/50 dark:border-slate-850/55 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-6 py-3 rounded-xl font-bold text-gray-450 hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-[#004D31] dark:bg-[#B2D235] text-white dark:text-[#004D31] px-6 py-3 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
                  >
                    Salvar Cliente
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

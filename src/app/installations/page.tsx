// 🧹 REMOVABLE MODULE — delete the /installations folder to remove this feature entirely
// This page uses interactive client-side states, checklist managers, and photo mockups.

"use client";

import React, { useState } from 'react';
import { 
  Wrench, CheckSquare, Image as ImageIcon, Shield, MessageSquare, 
  Plus, Search, Calendar, ChevronRight, ArrowRight, X, Check, 
  Camera, AlertTriangle, Clock, Play, HelpCircle, BadgeAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '@/components/AppSidebar';
import { useApp } from '@/context/AppContext';

// --- Types ---
type ProjectStatus = 'assinado' | 'agendado' | 'instalando' | 'concluido';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface SupportTicket {
  id: string;
  title: string;
  date: string;
  status: 'aberto' | 'resolvido';
}

interface Project {
  id: string;
  clientName: string;
  chargerModel: string;
  quantity: number;
  status: ProjectStatus;
  scheduledDate?: string;
  warrantyYears?: number;
  warrantyExpiry?: string;
  checklist: ChecklistItem[];
  photos: string[];
  tickets: SupportTicket[];
}

// --- Mock Data ---
const INITIAL_PROJECTS: Project[] = [
  {
    id: 'pr-501',
    clientName: 'Condomínio Residencial Green Park',
    chargerModel: 'EcoCarga Wallbox Pro 22kW',
    quantity: 3,
    status: 'concluido',
    scheduledDate: '25/03/2026',
    warrantyYears: 3,
    warrantyExpiry: '25/03/2029',
    checklist: [
      { id: 'ch-1', label: 'Verificação de padrão de energia da entrada principal', checked: true },
      { id: 'ch-2', label: 'Passagem de cabeamento blindado 10mm²', checked: true },
      { id: 'ch-3', label: 'Instalação de disjuntor DR individual por carregador', checked: true },
      { id: 'ch-4', label: 'Fixação física dos 3 carregadores nas vagas', checked: true },
      { id: 'ch-5', label: 'Teste de carga dinâmico e ativação OCPP', checked: true }
    ],
    photos: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&q=80', // EV Charging station photo
      'https://images.unsplash.com/photo-1558441719-ff34b0524a24?w=400&q=80'  // Electric panel photo
    ],
    tickets: [
      { id: 't-901', title: 'Ajustar limite de corrente no OCPP', date: '28/03/2026', status: 'resolvido' }
    ]
  },
  {
    id: 'pr-502',
    clientName: 'Logix Frotas & Distribuição',
    chargerModel: 'EcoCarga DC Fast 50kW',
    quantity: 2,
    status: 'instalando',
    scheduledDate: '02/07/2026',
    checklist: [
      { id: 'ch-1', label: 'Estudo de carga da cabine primária', checked: true },
      { id: 'ch-2', label: 'Lançamento de eletroduto pesado subterrâneo', checked: true },
      { id: 'ch-3', label: 'Construção da base de concreto do carregador DC', checked: true },
      { id: 'ch-4', label: 'Conexão física do barramento elétrico', checked: false },
      { id: 'ch-5', label: 'Comissionamento e testes com veículo da frota', checked: false }
    ],
    photos: [
      'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=400&q=80' // Cabling and trenching works
    ],
    tickets: []
  },
  {
    id: 'pr-503',
    clientName: 'Grand Hyatt Hotel & Spa',
    chargerModel: 'EcoCarga Wallbox Business 22kW',
    quantity: 2,
    status: 'concluido',
    scheduledDate: '18/05/2026',
    warrantyYears: 2,
    warrantyExpiry: '18/05/2028',
    checklist: [
      { id: 'ch-1', label: 'Avaliação de quadro elétrico do estacionamento', checked: true },
      { id: 'ch-2', label: 'Lançamento de tubulação de ferro galvanizado', checked: true },
      { id: 'ch-3', label: 'Instalação física e conexão elétrica', checked: true },
      { id: 'ch-4', label: 'Configuração da comunicação via Wi-Fi do Hotel', checked: true }
    ],
    photos: [],
    tickets: []
  },
  {
    id: 'pr-504',
    clientName: 'Posto Sol Nascente - Campinas',
    chargerModel: 'EcoCarga DC Ultra Highway 150kW',
    quantity: 1,
    status: 'agendado',
    scheduledDate: '12/07/2026',
    checklist: [
      { id: 'ch-1', label: 'Análise de viabilidade pela concessionária CPFL', checked: false },
      { id: 'ch-2', label: 'Projeto civil de fundação do carregador de rodovia', checked: false },
      { id: 'ch-3', label: 'Instalação de subestação dedicada', checked: false }
    ],
    photos: [],
    tickets: []
  },
  {
    id: 'pr-505',
    clientName: 'Shopping Metrô Boulevard',
    chargerModel: 'EcoCarga Wallbox Business 22kW',
    quantity: 10,
    status: 'assinado',
    checklist: [
      { id: 'ch-1', label: 'Elaboração de laudo de demanda do Shopping', checked: false },
      { id: 'ch-2', label: 'Desenho unifilar do quadro de carregamento', checked: false },
      { id: 'ch-3', label: 'Compra e separação de materiais', checked: false }
    ],
    photos: [],
    tickets: []
  }
];

const STAGE_CONFIG: Record<ProjectStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  assinado:   { label: 'Contrato Assinado', bg: 'bg-emerald-50/50 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/30', dot: 'bg-emerald-500' },
  agendado:   { label: 'Visita Técnica / Agendado', bg: 'bg-blue-50/50 dark:bg-blue-950/20',     text: 'text-blue-700 dark:text-blue-400',     border: 'border-blue-200 dark:border-blue-800/30',         dot: 'bg-blue-500' },
  instalando: { label: 'Em Instalação',     bg: 'bg-amber-50/50 dark:bg-amber-950/20',    text: 'text-amber-700 dark:text-amber-400',   border: 'border-amber-200 dark:border-amber-800/30',     dot: 'bg-amber-500' },
  concluido:  { label: 'Concluído & Ativo', bg: 'bg-gray-100 dark:bg-gray-850',           text: 'text-gray-700 dark:text-gray-400',     border: 'border-gray-250 dark:border-gray-800/30',        dot: 'bg-gray-450' }
};

export default function InstallationsPage() {
  const { t } = useApp();
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive Support Ticket Forms
  const [ticketTitle, setTicketTitle] = useState('');
  
  // Photos upload simulator State
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const filteredProjects = projects.filter(p => 
    p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.chargerModel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Column arrays
  const getProjectsByStatus = (status: ProjectStatus) => filteredProjects.filter(p => p.status === status);

  // Status mover logic
  const handleMoveProject = (projectId: string, newStatus: ProjectStatus) => {
    const updated = projects.map(p => {
      if (p.id === projectId) {
        // Automatically assign some default dates when moving
        const scheduledDate = newStatus === 'agendado' ? '15/07/2026' : p.scheduledDate;
        const warrantyExpiry = newStatus === 'concluido' ? '26/06/2028' : p.warrantyExpiry;
        const warrantyYears = newStatus === 'concluido' ? 2 : p.warrantyYears;
        return { ...p, status: newStatus, scheduledDate, warrantyExpiry, warrantyYears };
      }
      return p;
    });
    setProjects(updated);
    if (selectedProject && selectedProject.id === projectId) {
      setSelectedProject(updated.find(u => u.id === projectId) || null);
    }
  };

  // Toggle checklist item
  const handleToggleChecklistItem = (projectId: string, itemId: string) => {
    const updated = projects.map(p => {
      if (p.id === projectId) {
        const checklist = p.checklist.map(c => c.id === itemId ? { ...c, checked: !c.checked } : c);
        return { ...p, checklist };
      }
      return p;
    });
    setProjects(updated);
    if (selectedProject && selectedProject.id === projectId) {
      setSelectedProject(updated.find(u => u.id === projectId) || null);
    }
  };

  // Add Support Ticket Simulator
  const handleAddTicket = (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    if (!ticketTitle.trim()) return;

    const newTicket: SupportTicket = {
      id: `t-${Date.now()}`,
      title: ticketTitle,
      date: new Date().toLocaleDateString('pt-BR'),
      status: 'aberto'
    };

    const updated = projects.map(p => {
      if (p.id === projectId) {
        return { ...p, tickets: [newTicket, ...p.tickets] };
      }
      return p;
    });
    setProjects(updated);
    setSelectedProject(updated.find(u => u.id === projectId) || null);
    setTicketTitle('');
  };

  // Photo Uploader Simulation
  const handleSimulatePhotoUpload = (projectId: string) => {
    setUploadingPhoto(true);
    setTimeout(() => {
      const updated = projects.map(p => {
        if (p.id === projectId) {
          const newPhotos = [
            ...p.photos,
            'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=400&q=80' // Mock installation detail photo
          ];
          return { ...p, photos: newPhotos };
        }
        return p;
      });
      setProjects(updated);
      setSelectedProject(updated.find(u => u.id === projectId) || null);
      setUploadingPhoto(false);
    }, 1200); // 1.2s upload simulation
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
            <Wrench className="text-[#004D31] dark:text-[#B2D235]" size={20} />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Instalações & Pós-Venda</h1>
          </div>

          {/* Search bar */}
          <div className="relative w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Buscar instalações por cliente ou modelo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-primary/10 focus:bg-white text-gray-900 dark:text-white"
            />
          </div>
        </header>

        {/* Kanban Board Container */}
        <div className="p-8 flex-1 overflow-x-auto">
          
          {/* Columns Grid */}
          <div className="flex gap-6 min-h-[calc(100vh-12rem)] min-w-[1000px]">
            
            {/* Columns loop */}
            {(Object.keys(STAGE_CONFIG) as ProjectStatus[]).map(status => {
              const cfg = STAGE_CONFIG[status];
              const columnProjects = getProjectsByStatus(status);
              
              return (
                <div 
                  key={status} 
                  className="flex-1 bg-gray-50/50 dark:bg-slate-900/10 border border-gray-100 dark:border-slate-850 p-4 rounded-3xl flex flex-col space-y-4 w-72"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100/50 dark:border-slate-800/40">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                      <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">{cfg.label}</span>
                    </div>
                    <span className="text-[10px] font-black text-gray-400 bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-850 px-2 py-0.5 rounded-full">
                      {columnProjects.length}
                    </span>
                  </div>

                  {/* Column Cards Container */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-17rem)] pr-1">
                    {columnProjects.map(project => {
                      const completedCount = project.checklist.filter(c => c.checked).length;
                      const totalCount = project.checklist.length;
                      const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                      
                      return (
                        <motion.div
                          layoutId={`proj-card-${project.id}`}
                          key={project.id}
                          onClick={() => setSelectedProject(project)}
                          className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-slate-700 transition-all cursor-pointer space-y-3 group"
                        >
                          <div className="space-y-1">
                            <h3 className="text-xs font-black text-gray-900 dark:text-white leading-snug line-clamp-2">
                              {project.clientName}
                            </h3>
                            <p className="text-[10px] text-gray-400 font-medium">{project.chargerModel}</p>
                          </div>

                          {/* Progress indicator */}
                          <div className="space-y-1 text-[9px] font-bold text-gray-400">
                            <div className="flex justify-between">
                              <span>Checklist Técnico</span>
                              <span className="text-primary dark:text-accent font-extrabold">
                                {completedCount}/{totalCount} ({progressPercent}%)
                              </span>
                            </div>
                            <div className="w-full h-1 bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary dark:bg-accent transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>

                          {/* Bottom Row Tags */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-slate-850/30 mt-1">
                            {project.scheduledDate ? (
                              <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                                <Calendar size={10} />
                                {project.scheduledDate}
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-gray-400">A agendar</span>
                            )}
                            
                            {project.tickets.length > 0 && (
                              <span className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <AlertTriangle size={8} />
                                {project.tickets.filter(t => t.status === 'aberto').length} Ticket
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}

                    {columnProjects.length === 0 && (
                      <div className="h-28 border border-dashed border-gray-200/50 dark:border-slate-850/50 rounded-2xl flex items-center justify-center text-center p-6 text-[10px] text-gray-400">
                        Nenhuma instalação nesta etapa.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      </main>

      {/* --- INSTALLATION DETAILED MODAL --- */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="fixed inset-0 bg-black"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-950 rounded-3xl border border-gray-150 dark:border-slate-850 shadow-2xl max-w-3xl w-full z-10 flex flex-col max-h-[90vh] overflow-hidden text-xs"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-50 dark:border-slate-850/50 flex justify-between items-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-md sticky top-0 z-10">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Detalhamento Técnico de Instalação</span>
                  <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">
                    {selectedProject.clientName}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="p-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg text-gray-400 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* Status bar & transitions */}
                <div className="bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-850 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-400 uppercase">Estágio Atual de Instalação</span>
                    <span className="text-[10px] font-extrabold text-[#004D31] dark:text-[#B2D235] uppercase">Movimentação Rápida</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(STAGE_CONFIG) as ProjectStatus[]).map(status => {
                      const cfg = STAGE_CONFIG[status];
                      const active = selectedProject.status === status;
                      return (
                        <button
                          key={status}
                          onClick={() => handleMoveProject(selectedProject.id, status)}
                          className={`py-2 px-1 rounded-xl text-[10px] font-black border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                            active
                              ? 'bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-750 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5'
                              : 'bg-transparent border-transparent text-gray-450 hover:text-gray-600'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Grid checklist & photos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: Visit Checklist */}
                  <div className="space-y-4">
                    <h4 className="font-black text-gray-900 dark:text-white border-b border-gray-55 dark:border-slate-850 pb-1 uppercase tracking-wider">
                      Checklist Técnico de Conformidade
                    </h4>
                    
                    <div className="space-y-2.5">
                      {selectedProject.checklist.map(item => (
                        <label 
                          key={item.id}
                          className="flex items-start gap-3 p-3 bg-slate-50/50 dark:bg-slate-900/20 border border-gray-50 dark:border-slate-900 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => handleToggleChecklistItem(selectedProject.id, item.id)}
                            className="mt-0.5 rounded border-gray-300 dark:border-slate-800 text-[#004D31] dark:text-[#B2D235] focus:ring-primary/10"
                          />
                          <span className={`text-xs font-medium leading-normal ${item.checked ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-slate-200'}`}>
                            {item.label}
                          </span>
                        </label>
                      ))}

                      {selectedProject.checklist.length === 0 && (
                        <p className="text-gray-400 text-center py-4">Nenhum checklist configurado.</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Physical Photos */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-55 dark:border-slate-850 pb-1">
                      <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Fotos de Inspeção do Local
                      </h4>
                      <button 
                        type="button"
                        disabled={uploadingPhoto}
                        onClick={() => handleSimulatePhotoUpload(selectedProject.id)}
                        className="text-[10px] font-bold text-[#004D31] dark:text-[#B2D235] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-55"
                      >
                        {uploadingPhoto ? 'Enviando...' : <><Camera size={12} /> Adicionar Foto</>}
                      </button>
                    </div>

                    {/* Photos grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {selectedProject.photos.map((url, index) => (
                        <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-gray-100 dark:border-slate-850 group">
                          <img src={url} alt={`Inspeção ${index}`} className="object-cover w-full h-full" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-[10px] text-white font-bold">Ver Ampliada</span>
                          </div>
                        </div>
                      ))}

                      {uploadingPhoto && (
                        <div className="aspect-video rounded-xl border border-dashed border-gray-200/60 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 flex flex-col items-center justify-center gap-2 text-center text-[10px] text-gray-400">
                          <Clock className="animate-spin text-primary" size={18} />
                          Enviando imagem...
                        </div>
                      )}

                      {selectedProject.photos.length === 0 && !uploadingPhoto && (
                        <div className="col-span-full h-32 border border-dashed border-gray-150 dark:border-slate-850 rounded-2xl flex flex-col items-center justify-center text-center p-6 text-gray-400 gap-1.5 bg-slate-50/10">
                          <ImageIcon size={22} className="text-gray-300 dark:text-slate-700" />
                          <span>Nenhuma foto anexada ao projeto técnico.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lower Row: Warranty tracker, NPS automatic warnings & Support tickets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-55 dark:border-slate-850/50">
                  
                  {/* Warranty & NPS Schedule */}
                  <div className="space-y-4">
                    <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      Garantia & Pós-Venda (D+30)
                    </h4>
                    
                    <div className="space-y-3 bg-slate-50/30 dark:bg-slate-900/10 border border-gray-50 dark:border-slate-900 rounded-2xl p-4">
                      {selectedProject.status === 'concluido' ? (
                        <>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 font-medium">Garantia Técnica Ativa</span>
                            <span className="font-extrabold text-emerald-500 flex items-center gap-1">
                              <Shield size={14} />
                              {selectedProject.warrantyYears} Anos
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-100/50 dark:border-slate-850/30">
                            <span className="text-gray-400 font-medium">Data de Vencimento</span>
                            <span className="font-bold text-gray-900 dark:text-white">{selectedProject.warrantyExpiry}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock size={16} className="text-amber-55" />
                          <span>Garantia será registrada automaticamente ao marcar a instalação como Concluída.</span>
                        </div>
                      )}

                      {/* NPS scheduler alert */}
                      <div className="p-3 rounded-xl bg-primary/5 dark:bg-accent/5 border border-primary/10 dark:border-accent/10 flex items-start gap-2.5 mt-2">
                        <MessageSquare size={16} className="text-primary dark:text-accent mt-0.5 flex-shrink-0" />
                        <div className="space-y-0.5">
                          <span className="font-bold text-primary dark:text-accent block">NPS Automático via WhatsApp</span>
                          <span className="text-[10px] text-gray-500 leading-normal block">
                            Pesquisa de qualidade configurada para disparar automaticamente 30 dias após a conclusão do comissionamento técnico.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Support tickets tracker */}
                  <div className="space-y-4">
                    <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      Histórico de Chamados Técnicos
                    </h4>

                    {/* Add ticket mini form */}
                    <form onSubmit={(e) => handleAddTicket(e, selectedProject.id)} className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="Novo problema? Ex: Sinal Wi-Fi fraco"
                        value={ticketTitle}
                        onChange={(e) => setTicketTitle(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-100 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-primary/15"
                      />
                      <button 
                        type="submit"
                        disabled={!ticketTitle.trim()}
                        className="bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-750 text-white px-4 py-2 rounded-xl font-bold transition-all active:scale-[0.97] cursor-pointer disabled:opacity-50"
                      >
                        Abrir
                      </button>
                    </form>

                    {/* Tickets log list */}
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                      {selectedProject.tickets.map(t => (
                        <div 
                          key={t.id}
                          className="p-3 rounded-xl border border-gray-50 dark:border-slate-900 flex items-center justify-between gap-3 bg-gray-50/20 dark:bg-slate-900/5"
                        >
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white text-xs">{t.title}</p>
                            <span className="text-[9px] text-gray-400 font-medium">Código: {t.id} · Aberto em {t.date}</span>
                          </div>
                          
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            t.status === 'resolvido'
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      ))}

                      {selectedProject.tickets.length === 0 && (
                        <p className="text-[10px] text-gray-400 text-center py-4 border border-dashed border-gray-100 dark:border-slate-850 rounded-xl bg-slate-50/5">
                          Nenhum chamado aberto. A operação de campo está rodando conforme planejado.
                        </p>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 🧹 REMOVABLE MODULE — delete the /leads folder to remove this feature entirely

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, FileText, Users, Settings, LogOut, Cpu, Sliders,
  Search, Plus, Phone, MessageSquare, TrendingUp, TrendingDown, Clock,
  Zap, DollarSign, Target, ChevronRight, X, Star, Tag, CheckCircle2,
  ExternalLink, MoreVertical, Filter, Inbox, ArrowRight, Activity, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import { useLeads } from '@/hooks/useLeads';

// ─── Types ──────────────────────────────────────────────────────────────────
type LeadStatus = 'new' | 'inprogress' | 'qualified' | 'proposal' | 'closed';
type LeadOrigin = 'whatsapp' | 'instagram' | 'site' | 'indicacao';

interface Lead {
  id: number | string;
  name: string;
  phone: string;
  interest: string;
  status: LeadStatus;
  time: string;
  score: number;
  tags: string[];
  firstMsg: string;
  origin: LeadOrigin;
  timeline?: { event: string; time: string; type: 'in' | 'out' | 'system' }[];
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_LEADS: Lead[] = [
  {
    id: 1, name: 'João Silva', phone: '(11) 98765-4321',
    interest: 'Condomínio 3 carregadores', status: 'new', time: '2h atrás',
    score: 87, tags: ['condomínio', 'urgente', '3 carregadores'],
    firstMsg: 'Boa tarde! Vi no Instagram da EcoCarga e tenho interesse em instalar carregadores no meu condomínio.',
    origin: 'instagram',
    timeline: [
      { event: 'Primeiro contato via WhatsApp', time: '2h atrás', type: 'in' },
      { event: '"Boa tarde! Vi no Instagram da EcoCarga..."', time: '2h atrás', type: 'in' },
      { event: 'Lead registrado automaticamente', time: '2h atrás', type: 'system' },
    ]
  },
  {
    id: 2, name: 'Maria Santos', phone: '(21) 91234-5678',
    interest: 'Frota corporativa DC 50kW', status: 'qualified', time: '1d atrás',
    score: 92, tags: ['frota', 'PJ', 'alto valor', 'DC'],
    firstMsg: 'Precisamos de carregadores rápidos para nossa frota de veículos elétricos. Temos 8 veículos e prevemos dobrar em 6 meses.',
    origin: 'site',
    timeline: [
      { event: 'Primeiro contato via Site', time: '1d atrás', type: 'in' },
      { event: '"Precisamos de carregadores rápidos..."', time: '1d atrás', type: 'in' },
      { event: 'Qualificado pelo vendedor', time: '18h atrás', type: 'system' },
      { event: 'Enviou especificação técnica da frota', time: '16h atrás', type: 'in' },
    ]
  },
  {
    id: 3, name: 'Pedro Oliveira', phone: '(11) 97654-3210',
    interest: 'Posto de gasolina 150kW', status: 'proposal', time: '3d atrás',
    score: 78, tags: ['posto', 'DC', 'rodovia', '150kW'],
    firstMsg: 'Tenho um posto na Rodovia Anhanguera e quero instalar carregadores ultra-rápidos para veículos de passagem.',
    origin: 'whatsapp',
    timeline: [
      { event: 'Primeiro contato via WhatsApp', time: '3d atrás', type: 'in' },
      { event: 'Reunião por vídeo realizada', time: '2d atrás', type: 'system' },
      { event: 'Proposta enviada por e-mail', time: '1d atrás', type: 'out' },
      { event: '"Vou analisar com meu sócio..."', time: '22h atrás', type: 'in' },
    ]
  },
  {
    id: 4, name: 'Ana Costa', phone: '(11) 99876-5432',
    interest: 'Residencial 7.4kW AC', status: 'closed', time: '1sem atrás',
    score: 65, tags: ['residencial', 'AC', '7.4kW'],
    firstMsg: 'Oi! Comprei um Tesla Model 3 e preciso de um carregador doméstico.',
    origin: 'whatsapp',
    timeline: [
      { event: 'Primeiro contato', time: '1sem atrás', type: 'in' },
      { event: 'Proposta enviada', time: '6d atrás', type: 'out' },
      { event: '✅ Proposta aceita e assinada', time: '5d atrás', type: 'system' },
    ]
  },
  {
    id: 5, name: 'Carlos Mendes', phone: '(41) 98888-7777',
    interest: 'Hotel 10 carregadores AC', status: 'new', time: '30min atrás',
    score: 95, tags: ['hotel', 'alto volume', 'AC', '10 unidades'],
    firstMsg: 'Sou gerente de um hotel Ibis em Curitiba. Queremos instalar 10 carregadores para os hóspedes como diferencial.',
    origin: 'instagram',
    timeline: [
      { event: 'Primeiro contato via Instagram DM', time: '30min atrás', type: 'in' },
      { event: '"Sou gerente de um hotel Ibis..."', time: '30min atrás', type: 'in' },
      { event: 'Lead registrado automaticamente', time: '30min atrás', type: 'system' },
    ]
  },
  {
    id: 6, name: 'Fernanda Lima', phone: '(11) 94444-3333',
    interest: 'Shopping 20 vagas EV', status: 'inprogress', time: '5h atrás',
    score: 88, tags: ['shopping', 'alto volume', 'AC+DC'],
    firstMsg: 'Somos responsáveis pelo estacionamento de um shopping em São Paulo. Precisamos de 20 pontos de recarga.',
    origin: 'indicacao',
    timeline: [
      { event: 'Indicação de cliente (Ana Costa)', time: '5h atrás', type: 'system' },
      { event: '"Somos responsáveis pelo estacionamento..."', time: '5h atrás', type: 'in' },
      { event: 'Primeiro contato do vendedor', time: '4h atrás', type: 'out' },
    ]
  },
  {
    id: 7, name: 'Roberto Alves', phone: '(19) 98888-1111',
    interest: 'Condomínio 5 carregadores', status: 'inprogress', time: '2d atrás',
    score: 74, tags: ['condomínio', 'síndico', '5 carregadores'],
    firstMsg: 'Sou síndico de um condomínio em Campinas com 80 apartamentos. Temos vários moradores com EVs.',
    origin: 'site',
    timeline: [
      { event: 'Formulário no site preenchido', time: '2d atrás', type: 'system' },
      { event: '"Sou síndico de um condomínio..."', time: '2d atrás', type: 'in' },
      { event: 'E-mail de apresentação enviado', time: '2d atrás', type: 'out' },
      { event: '"Obrigado! Vou passar para a assembleia."', time: '1d atrás', type: 'in' },
    ]
  },
];

// ─── DB Mapping Helpers ───────────────────────────────────────────────────────
function formatTimeDiff(createdAtStr: string): string {
  const created = new Date(createdAtStr);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);
  
  if (diffMin < 1) return 'agora mesmo';
  if (diffMin < 60) return `${diffMin}min atrás`;
  if (diffHrs < 24) return `${diffHrs}h atrás`;
  if (diffDays === 1) return '1d atrás';
  return `${diffDays}d atrás`;
}

function mapDbLeadToLead(dbLead: any): Lead {
  return {
    id: dbLead.id,
    name: dbLead.name,
    phone: dbLead.phone || '',
    interest: dbLead.address || '',
    status: (dbLead.lead_status || 'new') as LeadStatus,
    time: formatTimeDiff(dbLead.created_at),
    score: dbLead.lead_score || 50,
    tags: dbLead.tags || [],
    firstMsg: dbLead.first_msg || '',
    origin: (dbLead.lead_origin || 'whatsapp') as LeadOrigin,
    timeline: dbLead.timeline || []
  };
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; dot: string }> = {
  new:        { label: 'Novo',             color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
  inprogress: { label: 'Em Andamento',     color: 'text-blue-700 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800',         dot: 'bg-blue-500' },
  qualified:  { label: 'Qualificado',      color: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800',     dot: 'bg-amber-500' },
  proposal:   { label: 'Proposta Enviada', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' },
  closed:     { label: 'Fechado',          color: 'text-gray-600 dark:text-gray-400',     bg: 'bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700',        dot: 'bg-gray-400' },
};

const ORIGIN_CONFIG: Record<LeadOrigin, { label: string; color: string }> = {
  whatsapp:  { label: 'WhatsApp', color: '#25D366' },
  instagram: { label: 'Instagram', color: '#E1306C' },
  site:      { label: 'Site',     color: '#004D31' },
  indicacao: { label: 'Indicação', color: '#B2D235' },
};

// ─── WhatsApp Icon SVG ───────────────────────────────────────────────────────
const WhatsAppIcon = ({ size = 16, color = '#25D366' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.524 5.849L.057 23.43a.75.75 0 00.924.924l5.598-1.469A11.938 11.938 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.87 0-3.622-.484-5.145-1.334L3.5 21.5l.852-3.323A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
);

// ─── Funnel Stage ─────────────────────────────────────────────────────────────
const FUNNEL_STAGES = [
  { label: 'WhatsApp', icon: '📲', count: 42, color: 'from-[#25D366]/20 to-[#25D366]/5', border: 'border-[#25D366]/30', text: 'text-[#128C7E]' },
  { label: 'Qualificação', icon: '🔍', count: 28, color: 'from-amber-500/20 to-amber-500/5', border: 'border-amber-400/30', text: 'text-amber-700 dark:text-amber-400' },
  { label: 'Proposta', icon: '📄', count: 18, color: 'from-purple-500/20 to-purple-500/5', border: 'border-purple-400/30', text: 'text-purple-700 dark:text-purple-400' },
  { label: 'Fechado', icon: '✅', count: 14, color: 'from-[#004D31]/20 to-[#004D31]/5', border: 'border-[#004D31]/30', text: 'text-[#004D31] dark:text-[#B2D235]' },
];

// ─── Source Chart Data ────────────────────────────────────────────────────────
const SOURCES = [
  { label: 'WhatsApp Orgânico', pct: 45, color: '#25D366' },
  { label: 'Instagram Bio', pct: 28, color: '#E1306C' },
  { label: 'Site EcoCarga', pct: 18, color: '#004D31' },
  { label: 'Indicação', pct: 9, color: '#B2D235' },
];

// ─── NavItem ─────────────────────────────────────────────────────────────────
function NavItem({ icon: Icon, label, active = false, href }: { icon: any; label: string; active?: boolean; href: string }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
        active
          ? 'bg-[var(--sidebar-nav-active-bg)] text-[var(--sidebar-nav-active-text)] shadow-sm'
          : 'text-[var(--sidebar-nav-text)] hover:bg-[var(--sidebar-nav-hover-bg)] hover:text-[var(--sidebar-nav-hover-text)]'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
      {active && <motion.div layoutId="activeNav" className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--sidebar-nav-bullet)]" />}
    </a>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: LeadStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.color} ${cfg.bg}`}>
      {status === 'new' ? (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`} />
        </span>
      ) : (
        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      )}
      {cfg.label}
    </span>
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? '#004D31' : score >= 70 ? '#B2D235' : '#f59e0b';
  const label = score >= 85 ? '🔥 Quente' : score >= 70 ? '⚡ Morno' : '❄️ Frio';
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Score de Qualificação</span>
        <span className="text-xs font-black" style={{ color }}>{score}/100 — {label}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ─── Lead Row ─────────────────────────────────────────────────────────────────
function LeadRow({ lead, selected, onClick }: { lead: Lead; selected: boolean; onClick: () => void }) {
  const orig = ORIGIN_CONFIG[lead.origin];
  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`cursor-pointer border-b border-[var(--border)] transition-all ${
        selected
          ? 'bg-[var(--sidebar-nav-active-bg)]'
          : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/50'
      }`}
    >
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
            style={{ background: `linear-gradient(135deg, #004D31, #006B44)` }}
          >
            {lead.name.split(' ').map(n => n[0]).slice(0,2).join('')}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{lead.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <Phone size={10} /> {lead.phone}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4">
        <p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[180px]">{lead.interest}</p>
      </td>
      <td className="py-3.5 px-4">
        <span
          className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md"
          style={{ backgroundColor: orig.color + '18', color: orig.color }}
        >
          {lead.origin === 'whatsapp' && <WhatsAppIcon size={10} color={orig.color} />}
          {orig.label}
        </span>
      </td>
      <td className="py-3.5 px-4"><StatusBadge status={lead.status} /></td>
      <td className="py-3.5 px-4">
        <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
          <Clock size={11} /> {lead.time}
        </span>
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-1">
          <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${lead.score}%`, backgroundColor: lead.score >= 85 ? '#004D31' : lead.score >= 70 ? '#B2D235' : '#f59e0b' }}
            />
          </div>
          <span className="text-xs font-bold text-gray-500">{lead.score}</span>
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Lead Detail Panel ────────────────────────────────────────────────────────
function LeadDetailPanel({ lead, onClose, onCreateProposal, onQualify }: { lead: Lead; onClose: () => void; onCreateProposal: (l: Lead) => void; onQualify: (l: Lead) => void }) {
  const orig = ORIGIN_CONFIG[lead.origin];
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-[380px] flex-shrink-0 bg-[var(--card)] border-l border-[var(--border)] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 border-b border-[var(--border)] flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-md"
            style={{ background: `linear-gradient(135deg, #004D31, #006B44)` }}
          >
            {lead.name.split(' ').map(n => n[0]).slice(0,2).join('')}
          </div>
          <div>
            <h3 className="font-black text-gray-900 dark:text-white text-base">{lead.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <WhatsAppIcon size={12} color={orig.color} />
              <span className="text-xs font-semibold" style={{ color: orig.color }}>{orig.label}</span>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span className="text-xs text-gray-400">{lead.time}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Score */}
        <ScoreBar score={lead.score} />

        {/* Status + Interest */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={lead.status} />
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Interesse</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{lead.interest}</p>
          </div>
        </div>

        {/* Tags */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Tag size={11} /> Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {lead.tags.map(tag => (
              <span key={tag} className="text-xs bg-[#004D31]/10 text-[#004D31] dark:bg-[#B2D235]/10 dark:text-[#B2D235] px-2.5 py-1 rounded-full font-semibold">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* First Message */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><MessageSquare size={11} /> Primeira Mensagem</p>
          <div className="bg-[#DCF8C6] dark:bg-[#25D366]/10 rounded-2xl rounded-tl-none p-3.5 relative">
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">"{lead.firstMsg}"</p>
            <span className="text-[10px] text-gray-400 mt-1 block text-right">{lead.time} · WhatsApp</span>
          </div>
        </div>

        {/* Timeline */}
        {lead.timeline && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1"><Activity size={11} /> Histórico</p>
            <div className="space-y-3">
              {lead.timeline.map((ev, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-[10px] ${
                    ev.type === 'in' ? 'bg-[#25D366]' : ev.type === 'out' ? 'bg-[#004D31]' : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    {ev.type === 'in' ? '←' : ev.type === 'out' ? '→' : '⚙'}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">{ev.event}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{ev.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phone */}
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Telefone</p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{lead.phone}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-[var(--border)] space-y-2.5">
        <motion.button
          onClick={() => onCreateProposal(lead)}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 bg-[#004D31] text-white py-3 rounded-xl font-black text-sm shadow-lg shadow-[#004D31]/25 hover:bg-[#003B26] transition-colors"
        >
          <FileText size={16} />
          Criar Proposta para este Lead
        </motion.button>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => onQualify(lead)}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--border)] text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <CheckCircle2 size={14} className="text-amber-500" />
            Qualificar
          </button>
          <a
            href={`https://wa.me/${lead.phone.replace(/\D/g,'')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#25D366]/40 text-xs font-bold text-[#128C7E] hover:bg-[#25D366]/5 transition-colors"
          >
            <WhatsAppIcon size={14} color="#25D366" />
            Abrir WA
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LeadsPage() {
  const { profile, t } = useApp();
  const router = useRouter();

  // Use real Supabase hook — falls back to MOCK_LEADS if table is empty
  const { leads: dbLeads, loading, updateLead } = useLeads();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [simCount, setSimCount] = useState(0);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Sync real DB leads → local state, with mock fallback
  useEffect(() => {
    if (!loading) {
      if (dbLeads.length > 0) {
        setLeads(dbLeads.map(l => ({
          ...l,
          firstMsg: l.first_msg || '',
          time: l.created_at ? formatTimeDiff(l.created_at) : 'agora mesmo',
        } as Lead)));
      } else {
        // No DB leads yet — use mock data for demonstration
        setLeads(MOCK_LEADS);
      }
    }
  }, [dbLeads, loading]);

  const handleSimulate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const name = ['Gustavo Pereira', 'Camila Rocha', 'Diego Martins', 'Larissa Nunes'][simCount % 4];
      const phone = `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const interest = ['Condomínio 4 carregadores AC', 'Frota de delivery DC', 'Estacionamento público'][simCount % 3];

      const rawLead = {
        name,
        phone,
        address: interest,
        is_lead: true,
        lead_status: 'new',
        lead_score: Math.floor(60 + Math.random() * 35),
        tags: ['novo', 'whatsapp'],
        first_msg: 'Olá! Vi o anúncio de vocês e tenho interesse em carregadores elétricos.',
        lead_origin: 'whatsapp',
        timeline: [
          { event: 'Primeiro contato via WhatsApp', time: 'agora mesmo', type: 'in' },
          { event: 'Lead registrado automaticamente', time: 'agora mesmo', type: 'system' },
        ],
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('clients')
        .insert(rawLead)
        .select()
        .single();

      if (error) throw error;

      const newLeadObj = mapDbLeadToLead(data);
      setLeads(prev => [newLeadObj, ...prev]);
      setSimCount(c => c + 1);
      showToast('📲 Novo lead salvo no banco!');
    } catch (err: any) {
      showToast('Erro ao simular lead: ' + err.message);
    }
  };

  const handleQualifyLead = async (lead: Lead) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          lead_status: 'qualified',
          lead_score: Math.min(100, lead.score + 10),
          timeline: [
            ...(lead.timeline || []),
            { event: 'Qualificado pelo vendedor', time: 'agora mesmo', type: 'system' }
          ]
        })
        .eq('id', lead.id);

      if (error) throw error;

      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'qualified', score: Math.min(100, l.score + 10) } : l));
      setSelectedLead(prev => prev && prev.id === lead.id ? { ...prev, status: 'qualified', score: Math.min(100, prev.score + 10) } : prev);
      showToast('Lead qualificado!');
    } catch (err: any) {
      showToast('Erro ao qualificar: ' + err.message);
    }
  };

  const handleCreateProposal = (lead: Lead) => {
    showToast(`📄 Criando proposta para ${lead.name}...`);
    setTimeout(() => {
      router.push(`/proposals/new?leadId=${lead.id}&name=${encodeURIComponent(lead.name)}&phone=${encodeURIComponent(lead.phone)}&address=${encodeURIComponent(lead.interest)}`);
    }, 1200);
  };

  const filtered = leads.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase())
      || l.phone.includes(search)
      || l.interest.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">

      <AppSidebar />

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen">

        {/* Header */}
        <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-[var(--border)] px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#25D366]/15 rounded-lg flex items-center justify-center">
              <WhatsAppIcon size={18} color="#25D366" />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 dark:text-white leading-tight">Leads WhatsApp</h1>
              <p className="text-xs text-gray-400">Central de captura e qualificação</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar lead..."
                className="pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-[var(--border)] rounded-xl w-56 focus:outline-none focus:ring-2 focus:ring-[#004D31]/30 text-gray-800 dark:text-gray-200 placeholder-gray-400"
              />
            </div>
            <motion.button
              onClick={handleSimulate}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="relative flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-[#25D366]/25 hover:bg-[#1DA851] transition-colors"
            >
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#25D366] animate-ping opacity-60" />
              <Plus size={16} />
              Simular Novo Lead
            </motion.button>
          </div>
        </header>

        <div className="p-8 space-y-7 flex-1">

          {/* ── KPI Cards ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-4 gap-5">
            {[
              { label: 'Total de Leads', value: leads.length.toString(), sub: `+${leads.length - 42 + 42} esse mês`, icon: Inbox, color: '#25D366', trend: '+18%', up: true },
              { label: 'Taxa de Conversão', value: '34%', sub: 'Lead → Fechado', icon: Target, color: '#004D31', trend: '+4pp', up: true },
              { label: 'Tempo de Resposta', value: '4h', sub: 'Média por lead', icon: Clock, color: '#f59e0b', trend: '-30min', up: true },
              { label: 'Potencial de Receita', value: 'R$\u00a0280k', sub: 'Em negociação', icon: DollarSign, color: '#7c3aed', trend: '+R$45k', up: true },
            ].map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: kpi.color + '18' }}>
                    <kpi.icon size={20} style={{ color: kpi.color }} />
                  </div>
                  <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${kpi.up ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40' : 'text-red-600 bg-red-50'}`}>
                    {kpi.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {kpi.trend}
                  </span>
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{kpi.value}</p>
                <p className="text-xs text-gray-400 mt-1.5 font-medium">{kpi.label}</p>
                <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-0.5">{kpi.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* ── Funnel ────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider">Funil de Conversão</h2>
              <span className="text-xs text-gray-400">Últimos 30 dias</span>
            </div>
            <div className="flex items-center gap-0">
              {FUNNEL_STAGES.map((stage, i) => (
                <React.Fragment key={stage.label}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 + i * 0.08 }}
                    className={`flex-1 bg-gradient-to-b ${stage.color} border ${stage.border} rounded-2xl p-4 text-center`}
                  >
                    <p className="text-2xl mb-1">{stage.icon}</p>
                    <p className={`text-3xl font-black ${stage.text}`}>{stage.count}</p>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1">{stage.label}</p>
                    {i > 0 && (
                      <p className="text-[10px] font-bold text-gray-400 mt-1">
                        {Math.round((stage.count / FUNNEL_STAGES[i-1].count) * 100)}% conv.
                      </p>
                    )}
                  </motion.div>
                  {i < FUNNEL_STAGES.length - 1 && (
                    <div className="flex flex-col items-center px-1 text-gray-300 dark:text-gray-600">
                      <ChevronRight size={22} strokeWidth={1.5} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.div>

          {/* ── Filter bar ────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-400 mr-1">Filtrar:</span>
            {(['all', 'new', 'inprogress', 'qualified', 'proposal', 'closed'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === s
                    ? 'bg-[#004D31] text-white shadow-sm'
                    : 'bg-[var(--card)] border border-[var(--border)] text-gray-500 dark:text-gray-400 hover:border-[#004D31]/40'
                }`}
              >
                {s === 'all' ? 'Todos' : STATUS_CONFIG[s as LeadStatus].label}
                <span className="ml-1.5 opacity-60 text-[10px]">
                  {s === 'all' ? leads.length : leads.filter(l => l.status === s).length}
                </span>
              </button>
            ))}
          </div>

          {/* ── Table + Detail ─────────────────────────────────────────────── */}
          <div className="flex gap-0 border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm bg-[var(--card)]">
            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-gray-50/70 dark:bg-gray-800/50">
                    {['Lead', 'Interesse', 'Origem', 'Status', 'Tempo', 'Score'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-gray-400 text-sm font-semibold">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="animate-spin text-[#004D31]" size={24} />
                          <span>Carregando leads do banco...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-gray-400 text-sm font-semibold">
                        Nenhum lead encontrado para esta busca.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(lead => (
                      <LeadRow
                        key={lead.id}
                        lead={lead}
                        selected={selectedLead?.id === lead.id}
                        onClick={() => setSelectedLead(prev => prev?.id === lead.id ? null : lead)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Detail Panel */}
            <AnimatePresence>
              {selectedLead && (
                <LeadDetailPanel
                  lead={selectedLead}
                  onClose={() => setSelectedLead(null)}
                  onCreateProposal={handleCreateProposal}
                  onQualify={handleQualifyLead}
                />
              )}
            </AnimatePresence>
          </div>

          {/* ── Source Chart ───────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm"
          >
            <h2 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider mb-5">Origem dos Leads</h2>
            <div className="space-y-3">
              {SOURCES.map((src, i) => (
                <div key={src.label} className="flex items-center gap-3">
                  <span className="w-28 text-xs font-semibold text-gray-600 dark:text-gray-400 text-right flex-shrink-0">{src.label}</span>
                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <motion.div
                      className="h-full rounded-lg flex items-center px-2"
                      style={{ backgroundColor: src.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${src.pct}%` }}
                      transition={{ duration: 0.7, delay: 0.4 + i * 0.08, ease: 'easeOut' }}
                    >
                      <span className="text-[10px] font-black text-white whitespace-nowrap">{src.pct}%</span>
                    </motion.div>
                  </div>
                  <span className="text-xs font-bold text-gray-400 w-8">{src.pct}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Removable Notice ───────────────────────────────────────────── */}
          <div className="border border-dashed border-[#B2D235]/40 bg-[#B2D235]/5 rounded-xl p-4 flex items-start gap-3">
            <Zap size={16} className="text-[#B2D235] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-black text-gray-700 dark:text-gray-300">Módulo em Protótipo — Dados Fictícios</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Esta página usa dados simulados. Para conectar ao WhatsApp real, será necessário configurar a integração n8n + Evolution API/Z-API.
                Para remover este módulo, basta deletar a pasta <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-[#004D31] dark:text-[#B2D235]">/src/app/leads</code>.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* ── Toast Notification ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold"
          >
            <span className="text-base">✅</span>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

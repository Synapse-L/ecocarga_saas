// 🧩 AppSidebar — Sidebar compartilhada entre todos os módulos novos
// Usada por: /clients, /commissions, /installations, /reports, /leads
// NÃO modifica páginas existentes (page.tsx, settings, etc.)

"use client";

import React from 'react';
import {
  LayoutDashboard, FileText, Users, Settings, LogOut,
  Cpu, Sliders, MessageSquare, DollarSign, Wrench,
  BarChart3, ChevronRight, GraduationCap, Keyboard, Compass
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

interface NavItemProps {
  icon: any;
  label: string;
  href: string;
  badge?: string;
  section?: boolean;
}

function NavItem({ icon: Icon, label, href, badge }: NavItemProps) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <a
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-sm group ${
        active
          ? 'bg-[var(--sidebar-nav-active-bg)] text-[var(--sidebar-nav-active-text)] shadow-sm'
          : 'text-[var(--sidebar-nav-text)] hover:bg-[var(--sidebar-nav-hover-bg)] hover:text-[var(--sidebar-nav-hover-text)]'
      }`}
    >
      <Icon size={18} className="flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-[#B2D235] text-[#004D31]">
          {badge}
        </span>
      )}
      {active && (
        <motion.div
          layoutId="activeSidebarBullet"
          className="w-1.5 h-1.5 rounded-full bg-[var(--sidebar-nav-bullet)]"
        />
      )}
    </a>
  );
}

function NavSection({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--sidebar-nav-text)] opacity-50 px-4 pt-4 pb-1">
      {label}
    </p>
  );
}

interface AppSidebarProps {
  onRestartTour?: () => void;
  onShowShortcuts?: () => void;
}

export default function AppSidebar({ onRestartTour, onShowShortcuts }: AppSidebarProps) {
  const { profile } = useApp();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="w-64 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] flex flex-col fixed h-full z-20 transition-colors duration-300">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2 mb-6">
          <img src="/ecocarga-logo-small.png" alt="EcoCarga" className="w-8 h-8 object-contain" />
          <div>
            <span className="text-base font-black tracking-tight text-[var(--sidebar-text-active)] leading-none block">
              Kepler's Proposal
            </span>
            <span className="text-[10px] text-[var(--sidebar-nav-text)] font-medium">EcoCarga SaaS</span>
          </div>
        </div>

        <nav className="space-y-0.5">
          {/* Principal */}
          <NavSection label="Principal" />
          <NavItem icon={LayoutDashboard} label="Dashboard" href="/" />
          <NavItem icon={FileText} label="Propostas" href="#" />
          <NavItem icon={Users} label="Clientes" href="/clients" />
          <NavItem icon={MessageSquare} label="Leads WhatsApp" href="/leads" />

          {/* Engenharia */}
          <NavSection label="Engenharia & Projetos" />
          
          

          {/* Gestão */}
          <NavSection label="Gestão" />
          <NavItem icon={DollarSign} label="Comissões" href="/commissions" />
          <NavItem icon={BarChart3} label="Relatórios" href="/reports" />

          {/* Admin */}
          {profile?.role === 'admin' && (
            <>
              <NavSection label="Admin" />
              <NavItem icon={Cpu} label="Carregadores" href="/models" />
              <NavItem icon={Sliders} label="Templates" href="/templates" />
            </>
          )}

          <NavSection label="Sistema" />
          <NavItem icon={Settings} label="Configurações" href="/settings" />
        </nav>
      </div>

      {/* User + Logout */}
      <div className="mt-auto p-5 border-t border-[var(--sidebar-border)]">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #004D31, #006B44)' }}
          >
            {profile?.full_name?.substring(0, 2).toUpperCase() || 'US'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-bold text-[var(--sidebar-text-active)] truncate leading-tight">
              {profile?.full_name || 'Usuário'}
            </p>
            <p className="text-[11px] text-[var(--sidebar-nav-text)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Plano Pro
            </p>
          </div>
        </div>
        {onRestartTour && (
          <button
            data-tour="tour-btn"
            onClick={onRestartTour}
            className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-[var(--sidebar-nav-text)] hover:text-accent hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer text-sm font-medium mb-1"
            title="Ver tour guiado"
          >
            <GraduationCap size={16} />
            <span>Ver Tour</span>
          </button>
        )}
        {onShowShortcuts && (
          <button
            onClick={onShowShortcuts}
            className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-[var(--sidebar-nav-text)] hover:text-[var(--sidebar-nav-hover-text)] hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer text-sm font-medium mb-2"
            title="Atalhos de teclado"
          >
            <Keyboard size={16} />
            <span>Atalhos</span>
          </button>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-[var(--sidebar-nav-text)] hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all cursor-pointer text-sm font-medium"
        >
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

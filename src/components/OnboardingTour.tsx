// ============================================================
// ONBOARDING BEETHOVEN — DEMO PARA O CEO
// Para remover: delete este arquivo e remova <OnboardingTour />
// de src/app/page.tsx (busque por "ONBOARDING TOUR BEETHOVEN")
// ============================================================

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, X,
  Sparkles, BarChart3, Kanban, FileText,
  Settings, Link2, PenLine, Keyboard, Zap, LayoutDashboard, MousePointer2
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

// ── Types ────────────────────────────────────────────────────
interface Rect { top: number; left: number; width: number; height: number; }

interface Action {
  /** data-tour selector to click */
  selector: string;
  /** ms to wait AFTER clicking (for React re-render) */
  wait?: number;
}

interface Step {
  icon: React.ReactNode;
  badge: string;
  title: string;
  description: string;
  /** Actions to execute (clicking real DOM buttons) before showing spotlight */
  actions?: Action[];
  /** Element to spotlight. Selector for [data-tour="x"] attributes */
  target?: string;
  /** Card corner position */
  cardPosition?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  /** Scroll target element into view after actions */
  scrollTo?: string;
}

// ── Steps definition ─────────────────────────────────────────
const getStepsForRole = (role?: string, fullName?: string): Step[] => {
  const isVendedor = role === 'vendedor';
  const name = fullName || 'Beethoven';

  const baseSteps: Step[] = [
    // 0 — Welcome
    {
      icon: <Sparkles size={26} className="text-yellow-400" />,
      badge: 'Bem-vindo',
      title: `${name}, bem-vindo ao Kepler's Proposal! 🎉`,
      description:
        'Este é o sistema comercial completo da EcoCarga — criado para sua equipe fechar mais negócios com velocidade e profissionalismo. Vou te guiar por cada funcionalidade, passo a passo.',
      cardPosition: 'bottom-right',
    },

    // 1 — Tab navigation (navigates to Gráficos)
    {
      icon: <LayoutDashboard size={26} className="text-blue-400" />,
      badge: 'Navegação Principal',
      title: 'Três abas principais no topo',
      description:
        'O sistema tem 3 modos: "Gráficos" para o dashboard executivo, "Insights & Rankings" para análises avançadas, e "Gerenciador" para controlar todas as propostas. Começamos pelos Gráficos.',
      actions: [
        { selector: '[data-tour="tab-charts"]', wait: 300 },
      ],
      target: '[data-tour="tab-nav"]',
      cardPosition: 'bottom-right',
      scrollTo: '[data-tour="tab-nav"]',
    },

    // 2 — KPIs
    {
      icon: <BarChart3 size={26} className="text-purple-400" />,
      badge: 'KPIs — Inteligência Comercial',
      title: 'Seus números em tempo real',
      description:
        'Estes 6 cards mostram: total de propostas, valor total proposto, receita potencial em aberto, taxa de conversão, ticket médio e tempo médio de fechamento — atualizados automaticamente a cada operação.',
      actions: [
        { selector: '[data-tour="tab-charts"]', wait: 350 },
      ],
      target: '[data-tour="kpis"]',
      cardPosition: 'bottom-right',
      scrollTo: '[data-tour="kpis"]',
    },

    // 3 — Charts
    {
      icon: <BarChart3 size={26} className="text-emerald-400" />,
      badge: 'Gráficos — Pipeline Comercial',
      title: 'Evolução visual do pipeline de vendas',
      description:
        'Abaixo dos KPIs estão os gráficos: histórico mensal de propostas criadas e fechadas, distribuição de status em pizza, funil de conversão e ranking de produtos — tudo visual e sem planilhas.',
      actions: [
        { selector: '[data-tour="tab-charts"]', wait: 350 },
      ],
      target: '[data-tour="charts"]',
      cardPosition: 'bottom-right',
      scrollTo: '[data-tour="charts"]',
    },

    // 4 — New proposal button
    {
      icon: <Zap size={26} className="text-yellow-400" />,
      badge: 'Criação de Proposta',
      title: 'Nova proposta em menos de 2 minutos',
      description:
        'Este botão abre um formulário guiado de 4 passos: dados do cliente, produto, template e geração automática de capa + ficha técnica. A proposta sai pronta para PDF ou link digital.',
      target: '[data-tour="new-proposal"]',
      cardPosition: 'bottom-left',
    },

    // 5 — Navigate to Gerenciador (table mode)
    {
      icon: <MousePointer2 size={26} className="text-orange-400" />,
      badge: 'Gerenciador de Propostas',
      title: 'Navegando para o Gerenciador...',
      description:
        'Aqui é onde a equipe gerencia todas as propostas. Clicamos na aba "Gerenciador" para você ver — ela fica no modo Tabela por padrão, com filtros, busca e paginação completos.',
      actions: [
        { selector: '[data-tour="tab-proposals"]', wait: 350 },
        { selector: '[data-tour="toggle-table"]', wait: 250 },
      ],
      target: '[data-tour="tab-proposals"]',
      cardPosition: 'bottom-right',
      scrollTo: '[data-tour="manager-card"]',
    },

    // 6 — Table view (manager card spotlight)
    {
      icon: <FileText size={26} className="text-sky-400" />,
      badge: 'Modo Tabela',
      title: 'Todas as propostas em um lugar',
      description:
        'Aqui ficam todas as propostas com filtros por status e período, busca por cliente, ordenação por qualquer coluna. Em cada linha: baixar PDF, duplicar, alterar status e gerar link para o cliente.',
      actions: [
        { selector: '[data-tour="tab-proposals"]', wait: 300 },
        { selector: '[data-tour="toggle-table"]', wait: 250 },
      ],
      target: '[data-tour="manager-card"]',
      cardPosition: 'top-right',
      scrollTo: '[data-tour="manager-card"]',
    },

    // 7 — Link público (share button)
    {
      icon: <Link2 size={26} className="text-sky-400" />,
      badge: 'Link Público de Proposta',
      title: 'Proposta online para o cliente',
      description:
        'O ícone de link 🔗 em cada linha gera uma URL única para a proposta. O cliente abre no celular sem precisar baixar nada — vê todos os dados profissionais e pode assinar digitalmente ali mesmo.',
      actions: [
        { selector: '[data-tour="tab-proposals"]', wait: 300 },
        { selector: '[data-tour="toggle-table"]', wait: 250 },
      ],
      target: '[data-tour="manager-card"]',
      cardPosition: 'top-right',
      scrollTo: '[data-tour="manager-card"]',
    },

    // 8 — Kanban navigation (explains FIRST, then switches)
    {
      icon: <MousePointer2 size={26} className="text-pink-400" />,
      badge: 'Mudando para o Kanban...',
      title: 'Agora veja o modo Kanban!',
      description:
        'Além da tabela, você pode visualizar as propostas em modo Kanban — igual ao ClickUp. Estamos alternando para esse modo agora para que você veja como funciona.',
      actions: [
        { selector: '[data-tour="tab-proposals"]', wait: 300 },
        { selector: '[data-tour="toggle-kanban"]', wait: 350 },
      ],
      target: '[data-tour="view-toggle"]',
      cardPosition: 'bottom-right',
      scrollTo: '[data-tour="view-toggle"]',
    },

    // 9 — Kanban view (spotlights the board)
    {
      icon: <Kanban size={26} className="text-pink-400" />,
      badge: 'Modo Kanban',
      title: 'Arrastar e soltar como no ClickUp',
      description:
        'As propostas ficam em 3 colunas: Em Andamento, Aprovadas e Recusadas. Arraste cards entre colunas para mudar o status, ou reordene dentro da mesma coluna. Cada card mostra há quantos dias está parado com alerta de cor.',
      actions: [
        { selector: '[data-tour="tab-proposals"]', wait: 300 },
        { selector: '[data-tour="toggle-kanban"]', wait: 350 },
      ],
      target: '[data-tour="manager-card"]',
      cardPosition: 'top-right',
      scrollTo: '[data-tour="manager-card"]',
    },

    // 10 — Assinatura digital (conceptual)
    {
      icon: <PenLine size={26} className="text-rose-400" />,
      badge: 'Assinatura Digital',
      title: 'Fechamento de negócio sem papel',
      description:
        'Via link público, o cliente assina a proposta com o dedo ou mouse na tela. A assinatura é salva com data/hora e o dashboard atualiza automaticamente o status para "Aprovada". Fim do ciclo de impressão.',
      cardPosition: 'bottom-right',
    },

    // 11 — Shortcuts button
    {
      icon: <Keyboard size={26} className="text-yellow-400" />,
      badge: 'Atalhos de Teclado',
      title: 'Produtividade máxima para a equipe',
      description:
        'Este botão (e a tecla ?) abre o painel de atalhos. N → Nova Proposta · K → Kanban · T → Tabela · G → Gráficos. Pequenos detalhes que fazem o trabalho fluir mais rápido no dia a dia.',
      target: '[data-tour="tour-btn"]',
      cardPosition: 'top-left',
    },
  ];

  if (isVendedor) {
    return [
      ...baseSteps,
      // 12 — Settings link (adaptado para vendedor - sem mencionar carregadores e templates que são de admin)
      {
        icon: <Settings size={26} className="text-gray-400" />,
        badge: 'Configurações',
        title: 'Personalize suas preferências',
        description:
          'Em Configurações: altere seu nome de exibição, tema visual (Branco, Preto ou EcoCarga) e idioma por conta. Se precisar de permissões especiais de Admin, solicite diretamente por aqui!',
        target: '[data-tour="settings-link"]',
        cardPosition: 'top-left',
      },
      // 13 — Done
      {
        icon: <Sparkles size={26} className="text-[#B2D235]" />,
        badge: 'Tudo Pronto!',
        title: `Prontinho para vender, ${name}! ⚡`,
        description:
          'Você já pode começar a criar propostas agora. Se precisar de ajuda, clique em "Ver Tour" na barra lateral. Boas vendas!',
        cardPosition: 'bottom-right',
      }
    ];
  } else {
    return [
      ...baseSteps,
      // 12 — Settings link (completo com templates e carregadores para admin)
      {
        icon: <Settings size={26} className="text-gray-400" />,
        badge: 'Configurações',
        title: 'Gerenciamento Geral (Admin)',
        description:
          'Em Configurações: edite seu perfil. Em Carregadores: gerencie o catálogo técnico de carregadores. Em Templates: suba PDFs comerciais da empresa. Você também pode gerenciar permissões de vendedores!',
        target: '[data-tour="settings-link"]',
        cardPosition: 'top-left',
      },
      // 13 — Done
      {
        icon: <Sparkles size={26} className="text-[#B2D235]" />,
        badge: 'Tudo Pronto!',
        title: `Tudo Pronto, Admin! ⚡`,
        description:
          `Como administrador, você tem controle total do sistema, ${name}. Configure os carregadores e templates para sua equipe começar a vender com eficiência.`,
        cardPosition: 'bottom-right',
      }
    ];
  }
};

// ── Constants ─────────────────────────────────────────────────
const PADDING = 16; // glow padding around highlighted element

// ── Helpers ───────────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function runActions(actions: Action[]): Promise<void> {
  for (const action of actions) {
    const el = document.querySelector(action.selector) as HTMLElement | null;
    if (el) {
      el.click();
      await sleep(action.wait ?? 200);
    } else {
      // Element not in DOM yet (e.g. tab not rendered) — just wait
      await sleep(action.wait ?? 200);
    }
  }
}

// ── Main component ────────────────────────────────────────────
export function OnboardingTour() {
  const { profile, setProfile } = useApp();
  const steps = getStepsForRole(profile?.role, profile?.full_name);
  const [open, setOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [busy, setBusy] = useState(false);   // running pre-actions
  const [win, setWin] = useState({ w: 1440, h: 900 });
  const rafRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  // ── Open on first visit ──
  useEffect(() => {
    mountedRef.current = true;
    if (!profile) return; // Aguarda o carregamento do perfil do Supabase
    
    const done = profile.completed_tour;
    if (!done) {
      const t = setTimeout(() => { if (mountedRef.current) setOpen(true); }, 900);
      return () => clearTimeout(t);
    }
    return () => { mountedRef.current = false; };
  }, [profile]);

  // ── Track window size ──
  useEffect(() => {
    const update = () => setWin({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ── Measure target element ──
  const measureTarget = useCallback((selector?: string) => {
    if (!selector) { setRect(null); return; }
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    if (mountedRef.current) setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, []);

  // ── Step activation: run actions → scroll → measure ──
  useEffect(() => {
    if (!open) return;
    mountedRef.current = true;

    // Cancel any running rAF loop
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

    const current = steps[stepIdx];
    let cancelled = false;

    const activate = async () => {
      setBusy(true);
      setRect(null);

      // Run pre-actions (click tabs, toggle views, etc.)
      if (current.actions?.length) {
        await runActions(current.actions);
      }

      if (cancelled) return;

      // Scroll target into view
      if (current.scrollTo) {
        const el = document.querySelector(current.scrollTo) as HTMLElement | null;
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(350);
      }

      if (cancelled) return;
      setBusy(false);

      // Initial measurement
      measureTarget(current.target);

      // Keep measuring with rAF to track scroll / layout shifts
      const loop = () => {
        if (!cancelled) {
          measureTarget(current.target);
          rafRef.current = requestAnimationFrame(loop);
        }
      };
      rafRef.current = requestAnimationFrame(loop);
    };

    activate();

    return () => {
      cancelled = true;
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
  }, [open, stepIdx, measureTarget]);

  // ── Navigation ──
  const go = useCallback((dir: 1 | -1) => {
    setStepIdx(s => Math.max(0, Math.min(steps.length - 1, s + dir)));
  }, [steps]);

  const close = useCallback(async () => {
    setOpen(false);
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    
    if (profile?.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ completed_tour: true })
          .eq('id', profile.id);
          
        if (error) throw error;
        
        // Atualiza o estado local para evitar reexibição imediata
        setProfile((prev: any) => prev ? { ...prev, completed_tour: true } : null);
      } catch (err) {
        console.error('Erro ao salvar conclusão do tour no Supabase:', err);
      }
    }
  }, [profile, setProfile]);

  const jumpTo = useCallback((i: number) => {
    setStepIdx(i);
  }, []);

  // ── SVG clip path (full screen minus rounded hole for target) ──
  const buildClip = (): string | null => {
    if (!rect || rect.width === 0) return null;
    const p = PADDING;
    const { w, h } = win;
    const rx = rect.left - p, ry = rect.top - p;
    const rw = rect.width + p * 2, rh = rect.height + p * 2;
    const radius = 14;
    return (
      `M0,0 H${w} V${h} H0 Z ` +
      `M${rx + radius},${ry} ` +
      `H${rx + rw - radius} Q${rx + rw},${ry} ${rx + rw},${ry + radius} ` +
      `V${ry + rh - radius} Q${rx + rw},${ry + rh} ${rx + rw - radius},${ry + rh} ` +
      `H${rx + radius} Q${rx},${ry + rh} ${rx},${ry + rh - radius} ` +
      `V${ry + radius} Q${rx},${ry} ${rx + radius},${ry} Z`
    );
  };

  // ── Card position ──
  const cardStyle = (): React.CSSProperties => {
    const p = steps[stepIdx]?.cardPosition ?? 'bottom-right';
    const m = 28;
    const base: React.CSSProperties = { position: 'fixed', zIndex: 10001, width: 380 };
    if (p === 'bottom-right') return { ...base, bottom: m, right: m };
    if (p === 'bottom-left')  return { ...base, bottom: m, left: m };
    if (p === 'top-right')    return { ...base, top: m, right: m };
    if (p === 'top-left')     return { ...base, top: m, left: m };
    return { ...base, bottom: m, right: m };
  };

  const current = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;
  const progress = ((stepIdx + 1) / steps.length) * 100;
  const clip = buildClip();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* CSS Animations for the spotlight ring */}
          <style>{`
            @keyframes tour-ring-pulse {
              0%, 100% { opacity: 0.55; }
              50% { opacity: 1; }
            }
            @keyframes tour-ring-dash {
              to { stroke-dashoffset: -24; }
            }
            .tour-ring-animated {
              animation: tour-ring-pulse 2s infinite ease-in-out, tour-ring-dash 1.2s infinite linear;
            }
          `}</style>

          {/* ── SVG Spotlight overlay ── */}
          <motion.svg
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', inset: 0,
              width: win.w, height: win.h,
              zIndex: 9998, pointerEvents: 'none',
              overflow: 'visible',
            }}
          >
            {/* Dark overlay with dynamic cutout - single path ensures no multiple elements get stuck */}
            <motion.path
              key="tour-overlay-path"
              d={clip || `M0,0 H${win.w} V${win.h} H0 Z`}
              fill="rgba(0,0,0,0.72)"
              fillRule="evenodd"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            />

            {/* Glowing accent ring around target - rendered conditionally with a static key to guarantee exactly 1 or 0 ring in DOM */}
            {rect && rect.width > 0 && (
              <motion.rect
                key="tour-ring"
                x={rect.left - PADDING}
                y={rect.top - PADDING}
                width={rect.width + PADDING * 2}
                height={rect.height + PADDING * 2}
                rx={16}
                fill="none"
                stroke="#B2D235"
                strokeWidth={2.5}
                strokeDasharray="8 4"
                className="tour-ring-animated"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  scale: { type: 'spring', stiffness: 300, damping: 22 },
                  opacity: { duration: 0.2 }
                }}
              />
            )}
          </motion.svg>

          {/* Backdrop click to close */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9999, cursor: 'default' }}
            onClick={close}
          />

          {/* ── Tooltip card ── */}
          <motion.div
            key={`card-${stepIdx}`}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={cardStyle()}
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-black/50 border border-white/10 dark:border-slate-700 overflow-hidden">

              {/* Top progress bar */}
              <div className="h-1 bg-gray-100 dark:bg-slate-800">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#004D31] to-[#B2D235]"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              {/* Badge row */}
              <div className="flex items-center justify-between px-5 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                    {stepIdx + 1} / {steps.length}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#004D31] dark:text-[#B2D235] bg-[#004D31]/5 dark:bg-[#B2D235]/5 px-2 py-0.5 rounded-full">
                    {current.badge}
                  </span>
                  {busy && (
                    <span className="text-[10px] font-bold text-gray-300 dark:text-slate-600 animate-pulse">
                      navegando...
                    </span>
                  )}
                </div>
                <button
                  onClick={close}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {current.icon}
                  </div>
                  <h2 className="text-[15px] font-black text-gray-900 dark:text-white leading-snug pt-1">
                    {current.title}
                  </h2>
                </div>
                <p className="text-[13px] text-gray-500 dark:text-slate-400 leading-relaxed pl-14">
                  {current.description}
                </p>
              </div>

              {/* Footer */}
              <div className="px-5 pb-4 flex items-center justify-between">
                <button
                  onClick={close}
                  className="text-xs font-bold text-gray-300 dark:text-slate-600 hover:text-gray-500 transition-colors cursor-pointer"
                >
                  Pular tour
                </button>
                <div className="flex items-center gap-2">
                  {stepIdx > 0 && (
                    <button
                      onClick={() => go(-1)}
                      disabled={busy}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-40"
                    >
                      <ChevronLeft size={14} /> Anterior
                    </button>
                  )}
                  <button
                    onClick={() => { if (isLast) close(); else go(1); }}
                    disabled={busy}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#004D31] text-white hover:opacity-90 active:scale-[0.97] transition-all shadow-md shadow-[#004D31]/30 cursor-pointer disabled:opacity-50"
                  >
                    {isLast ? '🚀 Começar' : <>{busy ? 'Aguarde...' : 'Próximo'} {!busy && <ChevronRight size={14} />}</>}
                  </button>
                </div>
              </div>

              {/* Step dots */}
              <div className="flex justify-center gap-1.5 pb-4 flex-wrap px-4">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => jumpTo(i)}
                    disabled={busy}
                    className={`rounded-full transition-all cursor-pointer disabled:opacity-40 ${
                      i === stepIdx
                        ? 'w-5 h-1.5 bg-[#004D31]'
                        : i < stepIdx
                        ? 'w-1.5 h-1.5 bg-[#004D31]/30 dark:bg-[#B2D235]/30'
                        : 'w-1.5 h-1.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Hook for "Ver Tour" sidebar button ───────────────────────
export function useOnboarding() {
  const { profile, setProfile } = useApp();
  
  const restart = async () => {
    if (profile?.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ completed_tour: false })
          .eq('id', profile.id);
          
        if (error) throw error;
        
        // Atualiza o estado local para True/False
        setProfile((prev: any) => prev ? { ...prev, completed_tour: false } : null);
        
        // Recarrega a página para reiniciar com o estado limpo
        window.location.reload();
      } catch (err) {
        console.error('Erro ao reiniciar tour no Supabase:', err);
      }
    }
  };
  return { restart };
}

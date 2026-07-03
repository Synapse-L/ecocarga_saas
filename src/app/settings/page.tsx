// 🧹 REMOVABLE MODULE — settings tab extensions for White-Label and ERP integrations
// This file extends settings with interactive branding preview systems and integration configs.

"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Settings, User, Globe, Moon, Sun, Save, Loader2, 
  CheckCircle, FileText, Users, LayoutDashboard, LogOut, Cpu, 
  Sparkles, Sliders, Shield, AlertCircle, Upload, Eye, Palette, 
  Link2, CreditCard, Building, ToggleLeft, ToggleRight, Check
} from 'lucide-react';
import AdminPermissions from '@/components/AdminPermissions';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import AppSidebar from '@/components/AppSidebar';

type SettingsTab = 'geral' | 'whitelabel' | 'integracoes' | 'permissoes';

export default function SettingsPage() {
  const { theme, setTheme, language, setLanguage, profile, updateNickname, t } = useApp();
  const router = useRouter();

  // Tab State
  const [activeTab, setActiveTab] = useState<SettingsTab>('geral');

  // Geral Settings State
  const [nickname, setNickname] = useState('');
  const [localTheme, setLocalTheme] = useState(theme);
  const [localLanguage, setLocalLanguage] = useState(language);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Admin Promotion State
  const [promotionKey, setPromotionKey] = useState('');
  const [promoting, setPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [promoteSuccess, setPromoteSuccess] = useState<string | null>(null);

  // White-Label States (Epic 4.4)
  const [logoUploaded, setLogoUploaded] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#004D31');
  const [secondaryColor, setSecondaryColor] = useState('#B2D235');
  const [customDomain, setCustomDomain] = useState('parceiro.ecocarga.com.br');
  const [sslChecking, setSslChecking] = useState(false);
  const [sslStatus, setSslStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [catalogItems, setCatalogItems] = useState({
    ac7: true,
    ac22: true,
    dc50: true,
    dc150: false
  });

  // ERP & Faturamento States (Epic 4.1 & 4.2)
  const [erpSelect, setErpSelect] = useState<'bling' | 'omie'>('bling');
  const [autoNfe, setAutoNfe] = useState(true);
  const [syncClients, setSyncClients] = useState(true);
  const [gatewaySelect, setGatewaySelect] = useState<'asaas' | 'pagarme'>('asaas');
  const [pixInstant, setPixInstant] = useState(true);
  const [allowInstallments, setAllowInstallments] = useState(true);

  useEffect(() => {
    if (profile) {
      setNickname(profile.full_name || '');
      setLoadingProfile(false);
    }
  }, [profile]);

  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  useEffect(() => {
    setLocalLanguage(language);
  }, [language]);

  // Original Profile saving action
  const handleSaveGeral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      setTheme(localTheme);
      setLanguage(localLanguage);

      const successNick = await updateNickname(nickname);
      if (!successNick) {
        throw new Error(t('saveError'));
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  // Original Admin request action
  const handleRequestAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoting(true);
    setPromoteError(null);
    setPromoteSuccess(null);

    try {
      const res = await fetch('/api/admin/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: promotionKey })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao processar promoção.');

      setPromoteSuccess('Parabéns! Sua conta foi promovida a Administrador com sucesso. Recarregando permissões...');
      setPromotionKey('');
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setPromoteError(err.message || 'Chave incorreta. Tente novamente.');
    } finally {
      setPromoting(false);
    }
  };

  // Reseller Logo Upload Simulation
  const handleSimulateLogoUpload = () => {
    setUploadingLogo(true);
    setTimeout(() => {
      setUploadingLogo(false);
      setLogoUploaded(true);
    }, 1200);
  };

  // Reseller SSL validation simulation
  const handleVerifyDomainSSL = () => {
    setSslChecking(true);
    setTimeout(() => {
      setSslChecking(false);
      setSslStatus('valid');
    }, 1500);
  };

  // Generic Save for extended tabs
  const handleSaveExtended = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    }, 800);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* Shared Sidebar Component */}
      <AppSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col ml-64 min-h-screen">
        {/* Header */}
        <header className="h-16 bg-background/80 backdrop-blur-md border-b border-border px-8 flex items-center justify-between sticky top-0 z-10 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="p-2 hover:bg-[var(--sidebar-nav-hover-bg)] rounded-lg transition-colors text-[var(--sidebar-nav-text)] cursor-pointer">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('settings')}</h1>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-5xl mx-auto w-full space-y-6">
          
          {/* Settings Tab selectors */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-2 rounded-2xl flex flex-wrap gap-1 text-xs font-bold shadow-sm">
            <button
              onClick={() => { setActiveTab('geral'); setError(null); }}
              className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'geral'
                  ? 'bg-[#004D31] dark:bg-[#B2D235] text-white dark:text-[#004D31] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <User size={14} />
              Geral & Perfil
            </button>
            
            <button
              onClick={() => { setActiveTab('whitelabel'); setError(null); }}
              className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'whitelabel'
                  ? 'bg-[#004D31] dark:bg-[#B2D235] text-white dark:text-[#004D31] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Palette size={14} />
              White-Label Revenda
            </button>

            <button
              onClick={() => { setActiveTab('integracoes'); setError(null); }}
              className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'integracoes'
                  ? 'bg-[#004D31] dark:bg-[#B2D235] text-white dark:text-[#004D31] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Link2 size={14} />
              ERP & Faturamento
            </button>

            <button
              onClick={() => { setActiveTab('permissoes'); setError(null); }}
              className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'permissoes'
                  ? 'bg-[#004D31] dark:bg-[#B2D235] text-white dark:text-[#004D31] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Shield size={14} />
              Permissões do Time
            </button>
          </div>

          {/* Tab Views Content */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-8 transition-colors duration-300 min-h-[400px] flex flex-col justify-between">
            
            <AnimatePresence mode="wait">
              {/* ========================================================================= */}
              {/* TAB 1: GERAL (Original) */}
              {/* ========================================================================= */}
              {activeTab === 'geral' && (
                <motion.form 
                  key="geral"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleSaveGeral} 
                  className="space-y-8 text-xs flex-1"
                >
                  {/* Nickname Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-850/50">
                      <User className="text-[#004D31] dark:text-[#B2D235]" size={18} />
                      <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">{t('profile')}</h2>
                    </div>

                    <div className="space-y-2">
                      <label className="font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">
                        {t('nickname')}
                      </label>
                      <input 
                        type="text" 
                        required
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        disabled={loadingProfile}
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                        placeholder={loadingProfile ? "Carregando..." : "Seu nickname / nome"}
                      />
                      <p className="text-[10px] text-gray-400 dark:text-gray-550">
                        Este nome será utilizado na capa comercial das propostas (SaaS) como o nome do representante.
                      </p>
                    </div>
                  </div>

                  {/* Themes Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-850/50">
                      <Moon className="text-[#004D31] dark:text-[#B2D235]" size={18} />
                      <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">{t('theme')}</h2>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {['light', 'dark', 'ecocarga'].map(tKey => (
                        <button
                          key={tKey}
                          type="button"
                          onClick={() => setLocalTheme(tKey as any)}
                          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold text-xs cursor-pointer ${
                            localTheme === tKey 
                              ? 'border-[#004D31] dark:border-[#B2D235] bg-[#004D31]/5 dark:bg-[#B2D235]/5 text-[#004D31] dark:text-[#B2D235]' 
                              : 'border-border hover:border-gray-200 dark:hover:border-slate-700 text-gray-400 dark:text-gray-500'
                          }`}
                        >
                          {tKey === 'light' ? <Sun size={18} /> : tKey === 'dark' ? <Moon size={18} /> : <Sparkles size={18} />}
                          {tKey === 'light' ? t('themeLight') : tKey === 'dark' ? t('themeDark') : t('themeEcocarga')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-850/50">
                      <Globe className="text-[#004D31] dark:text-[#B2D235]" size={18} />
                      <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">{t('language')}</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setLocalLanguage('pt')}
                        className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold text-sm cursor-pointer ${
                          localLanguage === 'pt' 
                            ? 'border-[#004D31] dark:border-[#B2D235] bg-[#004D31]/5 dark:bg-[#B2D235]/5 text-[#004D31] dark:text-[#B2D235]' 
                            : 'border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 text-gray-550 dark:text-gray-450'
                        }`}
                      >
                        🇧🇷 {t('langPt')}
                      </button>

                      <button
                        type="button"
                        onClick={() => setLocalLanguage('en')}
                        className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold text-sm cursor-pointer ${
                          localLanguage === 'en' 
                            ? 'border-[#004D31] dark:border-[#B2D235] bg-[#004D31]/5 dark:bg-[#B2D235]/5 text-[#004D31] dark:text-[#B2D235]' 
                            : 'border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 text-gray-550 dark:text-gray-450'
                        }`}
                      >
                        🇺🇸 {t('langEn')}
                      </button>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-6 border-t border-gray-100 dark:border-slate-850/50 flex items-center justify-between mt-auto">
                    <div>
                      {success && (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                          <CheckCircle size={16} />
                          {t('saveSuccess')}
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-[#004D31] dark:bg-[#B2D235] text-white dark:text-[#004D31] px-6 py-2.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-55"
                    >
                      {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                      {saving ? t('saving') : t('save')}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: WHITE-LABEL REVENDAS (Epic 4.4) */}
              {/* ========================================================================= */}
              {activeTab === 'whitelabel' && (
                <motion.div 
                  key="whitelabel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 text-xs flex-1"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-850/50">
                    <div className="flex items-center gap-2">
                      <Palette className="text-[#004D31] dark:text-[#B2D235]" size={18} />
                      <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Customização White-Label</h2>
                    </div>
                    <span className="text-[9px] font-black text-primary bg-primary/10 dark:text-accent dark:bg-accent/10 px-2 py-0.5 rounded-full">Multi-Tenant Ativo</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Form fields (Left 3 cols) */}
                    <div className="lg:col-span-3 space-y-4">
                      
                      {/* Logo Mock Uploader */}
                      <div className="space-y-1">
                        <label className="font-bold text-gray-400 uppercase">Logomarca da Revenda</label>
                        <div className="p-4 border border-dashed border-gray-250 dark:border-slate-800 bg-gray-50/20 dark:bg-slate-950 rounded-2xl flex items-center justify-between gap-4">
                          {logoUploaded ? (
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <Check size={20} />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white">logo_revenda_vetor.png</p>
                                <span className="text-[9px] text-gray-400">Dimensões ideais (120x120px)</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Upload className="text-gray-400" size={18} />
                              <span className="text-gray-400 font-medium">Nenhuma logo enviada. Usando EcoCarga global.</span>
                            </div>
                          )}

                          <button
                            onClick={handleSimulateLogoUpload}
                            disabled={uploadingLogo}
                            className="bg-neutral-900 hover:bg-neutral-850 text-white dark:bg-slate-800 dark:hover:bg-slate-750 px-4 py-2 rounded-xl font-bold transition-all text-[10px] cursor-pointer disabled:opacity-50"
                          >
                            {uploadingLogo ? 'Enviando...' : 'Fazer Upload'}
                          </button>
                        </div>
                      </div>

                      {/* Brand colors pickers */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-bold text-gray-400 uppercase">Cor Primária (Hex)</label>
                          <div className="flex gap-2">
                            <input 
                              type="color" 
                              value={primaryColor}
                              onChange={(e) => setPrimaryColor(e.target.value)}
                              className="w-10 h-10 rounded-lg border border-gray-200 dark:border-slate-800 cursor-pointer bg-transparent p-0.5"
                            />
                            <input 
                              type="text" 
                              value={primaryColor}
                              onChange={(e) => setPrimaryColor(e.target.value)}
                              className="flex-1 px-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none uppercase font-mono font-bold"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-gray-400 uppercase">Cor Secundária (Hex)</label>
                          <div className="flex gap-2">
                            <input 
                              type="color" 
                              value={secondaryColor}
                              onChange={(e) => setSecondaryColor(e.target.value)}
                              className="w-10 h-10 rounded-lg border border-gray-200 dark:border-slate-800 cursor-pointer bg-transparent p-0.5"
                            />
                            <input 
                              type="text" 
                              value={secondaryColor}
                              onChange={(e) => setSecondaryColor(e.target.value)}
                              className="flex-1 px-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none uppercase font-mono font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Custom domains config */}
                      <div className="space-y-1">
                        <label className="font-bold text-gray-400 uppercase">Domínio / CNAME Customizado</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={customDomain}
                            onChange={(e) => setCustomDomain(e.target.value)}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none"
                          />
                          <button
                            onClick={handleVerifyDomainSSL}
                            disabled={sslChecking}
                            className="bg-neutral-900 hover:bg-neutral-850 text-white px-4 rounded-xl font-bold transition-all text-[10px] cursor-pointer flex items-center gap-1.5"
                          >
                            {sslChecking ? 'Verificando...' : <><Link2 size={12} /> Testar DNS</>}
                          </button>
                        </div>
                        
                        {/* Domain validation warnings */}
                        {sslStatus === 'valid' && (
                          <p className="text-[10px] text-emerald-550 font-bold flex items-center gap-1">
                            <CheckCircle size={12} />
                            SSL Ativo. Domínio apontado corretamente para o cluster EcoCarga!
                          </p>
                        )}
                      </div>

                      {/* Catalog Items checklist */}
                      <div className="space-y-2 pt-2">
                        <label className="font-bold text-gray-400 uppercase block">Catálogo Independente (Revendedor)</label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries({
                            ac7: 'Wallbox AC 7.4kW',
                            ac22: 'Wallbox AC Pro 22kW',
                            dc50: 'Fast Charger DC 50kW',
                            dc150: 'Highway Ultra DC 150kW'
                          }).map(([key, label]) => (
                            <label 
                              key={key}
                              className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-55 dark:border-slate-850 bg-gray-50/10 hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                            >
                              <input 
                                type="checkbox" 
                                checked={catalogItems[key as keyof typeof catalogItems]}
                                onChange={() => setCatalogItems({ ...catalogItems, [key]: !catalogItems[key as keyof typeof catalogItems] })}
                                className="rounded text-[#004D31]"
                              />
                              <span className="font-bold text-gray-800 dark:text-slate-200">{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Preview Live Mockup (Right 2 cols) */}
                    <div className="lg:col-span-2 space-y-3">
                      <span className="font-bold text-gray-400 uppercase block">Visualização em Tempo Real</span>
                      
                      {/* Proposal Sidebar live mockup */}
                      <div className="border border-gray-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs h-[280px] bg-neutral-950 flex flex-col justify-between p-4 font-sans text-[10px]">
                        {/* Fake Sidebar logo area */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] text-white"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {logoUploaded ? 'L' : 'EC'}
                            </div>
                            <div>
                              <span className="font-black text-white leading-none block">Logo Revenda</span>
                              <span className="text-[7px] text-neutral-500 font-bold block">parceiro.ecocarga.com.br</span>
                            </div>
                          </div>

                          {/* Fake Navs */}
                          <div className="space-y-1">
                            <div 
                              className="px-3 py-1.5 rounded-lg font-bold flex items-center justify-between"
                              style={{ backgroundColor: `${primaryColor}22`, color: primaryColor }}
                            >
                              <span>Dashboard Central</span>
                              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: secondaryColor }} />
                            </div>
                            <div className="px-3 py-1.5 text-neutral-500 font-bold">
                              <span>Propostas Comerciais</span>
                            </div>
                            <div className="px-3 py-1.5 text-neutral-500 font-bold">
                              <span>Clientes & Fichas</span>
                            </div>
                          </div>
                        </div>

                        {/* Fake Action Button */}
                        <div className="space-y-2">
                          <div className="h-0.5 bg-neutral-900 w-full" />
                          <button 
                            type="button"
                            className="w-full text-center py-2 rounded-lg font-black"
                            style={{ backgroundColor: secondaryColor, color: primaryColor }}
                          >
                            Nova Proposta
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-6 border-t border-gray-100 dark:border-slate-850/50 flex items-center justify-between mt-auto">
                    <div>
                      {success && (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                          <CheckCircle size={16} />
                          Branding e catálogos de revenda atualizados com sucesso!
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveExtended}
                      disabled={saving}
                      className="bg-[#004D31] dark:bg-[#B2D235] text-white dark:text-[#004D31] px-6 py-2.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-55"
                    >
                      {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                      {saving ? 'Gravando...' : 'Salvar White-Label'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ========================================================================= */}
              {/* TAB 3: INTEGRAÇÕES ERP & COBRANÇA (Epics 4.1 & 4.2) */}
              {/* ========================================================================= */}
              {activeTab === 'integracoes' && (
                <motion.div 
                  key="integracoes"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8 text-xs flex-1"
                >
                  {/* ERP Integration details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-850/50">
                      <Building className="text-[#004D31] dark:text-[#B2D235]" size={18} />
                      <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Integração ERP Nacional (Epic 4.1)</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Select ERP */}
                      <div className="space-y-1">
                        <label className="font-bold text-gray-400 uppercase">Selecione o ERP Corporativo</label>
                        <select
                          value={erpSelect}
                          onChange={(e) => setErpSelect(e.target.value as 'bling' | 'omie')}
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none"
                        >
                          <option value="bling">Bling ERP (Básico / MPE)</option>
                          <option value="omie">Omie ERP (Enterprise / Completo)</option>
                        </select>
                      </div>

                      {/* Auto Nfe trigger */}
                      <div className="p-4 rounded-2xl border border-gray-55 dark:border-slate-850 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-gray-800 dark:text-slate-200">Emissão de NF-e Automática</span>
                          <p className="text-[10px] text-gray-400">Emite nota ao aprovar a proposta no CRM.</p>
                        </div>
                        <button 
                          onClick={() => setAutoNfe(!autoNfe)}
                          className="text-primary dark:text-accent cursor-pointer"
                        >
                          {autoNfe ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                        </button>
                      </div>

                      {/* Sync clients */}
                      <div className="p-4 rounded-2xl border border-gray-55 dark:border-slate-850 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-gray-800 dark:text-slate-200">Sincronização de Clientes</span>
                          <p className="text-[10px] text-gray-400">Sincroniza automaticamente contatos e CNPJ.</p>
                        </div>
                        <button 
                          onClick={() => setSyncClients(!syncClients)}
                          className="text-primary dark:text-accent cursor-pointer"
                        >
                          {syncClients ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Payment gateway options */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-850/50">
                      <CreditCard className="text-[#004D31] dark:text-[#B2D235]" size={18} />
                      <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Cobrança Integrada Pix + Boleto (Epic 4.2)</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Select gateway */}
                      <div className="space-y-1">
                        <label className="font-bold text-gray-400 uppercase">Processador / Gateway Financeiro</label>
                        <select
                          value={gatewaySelect}
                          onChange={(e) => setGatewaySelect(e.target.value as 'asaas' | 'pagarme')}
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none"
                        >
                          <option value="asaas">Asaas Pagamentos (Recomendado)</option>
                          <option value="pagarme">Pagar.me (Grupo Stone)</option>
                        </select>
                      </div>

                      {/* Pix instant toggle */}
                      <div className="p-4 rounded-2xl border border-gray-55 dark:border-slate-850 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-gray-800 dark:text-slate-200">Chave Pix Imediata</span>
                          <p className="text-[10px] text-gray-400">Gera copia-e-cola imediato no aceite do cliente.</p>
                        </div>
                        <button 
                          onClick={() => setPixInstant(!pixInstant)}
                          className="text-primary dark:text-accent cursor-pointer"
                        >
                          {pixInstant ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                        </button>
                      </div>

                      {/* Allow Installments toggle */}
                      <div className="p-4 rounded-2xl border border-gray-55 dark:border-slate-850 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-gray-800 dark:text-slate-200">Boleto Parcelado</span>
                          <p className="text-[10px] text-gray-400">Permite parcelamento de até 12x no boleto.</p>
                        </div>
                        <button 
                          onClick={() => setAllowInstallments(!allowInstallments)}
                          className="text-primary dark:text-accent cursor-pointer"
                        >
                          {allowInstallments ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-6 border-t border-gray-100 dark:border-slate-850/50 flex items-center justify-between mt-auto">
                    <div>
                      {success && (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                          <CheckCircle size={16} />
                          Configuração de ERP e processador financeiro salva com sucesso!
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveExtended}
                      disabled={saving}
                      className="bg-[#004D31] dark:bg-[#B2D235] text-white dark:text-[#004D31] px-6 py-2.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-55"
                    >
                      {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                      {saving ? 'Gravando...' : 'Salvar Integrações'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ========================================================================= */}
              {/* TAB 4: SEGURANÇA E PERMISSÕES (Original AdminPermissions) */}
              {/* ========================================================================= */}
              {activeTab === 'permissoes' && (
                <motion.div 
                  key="permissoes"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 text-xs flex-1"
                >
                  {profile?.role === 'admin' ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-850/50">
                        <Shield className="text-[#004D31] dark:text-[#B2D235]" size={18} />
                        <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Gestão de Permissões Corporativas</h2>
                      </div>
                      <AdminPermissions />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-850/50">
                        <Shield className="text-[#004D31] dark:text-[#B2D235]" size={18} />
                        <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Solicitar Acesso de Administrador</h2>
                      </div>

                      <p className="text-xs text-gray-500 dark:text-slate-450 leading-relaxed">
                        Digite a Chave Mestra Corporativa para promover sua conta a Administrador. Isso liberará acesso aos painéis de Templates, Modelos de Carregadores e permissões de vendedores.
                      </p>

                      <form onSubmit={handleRequestAdmin} className="space-y-4">
                        <div className="space-y-1">
                          <label className="font-bold text-gray-400 dark:text-gray-555 uppercase ml-1 block">
                            Chave Mestra Corporativa
                          </label>
                          <input 
                            type="password" 
                            required
                            value={promotionKey}
                            onChange={(e) => setPromotionKey(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-gray-950 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004D31]/10 transition-all text-sm"
                            placeholder="••••••••••••"
                          />
                        </div>

                        {promoteError && (
                          <div className="text-xs text-red-500 font-semibold bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-3 flex items-center gap-2">
                            <AlertCircle size={14} />
                            {promoteError}
                          </div>
                        )}

                        {promoteSuccess && (
                          <div className="text-xs text-emerald-650 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl p-3 flex items-center gap-2">
                            <CheckCircle size={14} />
                            {promoteSuccess}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={promoting || !promotionKey}
                          className="bg-[#004D31] text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 text-sm shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {promoting ? <Loader2 className="animate-spin" size={16} /> : <Shield size={16} />}
                          {promoting ? 'Promovendo...' : 'Solicitar Acesso Admin'}
                        </button>
                      </form>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </main>
    </div>
  );
}

// NavItem local rendering helper (keeps original compatibility)
function NavItem({ icon: Icon, label, active = false, href }: { icon: any, label: string, active?: boolean, href: string }) {
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

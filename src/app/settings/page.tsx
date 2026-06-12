"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Settings, 
  User, 
  Globe, 
  Moon, 
  Sun, 
  Save, 
  Loader2, 
  CheckCircle,
  FileText,
  Users,
  LayoutDashboard,
  LogOut,
  Cpu,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function SettingsPage() {
  const { theme, setTheme, language, setLanguage, profile, updateNickname, t } = useApp();
  const router = useRouter();

  const [nickname, setNickname] = useState('');
  const [localTheme, setLocalTheme] = useState(theme);
  const [localLanguage, setLocalLanguage] = useState(language);
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      // 1. Update theme
      setTheme(localTheme);
      
      // 2. Update language
      setLanguage(localLanguage);

      // 3. Update nickname in Supabase profiles
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] flex flex-col fixed h-full z-20 transition-colors duration-300">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <img src="/ecocarga-logo-small.png" alt="EcoCarga" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold tracking-tight text-[var(--sidebar-text-active)]">Kepler's Proposal</span>
          </div>

          <nav className="space-y-1">
            <NavItem icon={LayoutDashboard} label={t('dashboard')} href="/" />
            <NavItem icon={FileText} label={t('proposals')} href="#" />
            <NavItem icon={Users} label={t('clients')} href="#" />
            <NavItem icon={Cpu} label={t('chargers')} href="/models" />
            <NavItem icon={Settings} label={t('templates')} href="/templates" />
            <NavItem icon={Settings} label={t('settings')} href="/settings" active />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-[var(--sidebar-border)]">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-8 h-8 rounded-full bg-[var(--sidebar-nav-hover-bg)] flex items-center justify-center text-xs font-bold text-[var(--sidebar-nav-text)]">
              {profile?.full_name?.substring(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-[var(--sidebar-text-active)] truncate">{profile?.full_name}</p>
              <p className="text-xs text-[var(--sidebar-nav-text)] truncate">Plano Pro</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-2 py-2 text-[var(--sidebar-nav-text)] hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut size={20} />
            <span className="font-medium">{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col ml-64 min-h-screen">
        {/* Header */}
        <header className="h-16 bg-background/80 backdrop-blur-md border-b border-border px-8 flex items-center justify-between sticky top-0 z-10 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="p-2 hover:bg-[var(--sidebar-nav-hover-bg)] rounded-lg transition-colors text-[var(--sidebar-nav-text)] cursor-pointer">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-foreground">{t('settings')}</h1>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-3xl mx-auto w-full space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-8 space-y-6 transition-colors duration-300"
          >
            <form onSubmit={handleSave} className="space-y-8">
              {/* SECTION: PROFILE */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-800">
                  <User className="text-primary dark:text-accent" size={20} />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('profile')}</h2>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">
                    {t('nickname')}
                  </label>
                  <input 
                    type="text" 
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    disabled={loadingProfile}
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-gray-950 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/10 dark:focus:ring-accent/10 transition-all text-sm"
                    placeholder={loadingProfile ? "Carregando..." : "Seu nickname / nome"}
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Este nome será utilizado na capa comercial das propostas (SaaS) como o nome do representante.
                  </p>
                </div>
              </div>

              {/* SECTION: APPEARANCE (THEME) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-800">
                  <Moon className="text-primary dark:text-accent" size={20} />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('theme')}</h2>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setLocalTheme('light')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold text-xs ${
                      localTheme === 'light' 
                        ? 'border-primary dark:border-accent bg-primary/5 dark:bg-accent/5 text-primary dark:text-accent' 
                        : 'border-border hover:border-gray-200 dark:hover:border-slate-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <Sun size={20} />
                    {t('themeLight')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setLocalTheme('dark')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold text-xs ${
                      localTheme === 'dark' 
                        ? 'border-primary dark:border-accent bg-primary/5 dark:bg-accent/5 text-primary dark:text-accent' 
                        : 'border-border hover:border-gray-200 dark:hover:border-slate-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <Moon size={20} />
                    {t('themeDark')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setLocalTheme('ecocarga')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold text-xs ${
                      localTheme === 'ecocarga' 
                        ? 'border-primary dark:border-accent bg-primary/5 dark:bg-accent/5 text-primary dark:text-accent' 
                        : 'border-border hover:border-gray-200 dark:hover:border-slate-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <Sparkles size={20} />
                    {t('themeEcocarga')}
                  </button>
                </div>
              </div>

              {/* SECTION: LANGUAGE */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-800">
                  <Globe className="text-primary dark:text-accent" size={20} />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('language')}</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setLocalLanguage('pt')}
                    className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                      localLanguage === 'pt' 
                        ? 'border-primary dark:border-accent bg-primary/5 dark:bg-accent/5 text-primary dark:text-accent' 
                        : 'border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    🇧🇷 {t('langPt')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setLocalLanguage('en')}
                    className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                      localLanguage === 'en' 
                        ? 'border-primary dark:border-accent bg-primary/5 dark:bg-accent/5 text-primary dark:text-accent' 
                        : 'border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    🇺🇸 {t('langEn')}
                  </button>
                </div>
              </div>

              {/* TOAST AND ACTIONS */}
              <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  {success && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm"
                    >
                      <CheckCircle size={18} />
                      {t('saveSuccess')}
                    </motion.div>
                  )}
                  {error && (
                    <div className="text-red-500 dark:text-red-400 font-bold text-sm">
                      {error}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="px-6 py-2.5 rounded-xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-primary dark:bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 text-sm shadow-sm"
                  >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {saving ? t('saving') : t('save')}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

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

"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Loader2, 
  ArrowLeft,
  Search,
  CheckCircle2,
  FileText,
  Users,
  Settings,
  LayoutDashboard,
  LogOut,
  Sliders,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import AppSidebar from '@/components/AppSidebar';

export default function ModelsPage() {
  const { profile, t } = useApp();
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [power, setPower] = useState('');
  const [price, setPrice] = useState('');
  const [powerSource, setPowerSource] = useState('3F+N+T');
  const [connectors, setConnectors] = useState('1');
  const [connectorType, setConnectorType] = useState('CCS2');
  const [communication, setCommunication] = useState('Bluetooth/Wi-Fi/Ethernet/RFID/4G');
  const [modelName, setModelName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchModelsAndUser();
  }, []);

  const fetchModelsAndUser = async () => {
    setLoading(true);
    try {
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Fetch models (both global and own user models)
      const { data: modelsData, error } = await supabase
        .from('charger_models')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setModels(modelsData || []);
    } catch (err) {
      console.error('Error fetching models:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setName('');
    setPower('');
    setPrice('');
    setPowerSource('3F+N+T');
    setConnectors('1');
    setConnectorType('CCS2');
    setCommunication('Bluetooth/Wi-Fi/Ethernet/RFID/4G');
    setModelName('');
    setImageUrl('');
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (model: any) => {
    if (!model.user_id) {
      alert('Modelos de sistema padrão (fábrica) não podem ser editados.');
      return;
    }
    setEditingId(model.id);
    setName(model.name);
    setPower(model.power);
    setPrice(model.price.toString());
    setPowerSource(model.power_source);
    setConnectors(model.connectors.toString());
    setConnectorType(model.connector_type);
    setCommunication(model.communication);
    setModelName(model.model_name);
    setImageUrl(model.image_url || '');
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, isGlobal: boolean) => {
    if (isGlobal) {
      alert('Modelos de sistema padrão (fábrica) não podem ser excluídos.');
      return;
    }
    if (!confirm('Deseja realmente excluir este modelo de carregador?')) return;

    try {
      const { error } = await supabase
        .from('charger_models')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setModels(models.filter(m => m.id !== id));
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir modelo.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    try {
      let uploadedImageUrl = imageUrl;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${userId}/${Math.random()}.${fileExt}`;
        const filePath = `chargers/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('templates')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('templates')
          .getPublicUrl(filePath);
          
        uploadedImageUrl = publicUrl;
      }

      const payload: any = {
        user_id: userId,
        name,
        power,
        price: parseFloat(price.replace(',', '.')) || 0,
        power_source: powerSource,
        connectors: parseInt(connectors),
        connector_type: connectorType,
        communication,
        model_name: modelName,
        image_url: uploadedImageUrl
      };

      if (editingId) {
        // Edit mode
        const { error } = await supabase
          .from('charger_models')
          .update(payload)
          .eq('id', editingId)
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        // Add mode
        const { error } = await supabase
          .from('charger_models')
          .insert(payload);
        
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchModelsAndUser();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar modelo.');
    } finally {
      setSaving(false);
    }
  };

  // Filter models based on search term
  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.model_name.toLowerCase().includes(search.toLowerCase()) ||
    m.power.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50/50 dark:bg-slate-950 transition-colors duration-300">
      <AppSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col ml-64 min-h-screen">
        {/* Header */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-10 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('chargers')}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder={t('searchModels')} 
                className="pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-800 rounded-full bg-gray-50/50 dark:bg-slate-950 text-gray-950 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/10 w-64 text-sm transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button 
              onClick={handleOpenAddModal}
              className="bg-primary text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm active:scale-95 text-sm"
            >
              <Plus size={20} />
              {t('addCharger')}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-primary dark:text-accent" size={40} />
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
              <Cpu className="text-gray-200 dark:text-slate-750 mb-4" size={64} />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('noChargers')}</h2>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredModels.map((m) => {
                const isGlobal = m.user_id === null;
                return (
                  <motion.div 
                    key={m.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow relative"
                  >
                    {/* Header Card - Eco Background style with charger graphics */}
                    <div className="p-6 bg-gradient-to-br from-green-950 to-green-900 text-white relative h-56 flex flex-col justify-between overflow-hidden">
                      <div className="absolute top-4 right-4 z-10">
                        {isGlobal ? (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[9px] font-bold">
                            {t('systemModel')}
                          </span>
                        ) : (
                          <span className="bg-primary/50 text-accent border border-accent/30 px-2 py-0.5 rounded-full text-[9px] font-bold">
                            {t('customModel')}
                          </span>
                        )}
                      </div>
                      
                      {/* Product Content (Z-10) */}
                      <div className="z-10 max-w-[60%] flex flex-col h-full justify-between">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <h3 className="text-xl font-black leading-tight">{m.name}</h3>
                            <span className="text-[10px] font-black text-accent bg-accent/15 px-1.5 py-0.5 rounded-md">{m.power}</span>
                          </div>
                          <p className="text-[10px] text-gray-300 mt-1 uppercase tracking-wider font-bold truncate">{m.model_name}</p>
                        </div>
                        
                        <div className="mt-auto">
                          <span className="text-[10px] text-gray-400 block">{t('startingFrom')}</span>
                          <span className="text-xl font-black text-white">
                            R$ {m.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Charger Render (SVG Totem or Uploaded PNG/JPG) */}
                      <div className="absolute right-0 bottom-0 w-36 h-48 z-0 pointer-events-none flex items-center justify-center">
                        {m.image_url ? (
                          <img 
                            src={m.image_url} 
                            alt={m.name} 
                            className="w-full h-full object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] translate-y-4 translate-x-2" 
                          />
                        ) : (
                          /* Totem Vector Mockup fallback */
                          <svg className="w-full h-full opacity-85 translate-y-6" viewBox="0 0 200 350" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="85" y="160" width="30" height="190" fill="#717a82" />
                            <rect x="80" y="325" width="40" height="10" fill="#4d5359" />
                            <rect x="80" y="200" width="40" height="6" fill="#4d5359" rx="2" />
                            <path d="M78 203C70 203 70 310 95 310C120 310 120 203 112 203C104 203 72 230 72 260C72 290 120 290 120 250" stroke="#1c1e21" strokeWidth="12" strokeLinecap="round" fill="none" />
                            <rect x="65" y="30" width="70" height="140" rx="14" fill="#f4f6f7" stroke="#cbd5e1" strokeWidth="3" />
                            <path d="M65 44C65 36.268 71.268 30 79 30H79.5V170H79C71.268 170 65 163.732 65 156V44Z" fill="#1c1e21" />
                            <path d="M120.5 30H121C128.732 30 135 36.268 135 44V156C135 163.732 128.732 170 121 170H120.5V30Z" fill="#B2D235" />
                            <rect x="75" y="45" width="22" height="45" rx="3" fill="#1c1e21" />
                            <circle cx="82" cy="75" r="3" fill="#34d399" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Specs Details */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <SpecLine label={t('powerSource')} value={m.power_source} />
                        <SpecLine label={t('connectors')} value={m.connectors} />
                        <SpecLine label={t('connectorType')} value={m.connector_type} />
                        <SpecLine label={t('communication')} value={m.communication} />
                      </div>

                      {/* Actions */}
                      <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-2">
                        {!isGlobal ? (
                          <>
                            <button 
                              onClick={() => handleOpenEditModal(m)}
                              className="p-2 text-gray-400 hover:text-primary dark:hover:text-accent hover:bg-primary/5 dark:hover:bg-accent/5 rounded-xl transition-all"
                              title={t('save')}
                            >
                              <Edit3 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(m.id, isGlobal)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                              title={t('delete')}
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-slate-500 font-medium italic">{t('protectedModel')}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* CRUD Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 flex flex-col max-h-[90vh] transition-colors duration-300"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingId ? t('editCharger') : t('addCharger')}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-white font-bold"
                >
                  {t('close')}
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">{t('chargerName')}</label>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-gray-950 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                      placeholder="Eco SuperFast"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">{t('chargerPower')}</label>
                    <input 
                      type="text" 
                      required
                      value={power}
                      onChange={(e) => setPower(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-gray-950 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                      placeholder="40kW"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">{t('chargerPrice')}</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-gray-950 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                      placeholder="30966.36"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">{t('chargerModel')}</label>
                    <input 
                      type="text" 
                      required
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-gray-950 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                      placeholder="Rise Superfast"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">{t('powerSource')}</label>
                    <input 
                      type="text" 
                      required
                      value={powerSource}
                      onChange={(e) => setPowerSource(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-gray-950 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                      placeholder="3F+N+T"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">{t('connectors')}</label>
                    <input 
                      type="number" 
                      required
                      value={connectors}
                      onChange={(e) => setConnectors(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-gray-950 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                      placeholder="1"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">{t('connectorType')}</label>
                    <input 
                      type="text" 
                      required
                      value={connectorType}
                      onChange={(e) => setConnectorType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-gray-950 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                      placeholder="CCS2"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">{t('communication')}</label>
                    <input 
                      type="text" 
                      required
                      value={communication}
                      onChange={(e) => setCommunication(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-gray-950 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                      placeholder="Bluetooth/Wi-Fi/RFID"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2 border-t border-gray-100 dark:border-slate-800 pt-3 mt-1">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">{t('chargerPhoto')}</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setImageFile(file);
                        }}
                        className="flex-1 px-4 py-2 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-gray-950 dark:text-white focus:bg-white focus:outline-none text-xs cursor-pointer"
                      />
                      {imageUrl && !imageFile && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 dark:border-slate-800 flex-shrink-0 flex items-center justify-center bg-gray-50 dark:bg-slate-950">
                          <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                        </div>
                      )}
                      {imageFile && (
                        <span className="text-[10px] font-bold text-primary dark:text-accent truncate max-w-[150px] bg-primary/5 dark:bg-accent/5 px-2.5 py-1 rounded-md">
                          {imageFile.name} (Pronto)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 text-sm"
                  >
                    {saving && <Loader2 className="animate-spin" size={18} />}
                    {saving ? t('saving') : t('save')}
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

function NavItem({ icon: Icon, label, active = false, href }: { icon: any, label: string, active?: boolean, href: string }) {
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

function SpecLine({ label, value }: { label: string, value: any }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-gray-400 dark:text-slate-500 font-medium">{label}</span>
      <span className="text-gray-700 dark:text-slate-200 font-bold max-w-[60%] truncate text-right">{value}</span>
    </div>
  );
}

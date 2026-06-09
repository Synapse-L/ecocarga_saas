"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  Trash2, 
  Upload, 
  Loader2, 
  ArrowLeft,
  Search,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function TemplatesPage() {
  const { t } = useApp();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('templates').select('*').order('created_at', { ascending: false });
      setTemplates(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Upload directly to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('templates')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('templates')
        .getPublicUrl(fileName);

      // 3. Save to Table
      const { error: dbError } = await supabase.from('templates').insert({
        user_id: user.id,
        name: file.name.replace('.pdf', ''),
        file_url: publicUrl,
        is_default: templates.length === 0
      });

      if (dbError) throw dbError;

      fetchTemplates();
    } catch (err) {
      console.error(err);
      alert('Erro ao fazer upload do template');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    if (!confirm(t('confirmDeleteTemplate'))) return;

    try {
      // 1. Delete from storage (simplified path extraction)
      // Note: Ideally extract exact path from URL
      
      // 2. Delete from DB
      await supabase.from('templates').delete().eq('id', id);
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-10 transition-colors duration-300">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('manageTemplates')}</h1>
        </div>

        <div className="relative">
          <input 
            type="file" 
            id="template-upload" 
            className="hidden" 
            accept=".pdf"
            onChange={handleUpload}
            disabled={uploading}
          />
          <label 
            htmlFor="template-upload"
            className="bg-primary text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm active:scale-95 cursor-pointer text-sm"
          >
            {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
            {t('uploadPdf')}
          </label>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary dark:text-accent" size={40} />
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
            <FileText className="text-gray-200 dark:text-slate-800 mb-4" size={64} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('emptyTemplates')}</h2>
            <p className="text-gray-500 dark:text-slate-400 mt-2">{t('uploadFirstTemplate')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {templates.map((tItem) => (
                <motion.div 
                  key={tItem.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
                >
                  <div className="h-48 bg-gray-50 dark:bg-slate-950 flex items-center justify-center relative border-b border-gray-50 dark:border-slate-800">
                    <FileText className="text-gray-200 dark:text-slate-800" size={60} />
                    {tItem.is_default && (
                      <div className="absolute top-3 left-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-emerald-500/10">
                        <CheckCircle2 size={12} /> {t('defaultTemplate')}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate mb-1">{tItem.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">Adicionado em {new Date(tItem.created_at).toLocaleDateString()}</p>
                    
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => window.open(tItem.file_url, '_blank')}
                        className="text-xs font-bold text-primary dark:text-accent hover:underline"
                      >
                        {t('viewOriginal')}
                      </button>
                      <button 
                        onClick={() => handleDelete(tItem.id, tItem.file_url)}
                        className="p-2 text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

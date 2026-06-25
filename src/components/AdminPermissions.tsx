"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, User, RefreshCw, Search, Check, AlertCircle, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function AdminPermissions() {
  const { profile } = useApp();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar perfis:', err);
      setMessage({ text: 'Não foi possível carregar a lista de usuários. Verifique se você é um administrador.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchProfiles();
    }
  }, [profile]);

  const handleToggleRole = async (userId: string, currentRole: string) => {
    // Evita que o administrador remova sua própria permissão acidentalmente
    if (userId === profile?.id) {
      setMessage({ text: 'Você não pode alterar seu próprio nível de acesso para evitar o bloqueio de sua conta.', type: 'error' });
      return;
    }

    setUpdatingId(userId);
    setMessage(null);
    const newRole = currentRole === 'admin' ? 'vendedor' : 'admin';

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
      setMessage({ text: `Permissão atualizada com sucesso! Nível alterado para ${newRole.toUpperCase()}.`, type: 'success' });
    } catch (err: any) {
      console.error('Erro ao atualizar permissão:', err);
      setMessage({ text: 'Erro ao atualizar permissão no banco de dados.', type: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtrar perfis com base na barra de pesquisa
  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (profile?.role !== 'admin') {
    return (
      <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-3xl p-6 flex items-start gap-4 max-w-2xl mx-auto">
        <AlertCircle className="text-red-500 flex-shrink-0 mt-1" size={24} />
        <div>
          <h3 className="text-lg font-bold text-red-900 dark:text-red-300">Acesso Restrito</h3>
          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
            Esta área é exclusiva para administradores da plataforma. Se você precisa de privilégios de administrador, solicite acesso ao gerente de TI usando a chave mestra corporativa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Shield size={24} className="text-[#004D31] dark:text-[#B2D235]" />
            Gerenciamento de Permissões
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Controle quem é Administrador e quem é Vendedor no SaaS EcoCarga.
          </p>
        </div>
        <button
          onClick={fetchProfiles}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 transition-all border border-gray-100 dark:border-slate-700 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar Lista
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 justify-between ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-300' 
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-300'
        }`}>
          <div className="flex items-start gap-2.5">
            {message.type === 'success' ? <Check size={18} className="mt-0.5" /> : <AlertCircle size={18} className="mt-0.5" />}
            <p className="text-sm font-semibold">{message.text}</p>
          </div>
          <button onClick={() => setMessage(null)} className="p-0.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Barra de Pesquisa */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Pesquisar vendedor por nome, empresa ou nível..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#004D31] dark:focus:ring-[#B2D235] transition-all text-gray-900 dark:text-white"
        />
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <RefreshCw size={36} className="text-[#004D31] dark:text-[#B2D235] animate-spin" />
            <p className="text-sm text-gray-500">Buscando perfis no Supabase...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nenhum usuário encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 tracking-wider">Usuário</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 tracking-wider">Empresa</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 tracking-wider">Onboarding</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 tracking-wider">Nível de Acesso</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {filteredProfiles.map((userProfile) => (
                  <tr key={userProfile.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[#004D31] dark:text-[#B2D235]">
                          {userProfile.full_name?.substring(0, 2).toUpperCase() || 'US'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {userProfile.full_name} {userProfile.id === profile?.id && <span className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-500 px-2 py-0.5 rounded-full ml-1 font-normal">Você</span>}
                          </p>
                          <p className="text-xs text-gray-400 truncate max-w-[200px]" title={userProfile.id}>
                            ID: {userProfile.id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                      {userProfile.company_name || 'EcoCarga'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        userProfile.completed_tour
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}>
                        {userProfile.completed_tour ? 'Concluído' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        userProfile.role === 'admin'
                          ? 'bg-[#004D31]/10 text-[#004D31] dark:bg-[#B2D235]/10 dark:text-[#B2D235]'
                          : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {userProfile.role === 'admin' ? (
                          <>
                            <Shield size={12} />
                            Admin
                          </>
                        ) : (
                          <>
                            <User size={12} />
                            Vendedor
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleRole(userProfile.id, userProfile.role)}
                        disabled={updatingId === userProfile.id || userProfile.id === profile?.id}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          userProfile.role === 'admin'
                            ? 'bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400'
                            : 'bg-[#004D31] hover:opacity-90 text-white shadow-sm shadow-[#004D31]/10'
                        }`}
                      >
                        {updatingId === userProfile.id ? (
                          <span className="flex items-center gap-1 justify-center">
                            <RefreshCw size={12} className="animate-spin" />
                            Aguarde...
                          </span>
                        ) : userProfile.role === 'admin' ? (
                          'Tornar Vendedor'
                        ) : (
                          'Tornar Admin'
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

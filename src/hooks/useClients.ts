"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Client, ClientInsert } from '@/types/client';

interface UseClientsReturn {
  clients: Client[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createClient: (data: Omit<ClientInsert, 'user_id'>) => Promise<Client | null>;
  updateClient: (id: string, data: Partial<Client>) => Promise<boolean>;
  deleteClient: (id: string) => Promise<boolean>;
}

export function useClients(): UseClientsReturn {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      // Fetch clients with their linked proposals for stats
      const [clientsRes, proposalsRes] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('proposals')
          .select('id, client_id, title, status, created_at, updated_at, commercial_data')
          .eq('user_id', user.id),
      ]);

      if (clientsRes.error) throw clientsRes.error;

      const dbClients = clientsRes.data ?? [];
      const dbProposals = proposalsRes.data ?? [];

      // Map and enrich clients with proposal data
      const enriched: Client[] = dbClients.map(c => {
        const clientProposals = dbProposals.filter(p => p.client_id === c.id);

        const totalSpent = clientProposals
          .filter(p => p.status === 'Concluído')
          .reduce((sum, p) => sum + (p.commercial_data?.commercial?.price || 0), 0);

        const proposals = clientProposals.map(p => ({
          id: p.id,
          title: p.title || 'Proposta',
          value: p.commercial_data?.commercial?.price || 0,
          date: new Date(p.created_at).toLocaleDateString('pt-BR'),
          status: (p.status === 'Concluído' ? 'aprovada' : p.status === 'Vencido' ? 'recusada' : 'pendente') as any,
        }));

        const installations = clientProposals
          .filter(p => p.status === 'Concluído' || p.status === 'Enviado')
          .map(p => ({
            id: `i-${p.id}`,
            model: p.commercial_data?.commercial?.productName || 'Carregador Eco',
            status: (p.status === 'Concluído' ? 'concluido' : 'instalando') as any,
            date: p.status === 'Concluído'
              ? new Date(p.updated_at || p.created_at).toLocaleDateString('pt-BR')
              : 'Previsão: em breve',
          }));

        return {
          ...c,
          totalSpent,
          proposals,
          installations,
        } as Client;
      });

      setClients(enriched);
    } catch (err) {
      const errMsg = (err as Record<string, unknown>)?.message as string || 'Erro ao buscar clientes';
      console.error('[useClients] Error fetching clients:', errMsg);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchClients();
  }, [fetchClients]);

  const createClient = async (data: Omit<ClientInsert, 'user_id'>): Promise<Client | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchClients(); // Refresh to get enriched data
      return newClient as Client;
    } catch (err) {
      console.error('[useClients] Error creating client:', err);
      return null;
    }
  };

  const updateClient = async (id: string, data: Partial<Client>): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('clients')
        .update(data)
        .eq('id', id);

      if (updateError) throw updateError;

      setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      return true;
    } catch (err) {
      console.error('[useClients] Error updating client:', err);
      return false;
    }
  };

  const deleteClient = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setClients(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err) {
      console.error('[useClients] Error deleting client:', err);
      return false;
    }
  };

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
    createClient,
    updateClient,
    deleteClient,
  };
}

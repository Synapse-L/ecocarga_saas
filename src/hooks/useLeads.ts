"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Lead, LeadInsert } from '@/types/lead';

interface UseLeadsReturn {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createLead: (data: Omit<LeadInsert, 'user_id'>) => Promise<Lead | null>;
  updateLead: (id: string, data: Partial<Lead>) => Promise<boolean>;
  deleteLead: (id: string) => Promise<boolean>;
  convertToClient: (leadId: string, proposalId?: string) => Promise<boolean>;
}

export function useLeads(): UseLeadsReturn {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setLeads(data as Lead[] ?? []);
    } catch (err) {
      const errMsg = (err as Record<string, unknown>)?.message as string || 'Erro ao buscar leads';
      console.error('[useLeads] Error fetching leads:', errMsg);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLeads();
  }, [fetchLeads]);

  const createLead = async (data: Omit<LeadInsert, 'user_id'>): Promise<Lead | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();

      if (insertError) throw insertError;

      setLeads(prev => [newLead as Lead, ...prev]);
      return newLead as Lead;
    } catch (err) {
      console.error('[useLeads] Error creating lead:', err);
      return null;
    }
  };

  const updateLead = async (id: string, data: Partial<Lead>): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('leads')
        .update(data)
        .eq('id', id);

      if (updateError) throw updateError;

      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
      return true;
    } catch (err) {
      console.error('[useLeads] Error updating lead:', err);
      return false;
    }
  };

  const deleteLead = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setLeads(prev => prev.filter(l => l.id !== id));
      return true;
    } catch (err) {
      console.error('[useLeads] Error deleting lead:', err);
      return false;
    }
  };

  const convertToClient = async (leadId: string, proposalId?: string): Promise<boolean> => {
    return updateLead(leadId, {
      converted_to_client: true,
      status: 'closed',
      ...(proposalId ? { proposal_id: proposalId } : {}),
    });
  };

  return {
    leads,
    loading,
    error,
    refetch: fetchLeads,
    createLead,
    updateLead,
    deleteLead,
    convertToClient,
  };
}

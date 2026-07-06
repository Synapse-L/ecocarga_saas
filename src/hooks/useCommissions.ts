"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Commission, CommissionInsert } from '@/types/commission';

interface UseCommissionsReturn {
  commissions: Commission[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createCommission: (data: Omit<CommissionInsert, 'user_id'>) => Promise<Commission | null>;
  updateCommission: (id: string, data: Partial<Commission>) => Promise<boolean>;
  markAsPaid: (id: string) => Promise<boolean>;
  // Summary stats
  totalEarned: number;
  totalPending: number;
  totalRetained: number;
}

export function useCommissions(): UseCommissionsReturn {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('commissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCommissions(data as Commission[] ?? []);
    } catch (err: any) {
      console.error('[useCommissions] Error fetching commissions:', err);
      setError(err.message || 'Erro ao buscar comissões');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  const createCommission = async (data: Omit<CommissionInsert, 'user_id'>): Promise<Commission | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: newCommission, error: insertError } = await supabase
        .from('commissions')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();

      if (insertError) throw insertError;

      setCommissions(prev => [newCommission as Commission, ...prev]);
      return newCommission as Commission;
    } catch (err: any) {
      console.error('[useCommissions] Error creating commission:', err);
      return null;
    }
  };

  const updateCommission = async (id: string, data: Partial<Commission>): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('commissions')
        .update(data)
        .eq('id', id);

      if (updateError) throw updateError;

      setCommissions(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      return true;
    } catch (err: any) {
      console.error('[useCommissions] Error updating commission:', err);
      return false;
    }
  };

  const markAsPaid = async (id: string): Promise<boolean> => {
    return updateCommission(id, {
      status: 'pago',
      paid_at: new Date().toISOString(),
    });
  };

  // Computed stats
  const totalEarned = commissions
    .filter(c => c.status === 'pago')
    .reduce((sum, c) => sum + c.comm_value, 0);

  const totalPending = commissions
    .filter(c => c.status === 'processando')
    .reduce((sum, c) => sum + c.comm_value, 0);

  const totalRetained = commissions
    .filter(c => c.status === 'retido')
    .reduce((sum, c) => sum + c.comm_value, 0);

  return {
    commissions,
    loading,
    error,
    refetch: fetchCommissions,
    createCommission,
    updateCommission,
    markAsPaid,
    totalEarned,
    totalPending,
    totalRetained,
  };
}

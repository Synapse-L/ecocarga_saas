// src/types/client.ts

export type ClientSegment = 'condominio' | 'frota' | 'posto' | 'hotel';
export type BusinessPotential = 'frio' | 'morno' | 'quente' | 'altissimo';

export interface ClientProposal {
  id: string;
  title: string;
  value: number;
  date: string;
  status: 'aprovada' | 'pendente' | 'recusada';
}

export interface ClientInstallation {
  id: string;
  model: string;
  status: 'agendado' | 'instalando' | 'concluido';
  date: string;
}

export interface Client {
  id: string;
  user_id?: string;
  name: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  segment: ClientSegment;
  potential: BusinessPotential;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Computed from proposals join
  totalSpent?: number;
  proposals?: ClientProposal[];
  installations?: ClientInstallation[];
}

export interface ClientInsert {
  user_id: string;
  name: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  segment: ClientSegment;
  potential: BusinessPotential;
  notes?: string;
}

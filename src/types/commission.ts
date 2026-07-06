// src/types/commission.ts

export type CommissionStatus = 'pago' | 'processando' | 'retido';

export interface Commission {
  id: string;
  user_id?: string;
  proposal_id?: string;
  client: string;
  product: string;
  deal_value: number;
  comm_percent: number;
  comm_value: number;
  date: string;
  status: CommissionStatus;
  paid_at?: string;
  created_at?: string;
}

export interface CommissionInsert {
  user_id: string;
  proposal_id?: string;
  client: string;
  product: string;
  deal_value: number;
  comm_percent: number;
  comm_value: number;
  status: CommissionStatus;
}

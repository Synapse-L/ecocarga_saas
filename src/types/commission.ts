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
  /** Gerada no banco a partir de deal_value × comm_percent. Só leitura. */
  comm_value: number;
  status: CommissionStatus;
  paid_at?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * O que a aplicação pode gravar.
 *
 * Sem `comm_value`: no banco ela é GENERATED ALWAYS, e o Postgres recusa
 * qualquer INSERT que a envie. Deixá-la no tipo convidava a escrever um insert
 * que só falharia em produção, e num valor que alguém vai receber.
 */
export interface CommissionInsert {
  user_id: string;
  proposal_id?: string;
  client: string;
  product: string;
  deal_value: number;
  comm_percent: number;
  status: CommissionStatus;
}

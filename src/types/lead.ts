// src/types/lead.ts

export type LeadStatus = 'new' | 'inprogress' | 'qualified' | 'proposal' | 'closed';
export type LeadOrigin = 'whatsapp' | 'instagram' | 'site' | 'indicacao';

export interface LeadTimeline {
  event: string;
  time: string;
  type: 'in' | 'out' | 'system';
}

export interface Lead {
  id: string;
  user_id?: string;
  name: string;
  phone: string;
  interest: string;
  status: LeadStatus;
  time?: string;
  score: number;
  tags: string[];
  first_msg: string;
  origin: LeadOrigin;
  timeline?: LeadTimeline[];
  created_at?: string;
  updated_at?: string;
  converted_to_client?: boolean;
  proposal_id?: string;
}

export interface LeadInsert {
  user_id: string;
  name: string;
  phone: string;
  interest: string;
  status: LeadStatus;
  score: number;
  tags: string[];
  first_msg: string;
  origin: LeadOrigin;
}

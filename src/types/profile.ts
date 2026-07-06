// src/types/profile.ts

export type UserRole = 'admin' | 'vendedor' | 'gestor';

export interface UserProfile {
  id: string;
  full_name: string;
  company_name: string;
  role: UserRole;
  completed_tour: boolean;
  updated_at?: string;
  created_at?: string;
}

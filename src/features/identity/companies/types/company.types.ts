export interface Company {
  id: number | string;
  uuid: string;
  name: string;
  legalName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  tax_number?: string;  // Usar tax_number em vez de document
  document?: string;   // Manter por compatibilidade
  website?: string;
  logo?: string;
  country: string;
  province?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  timezone: string;
  currency: string;
  isActive: boolean;
  usersCount?: number;
  plan?: 'basic' | 'professional' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyDTO {
  name: string;
  legalName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  tax_number?: string;
  website?: string;
  country: string;
  province?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  timezone?: string;
  currency?: string;
  plan?: 'basic' | 'professional' | 'enterprise';
}

export interface UpdateCompanyDTO {
  name?: string;
  legalName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  tax_number?: string;
  website?: string;
  country?: string;
  province?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  timezone?: string;
  currency?: string;
  plan?: 'basic' | 'professional' | 'enterprise';
  isActive?: boolean;
}

export interface CompanyFilters {
  search?: string;
  isActive?: boolean;
  country?: string;
  plan?: 'basic' | 'professional' | 'enterprise';
  page?: number;
  limit?: number;
}

export const planConfig = {
  basic: { label: 'Básico', color: '#10B981', price: '1.500 MZN/mês' },
  professional: { label: 'Profissional', color: '#2563EB', price: '4.500 MZN/mês' },
  enterprise: { label: 'Enterprise', color: '#8B5CF6', price: 'Sob consulta' },
} as const;
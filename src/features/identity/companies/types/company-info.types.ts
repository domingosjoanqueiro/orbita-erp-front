export interface CompanyInfo {
  id: number;
  uuid: string;
  name: string;
  legalName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  taxNumber?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCompanyInfoRequest {
  name?: string;
  legalName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  taxNumber?: string;
  website?: string;
  logo?: string;
  country?: string;
  province?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  timezone?: string;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}
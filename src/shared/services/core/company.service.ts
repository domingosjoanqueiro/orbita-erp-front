import { ApiService } from "../api/api.service";

export interface Company {
  company: any;
  id: number;
  uuid: string;
  name: string;
  legalName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  tax_number?: string;
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
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyRequest {
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
}

export interface CompanyAdmin {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

export interface CreateCompanyWithAdminRequest {
  company: CreateCompanyRequest;
  admin: CompanyAdmin;
}

export interface UpdateCompanyRequest {
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
}

export interface CompanyFilters {
  search?: string;
  isActive?: boolean;
  country?: string;
  page?: number;
  limit?: number;
}

class CompanyService extends ApiService {

  private readonly basePath = "/system/companies";

  constructor() {
    super("platform");
  }

  async getAll(filters?: CompanyFilters) {
    return this.get(`${this.basePath}`, {
      params: filters,
    });
  }

  async getByUuid(uuid: string): Promise<Company> {
    return this.get(`${this.basePath}/${uuid}`);
  }

  // CREATE - Novo fluxo com administrador
  async create(data: CreateCompanyWithAdminRequest): Promise<Company> {
    return this.post(`${this.basePath}`, data);
  }

  async update(
    uuid: string,
    data: UpdateCompanyRequest
  ): Promise<Company> {
    return this.put(
      `${this.basePath}/${uuid}`,
      data
    );
  }

  async toggleStatus(
    uuid: string,
    isActive: boolean
  ) {
    return this.patch(
      `${this.basePath}/${uuid}/status`,
      {
        isActive,
      }
    );
  }

  async remove(
    uuid: string
  ) {
    return this.delete(
      `${this.basePath}/${uuid}`
    );
  }
}

export const companyService = new CompanyService();
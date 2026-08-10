'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Company {
  id: string;
  name: string;
  document: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface CompanyContextType {
  company: Company | null;
  companies: Company[];
  setCurrentCompany: (companyId: string) => void;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de empresas
    const mockCompanies: Company[] = [
      {
        id: '1',
        name: 'Empresa A',
        document: '12.345.678/0001-90',
        email: 'contato@empresaa.com',
        phone: '(11) 99999-9999',
        address: {
          street: 'Rua Exemplo',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
        },
      },
      {
        id: '2',
        name: 'Empresa B',
        document: '98.765.432/0001-10',
        email: 'contato@empresab.com',
        phone: '(11) 88888-8888',
        address: {
          street: 'Avenida Teste',
          number: '456',
          neighborhood: 'Jardins',
          city: 'Rio de Janeiro',
          state: 'RJ',
          zipCode: '98765-432',
        },
      },
    ];

    setCompanies(mockCompanies);

    // Recuperar empresa atual do localStorage
    const savedCompanyId = localStorage.getItem('currentCompanyId');
    if (savedCompanyId) {
      const foundCompany = mockCompanies.find(c => c.id === savedCompanyId);
      if (foundCompany) {
        setCompany(foundCompany);
      } else {
        setCompany(mockCompanies[0]);
      }
    } else {
      setCompany(mockCompanies[0]);
    }

    setIsLoading(false);
  }, []);

  const setCurrentCompany = (companyId: string) => {
    const foundCompany = companies.find(c => c.id === companyId);
    if (foundCompany) {
      setCompany(foundCompany);
      localStorage.setItem('currentCompanyId', companyId);
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        company,
        companies,
        setCurrentCompany,
        isLoading,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
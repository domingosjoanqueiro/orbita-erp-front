'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  X, 
  CreditCard, 
  User, 
  Lock, 
  UserCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { Input } from '@/shared/components/ui/Input/Input';
import { Select } from '@/shared/components/ui/Select/Select';
import { Button } from '@/shared/components/ui/Button/Button';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { companyService } from '@/shared/services/core/company.service';
import type { Company } from '@/shared/services/core/company.service';
import styles from './CompanyForm.module.css';

interface CompanyFormProps {
  company?: Company | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// Schema para criação de empresa com admin - baseado na tabela companies
const createCompanySchema = z.object({
  // Dados da Empresa
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  document: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  // Endereço - apenas campos que existem na tabela
  country: z.string().min(1, 'País é obrigatório'),
  province: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  // Dados do Administrador
  adminFirstName: z.string().min(2, 'Nome do administrador deve ter no mínimo 2 caracteres'),
  adminLastName: z.string().min(2, 'Apelido do administrador deve ter no mínimo 2 caracteres'),
  adminUsername: z.string().min(3, 'Username deve ter no mínimo 3 caracteres'),
  adminEmail: z.string().email('Email do administrador inválido'),
  adminPassword: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

// Schema para edição (sem admin)
const updateCompanySchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  document: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  country: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
});

const getErrorMessage = (error: any): string | undefined => {
  if (!error) return undefined;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return undefined;
};

const extractAddress = (company: Company | null | undefined) => {
  if (!company) return '';
  return company.address || '';
};

const getDocument = (company: Company | null | undefined) => {
  if (!company) return '';
  return company.tax_number || '';
};

// Steps definition
const STEPS = [
  { id: 'company', label: 'Dados da Empresa', icon: Building2 },
  { id: 'address', label: 'Endereço', icon: MapPin },
  { id: 'admin', label: 'Administrador', icon: UserCircle },
];

export const CompanyForm: React.FC<CompanyFormProps> = ({
  company,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!company;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { showSuccess, showError } = useToast();
  const { startLoading, stopLoading } = useLoading();

  const isCreating = !isEditing;
  const schema = isEditing ? updateCompanySchema : createCompanySchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: isEditing && company ? {
      name: company.name || '',
      document: getDocument(company),
      email: company.email || '',
      phone: company.phone || '',
      website: company.website || '',
      country: company.country || 'Moçambique',
      province: company.province || '',
      city: company.city || '',
      address: extractAddress(company),
      postalCode: company.postalCode || '',
      timezone: company.timezone || 'Africa/Maputo',
      currency: company.currency || 'MZN',
    } : {
      name: '',
      document: '',
      email: '',
      phone: '',
      website: '',
      country: 'Moçambique',
      province: '',
      city: '',
      address: '',
      postalCode: '',
      timezone: 'Africa/Maputo',
      currency: 'MZN',
      adminFirstName: '',
      adminLastName: '',
      adminUsername: '',
      adminEmail: '',
      adminPassword: '',
    },
  });

  // Steps para criação (com admin) ou edição (sem admin)
  const getSteps = () => {
    if (isEditing) {
      return [
        { id: 'company', label: 'Dados da Empresa', icon: Building2 },
        { id: 'address', label: 'Endereço', icon: MapPin },
      ];
    }
    return STEPS;
  };

  const steps = getSteps();
  const totalSteps = steps.length;

  // Validar passo atual
  const validateStep = async (step: number) => {
    const stepFields = getStepFields(step);
    if (stepFields.length === 0) return true;
    
    const result = await trigger(stepFields as any);
    return result;
  };

  // Campos por passo
  const getStepFields = (step: number): string[] => {
    const stepId = steps[step]?.id;
    
    switch (stepId) {
      case 'company':
        return ['name', 'document', 'email', 'phone', 'website'];
      case 'address':
        return ['country', 'province', 'city', 'address', 'postalCode', 'timezone', 'currency'];
      case 'admin':
        return ['adminFirstName', 'adminLastName', 'adminUsername', 'adminEmail', 'adminPassword'];
      default:
        return [];
    }
  };

  const nextStep = async () => {
    if (currentStep < totalSteps - 1) {
      const isValid = await validateStep(currentStep);
      if (isValid) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  // Renderizar campos por passo
  const renderStepFields = () => {
    const stepId = steps[currentStep]?.id;

    switch (stepId) {
      case 'company':
        return (
          <div className={styles.fields}>
            <div className={styles.field}>
              <Input
                label="Nome da Empresa"
                placeholder="Ex: Orbita Moçambique"
                leftIcon={<Building2 size={16} />}
                {...register('name')}
                error={getErrorMessage(errors.name)}
                fullWidth
              />
            </div>
            <div className={styles.field}>
              <Input
                label="NUIT"
                placeholder="Ex: 123456789"
                {...register('document')}
                error={getErrorMessage(errors.document)}
                fullWidth
              />
            </div>
            <div className={styles.field}>
              <Input
                label="Email"
                type="email"
                placeholder="contato@empresa.co.mz"
                leftIcon={<Mail size={16} />}
                {...register('email')}
                error={getErrorMessage(errors.email)}
                fullWidth
              />
            </div>
            <div className={styles.field}>
              <Input
                label="Telefone"
                placeholder="(+258) 82 123 4567"
                leftIcon={<Phone size={16} />}
                {...register('phone')}
                error={getErrorMessage(errors.phone)}
                fullWidth
              />
            </div>
            <div className={styles.field}>
              <Input
                label="Website"
                placeholder="www.empresa.co.mz"
                leftIcon={<Globe size={16} />}
                {...register('website')}
                error={getErrorMessage(errors.website)}
                fullWidth
              />
            </div>
           
          </div>
        );

      case 'address':
        return (
          <div className={styles.fields}>
            <div className={styles.field}>
              <Input
                label="Endereço"
                placeholder="Ex: Av. Julius Nyerere, 1234, Sommerschield"
                leftIcon={<MapPin size={16} />}
                {...register('address')}
                error={getErrorMessage(errors.address)}
                fullWidth
              />
            </div>
            <div className={styles.field}>
              <Input
                label="Cidade"
                placeholder="Ex: Maputo"
                {...register('city')}
                error={getErrorMessage(errors.city)}
                fullWidth
              />
            </div>
            <div className={styles.field}>
              <Select
                label="Província"
                options={[
                  { value: 'Cidade de Maputo', label: 'Cidade de Maputo' },
                  { value: 'Maputo', label: 'Maputo' },
                  { value: 'Gaza', label: 'Gaza' },
                  { value: 'Inhambane', label: 'Inhambane' },
                  { value: 'Sofala', label: 'Sofala' },
                  { value: 'Manica', label: 'Manica' },
                  { value: 'Tete', label: 'Tete' },
                  { value: 'Zambézia', label: 'Zambézia' },
                  { value: 'Nampula', label: 'Nampula' },
                  { value: 'Cabo Delgado', label: 'Cabo Delgado' },
                  { value: 'Niassa', label: 'Niassa' },
                ]}
                {...register('province')}
                error={getErrorMessage(errors.province)}
                fullWidth
              />
            </div>
            <div className={styles.field}>
              <Input
                label="Código Postal"
                placeholder="Ex: 1100"
                {...register('postalCode')}
                error={getErrorMessage(errors.postalCode)}
                fullWidth
              />
            </div>
            <div className={styles.field}>
              <Select
                label="País"
                options={[
                  { value: 'Moçambique', label: 'Moçambique' },
                  { value: 'África do Sul', label: 'África do Sul' },
                  { value: 'Tanzânia', label: 'Tanzânia' },
                  { value: 'Malawi', label: 'Malawi' },
                  { value: 'Zâmbia', label: 'Zâmbia' },
                  { value: 'Zimbábue', label: 'Zimbábue' },
                  { value: 'Suazilândia', label: 'Suazilândia' },
                ]}
                {...register('country')}
                error={getErrorMessage(errors.country)}
                fullWidth
              />
            </div>
            <div className={styles.field}>
              <Input
                label="Fuso Horário"
                placeholder="Africa/Maputo"
                {...register('timezone')}
                error={getErrorMessage(errors.timezone)}
                fullWidth
              />
            </div>
            <div className={styles.field}>
              <Input
                label="Moeda"
                placeholder="MZN"
                {...register('currency')}
                error={getErrorMessage(errors.currency)}
                fullWidth
              />
            </div>
          </div>
        );

      case 'admin':
        return (
          <div className={styles.fields}>
            <div className={styles.field}>
              <Input
                label="Nome do Administrador"
                placeholder="Ex: João"
                leftIcon={<User size={16} />}
                {...register('adminFirstName')}
                error={getErrorMessage(errors.adminFirstName)}
                fullWidth
              />
            </div>
            <div className={styles.field}>
              <Input
                label="Apelido"
                placeholder="Ex: Silva"
                leftIcon={<User size={16} />}
                {...register('adminLastName')}
                error={getErrorMessage(errors.adminLastName)}
                fullWidth
              />
            </div>
            <div className={styles.field}>
              <Input
                label="Username"
                placeholder="Ex: joao.silva"
                leftIcon={<UserCircle size={16} />}
                {...register('adminUsername')}
                error={getErrorMessage(errors.adminUsername)}
                fullWidth
              />
            </div>
            <div className={styles.field}>
              <Input
                label="Email do Administrador"
                type="email"
                placeholder="admin@empresa.co.mz"
                leftIcon={<Mail size={16} />}
                {...register('adminEmail')}
                error={getErrorMessage(errors.adminEmail)}
                fullWidth
              />
            </div>
            <div className={styles.field}>
              <Input
                label="Palavra-passe"
                type="password"
                placeholder="Digite uma senha forte"
                leftIcon={<Lock size={16} />}
                {...register('adminPassword')}
                error={getErrorMessage(errors.adminPassword)}
                fullWidth
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };


  // Função helper para extrair nome da empresa da resposta
const extractCompanyName = (response: any, fallbackName: string = 'Empresa'): string => {
  if (!response) return fallbackName;
  
  // Tentar diferentes estruturas de resposta
  const paths = [
    () => response?.data?.company?.name,
    () => response?.company?.name,
    () => response?.name,
    () => response?.data?.name,
    () => response?.data?.data?.company?.name,
    () => response?.data?.data?.name,
  ];

  for (const path of paths) {
    const value = path();
    if (value && typeof value === 'string') {
      return value;
    }
  }

  return fallbackName;
};

// Função helper para extrair nome do administrador
const extractAdminName = (response: any): string => {
  if (!response) return 'administrador';
  
  const paths = [
    () => response?.data?.administrator?.firstName,
    () => response?.administrator?.firstName,
    () => response?.data?.admin?.firstName,
    () => response?.admin?.firstName,
  ];

  for (const path of paths) {
    const firstName = path();
    if (firstName) {
      const lastName = response?.data?.administrator?.lastName || 
                       response?.administrator?.lastName || 
                       response?.data?.admin?.lastName || 
                       response?.admin?.lastName || '';
      return `${firstName} ${lastName}`.trim();
    }
  }

  return 'administrador';
};

const onSubmit = async (data: any) => {
  try {
    setIsSubmitting(true);
    startLoading();

    if (isEditing && company) {
      const payload: any = {
        name: data.name,
        legalName: data.name,
      };

      if (data.document) payload.taxNumber = data.document;
      if (data.email) payload.email = data.email;
      if (data.phone) payload.phone = data.phone;
      if (data.website) payload.website = data.website;
      if (data.country) payload.country = data.country;
      if (data.province) payload.province = data.province;
      if (data.city) payload.city = data.city;
      if (data.address) payload.address = data.address;
      if (data.postalCode) payload.postalCode = data.postalCode;
      if (data.timezone) payload.timezone = data.timezone;
      if (data.currency) payload.currency = data.currency;

      const response = await companyService.update(company.uuid, payload);
      const companyName = extractCompanyName(response, company.name);
      showSuccess('Empresa atualizada', `${companyName} foi atualizada com sucesso`);
    } else {
      const companyData: any = {
        name: data.name,
        country: data.country || 'Moçambique',
      };

      if (data.document) companyData.taxNumber = data.document;
      if (data.email) companyData.email = data.email;
      if (data.phone) companyData.phone = data.phone;
      if (data.website) companyData.website = data.website;
      if (data.province) companyData.province = data.province;
      if (data.city) companyData.city = data.city;
      if (data.address) companyData.address = data.address;
      if (data.postalCode) companyData.postalCode = data.postalCode;
      if (data.timezone) companyData.timezone = data.timezone;
      if (data.currency) companyData.currency = data.currency;

      const adminData = {
        firstName: data.adminFirstName,
        lastName: data.adminLastName,
        username: data.adminUsername,
        email: data.adminEmail,
        password: data.adminPassword,
      };

      const payload = {
        company: companyData,
        admin: adminData,
      };

      console.log('📤 Enviando payload:', JSON.stringify(payload, null, 2));

      const response = await companyService.create(payload);
      console.log('📥 Resposta da criação:', response);

      const companyName = extractCompanyName(response, data.name);
      const adminName = extractAdminName(response);

      showSuccess(
        'Empresa criada com sucesso! 🎉',
        `${companyName} foi criada com sucesso! O administrador ${adminName} foi criado automaticamente.`
      );
    }

    onSuccess();
  } catch (error: any) {
    console.error('❌ Erro ao salvar empresa:', error);
    
    if (error.response) {
      console.error('📥 Resposta de erro:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    
    let errorMessage = 'Erro ao salvar empresa. Tente novamente.';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.errors) {
      const messages = Object.values(error.response.data.errors).flat();
      errorMessage = messages.join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showError('Erro', errorMessage);
  } finally {
    setIsSubmitting(false);
    stopLoading();
  }
};

  // Informações adicionais
  const infoItems = [
    { label: 'Moeda', value: 'MZN (Metical)', icon: CreditCard },
    { label: 'Fuso Horário', value: 'UTC+2 (Maputo)', icon: Globe },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      {/* Steps Indicator */}
      {isCreating && (
        <div className={styles.stepsIndicator}>
          {steps.map((step, index) => (
            <div key={step.id} className={styles.stepItem}>
              <div 
                className={`${styles.stepDot} ${index <= currentStep ? styles.active : ''} ${index < currentStep ? styles.completed : ''}`}
                onClick={() => {
                  if (index < currentStep) {
                    setCurrentStep(index);
                  }
                }}
              >
                {index < currentStep ? (
                  <CheckCircle size={16} />
                ) : (
                  <step.icon size={16} />
                )}
              </div>
              <div className={styles.stepLabel}>{step.label}</div>
              {index < steps.length - 1 && (
                <div className={`${styles.stepLine} ${index < currentStep ? styles.completed : ''}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step Content */}
      <div className={styles.stepContent}>
        {renderStepFields()}
      </div>

      {/* Info Boxes (apenas no passo de endereço) */}
      {steps[currentStep]?.id === 'address' && (
        <div className={styles.infoGrid}>
          {infoItems.map((item, index) => (
            <div key={index} className={styles.infoBox}>
              <item.icon size={20} className={styles.infoIcon} />
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>{item.label}</span>
                <span className={styles.infoValue}>{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <div className={styles.actionsLeft}>
          {!isFirstStep && (
            <Button
              type="button"
              variant="secondary"
              onClick={prevStep}
              icon={<ChevronLeft size={18} />}
            >
              Anterior
            </Button>
          )}
        </div>
        <div className={styles.actionsRight}>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            icon={<X size={18} />}
          >
            Cancelar
          </Button>
          
          {!isLastStep && isCreating ? (
            <Button
              type="button"
              onClick={nextStep}
              iconPosition="right"
              icon={<ChevronRight size={18} />}
            >
              Próximo
            </Button>
          ) : (
            <Button
              type="submit"
              isLoading={isSubmitting}
              icon={isEditing ? <Building2 size={18} /> : <CheckCircle size={18} />}
            >
              {isEditing ? 'Atualizar' : 'Criar'} Empresa
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Save,
  X,
  Edit,
  Camera,
  Loader2,
  CheckCircle,
  Calendar,
  Clock,
  Shield,
  TrendingUp,
  Users,
  Sparkles,
  Settings,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Input } from '@/shared/components/ui/Input/Input';
import { Select } from '@/shared/components/ui/Select/Select';
import { SkeletonCard } from '@/shared/components/ui/Skeleton/SkeletonCard';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { useToast } from '@/shared/contexts/ToastContext';
import { companyInfoService } from '@/features/identity/companies/services/company-info.service';
import type { CompanyInfo } from '@/features/identity/companies/types/company-info.types';
import styles from './page.module.css';

const provinceOptions = [
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
];

const countryOptions = [
  { value: 'Moçambique', label: 'Moçambique' },
  { value: 'África do Sul', label: 'África do Sul' },
  { value: 'Tanzânia', label: 'Tanzânia' },
  { value: 'Malawi', label: 'Malawi' },
  { value: 'Zâmbia', label: 'Zâmbia' },
  { value: 'Zimbábue', label: 'Zimbábue' },
  { value: 'Suazilândia', label: 'Suazilândia' },
];

const timezoneOptions = [
  { value: 'Africa/Maputo', label: 'Africa/Maputo (UTC+2)' },
  { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg (UTC+2)' },
  { value: 'Africa/Dar_es_Salaam', label: 'Africa/Dar_es_Salaam (UTC+3)' },
  { value: 'Africa/Nairobi', label: 'Africa/Nairobi (UTC+3)' },
];

const currencyOptions = [
  { value: 'MZN', label: 'MZN - Metical' },
  { value: 'USD', label: 'USD - Dólar Americano' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'ZAR', label: 'ZAR - Rand' },
];

export default function CompanyInfoPage() {
  const { startLoading, stopLoading, isLoading } = useLoading();
  const { showSuccess, showError } = useToast();

  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<CompanyInfo>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função para extrair dados da resposta da API - Mapear snake_case para camelCase
  const extractData = (response: any): CompanyInfo => {
    if (!response) return {} as CompanyInfo;
    
    // Se a resposta tem a estrutura { success, message, data }
    const data = response.data || response;
    
    // Log para debug
    console.log('📊 Dados brutos da API:', data);
    
    // Mapear os campos de snake_case para camelCase
    return {
      id: data.id || 0,
      uuid: data.uuid || '',
      name: data.name || '',
      legalName: data.legal_name || data.legalName || '',
      email: data.email || '',
      phone: data.phone || '',
      mobile: data.mobile || '',
      taxNumber: data.tax_number || data.taxNumber || '',
      website: data.website || '',
      logo: data.logo || '',
      country: data.country || '',
      province: data.province || '',
      city: data.city || '',
      address: data.address || '',
      postalCode: data.postal_code || data.postalCode || '',
      timezone: data.timezone || 'Africa/Maputo',
      currency: data.currency || 'MZN',
      isActive: data.is_active !== undefined ? data.is_active : data.isActive !== undefined ? data.isActive : true,
      createdAt: data.created_at || data.createdAt || '',
      updatedAt: data.updated_at || data.updatedAt || '',
    };
  };

  // Função para preparar o payload para envio (camelCase para snake_case)
  const preparePayload = (data: Partial<CompanyInfo>): any => {
    const payload: any = {};
    
    if (data.name !== undefined) payload.name = data.name;
    if (data.legalName !== undefined) payload.legal_name = data.legalName;
    if (data.email !== undefined) payload.email = data.email;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.mobile !== undefined) payload.mobile = data.mobile;
    if (data.taxNumber !== undefined) payload.tax_number = data.taxNumber;
    if (data.website !== undefined) payload.website = data.website;
    if (data.country !== undefined) payload.country = data.country;
    if (data.province !== undefined) payload.province = data.province;
    if (data.city !== undefined) payload.city = data.city;
    if (data.address !== undefined) payload.address = data.address;
    if (data.postalCode !== undefined) payload.postal_code = data.postalCode;
    if (data.timezone !== undefined) payload.timezone = data.timezone;
    if (data.currency !== undefined) payload.currency = data.currency;
    
    return payload;
  };

  const loadCompanyInfo = async () => {
    try {
      startLoading();
      const response = await companyInfoService.getInfo();
      console.log('📥 Resposta da API (getInfo):', response);
      
      const data = extractData(response);
      console.log('📊 Dados mapeados:', data);
      
      setCompany(data);
      setFormData(data);
    } catch (error: any) {
      console.error('Erro ao carregar informações da empresa:', error);
      showError('Erro', 'Não foi possível carregar as informações da empresa');
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const handleInputChange = (field: keyof CompanyInfo, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      startLoading();

      const payload = preparePayload(formData);
      
      console.log('📤 Enviando payload:', payload);

      const response = await companyInfoService.updateInfo(payload);
      console.log('📥 Resposta da API (update):', response);
      
      const updatedData = extractData(response);
      console.log('📊 Dados atualizados mapeados:', updatedData);
      
      setCompany(updatedData);
      setFormData(updatedData);
      setIsEditing(false);
      
      showSuccess('Informações atualizadas', 'As informações da empresa foram atualizadas com sucesso');
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      showError('Erro', error.response?.data?.message || 'Não foi possível salvar as informações');
    } finally {
      setIsSaving(false);
      stopLoading();
    }
  };

  const handleCancel = () => {
    setFormData(company || {});
    setIsEditing(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      startLoading();
      const response = await companyInfoService.uploadLogo(file);
      const result = (response as any)?.data || response;
      
      if (company) {
        const updatedCompany: CompanyInfo = {
          ...company,
          logo: result.logo,
        };
        setCompany(updatedCompany);
        setFormData((prev) => ({ ...prev, logo: result.logo }));
      }
      
      showSuccess('Logo atualizado', 'O logo da empresa foi atualizado com sucesso');
    } catch (error: any) {
      console.error('Erro ao fazer upload do logo:', error);
      showError('Erro', 'Não foi possível fazer upload do logo');
    } finally {
      setUploadingLogo(false);
      stopLoading();
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Tem certeza que deseja remover o logo?')) return;

    try {
      setUploadingLogo(true);
      startLoading();
      await companyInfoService.removeLogo();
      
      if (company) {
        const updatedCompany: CompanyInfo = {
          ...company,
          logo: undefined,
        };
        setCompany(updatedCompany);
        setFormData((prev) => ({ ...prev, logo: undefined }));
      }
      
      showSuccess('Logo removido', 'O logo foi removido com sucesso');
    } catch (error: any) {
      console.error('Erro ao remover logo:', error);
      showError('Erro', 'Não foi possível remover o logo');
    } finally {
      setUploadingLogo(false);
      stopLoading();
    }
  };

  if (isLoading && !company) {
    return <CompanyInfoSkeleton />;
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className={styles.title}>Informações da Empresa</h1>
            <p className={styles.subtitle}>
              Gerencie os dados da sua organização
            </p>
          </div>
          <div className={styles.headerBadge}>
            <CheckCircle size={12} />
            <span>Atualizado</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          {!isEditing ? (
            <Button
              className={styles.editButton}
              icon={<Edit size={16} />}
              onClick={() => setIsEditing(true)}
            >
              Editar
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={handleCancel}
                icon={<X size={16} />}
                className={styles.cancelButton}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                isLoading={isSaving}
                icon={<Save size={16} />}
                className={styles.saveButton}
              >
                Salvar Alterações
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Resto do conteúdo (mantido igual) */}
      <div className={styles.content}>
        {/* Hero Section */}
        <div className={styles.heroSection}>
          <div className={styles.heroLeft}>
            <div className={styles.logoWrapper}>
              {company?.logo ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className={styles.logoImage}
                />
              ) : (
                <div className={styles.logoPlaceholder}>
                  <Building2 size={40} />
                </div>
              )}
              {isEditing && (
                <div className={styles.logoOverlay}>
                  <button
                    className={styles.logoUploadBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    <Camera size={16} />
                    <span>Alterar</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className={styles.fileInput}
                  />
                  {company?.logo && (
                    <button
                      className={styles.logoRemoveBtn}
                      onClick={handleRemoveLogo}
                      disabled={uploadingLogo}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}
              {uploadingLogo && (
                <div className={styles.logoLoading}>
                  <Loader2 size={28} className={styles.spinner} />
                </div>
              )}
            </div>
            <div className={styles.heroInfo}>
              <h2 className={styles.companyName}>
                {company?.name || 'Minha Empresa'}
              </h2>
              <p className={styles.companyMeta}>
                <span className={styles.metaBadge}>
                  <Shield size={12} />
                  {company?.isActive ? 'Ativa' : 'Inativa'}
                </span>
                <span className={styles.metaDot}>•</span>
                <span className={styles.metaItem}>
                  <Calendar size={12} />
                  Criada em {company?.createdAt ? new Date(company.createdAt).toLocaleDateString('pt-BR') : '-'}
                </span>
                <span className={styles.metaDot}>•</span>
                <span className={styles.metaItem}>
                  <Users size={12} />
                  ID: {company?.id || '-'}
                </span>
              </p>
            </div>
          </div>
          <div className={styles.heroRight}>
            <div className={styles.quickStat}>
              <div className={styles.quickStatIcon}>
                <TrendingUp size={16} />
              </div>
              <div>
                <span className={styles.quickStatValue}>Ativa</span>
                <span className={styles.quickStatLabel}>Status</span>
              </div>
            </div>
            <div className={styles.quickStat}>
              <div className={styles.quickStatIcon}>
                <Clock size={16} />
              </div>
              <div>
                <span className={styles.quickStatValue}>
                  {company?.updatedAt ? new Date(company.updatedAt).toLocaleDateString('pt-BR') : '-'}
                </span>
                <span className={styles.quickStatLabel}>Última atualização</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Grid */}
        <div className={styles.formGrid}>
          {/* Left Column */}
          <div className={styles.formColumn}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <Building2 size={16} className={styles.cardIcon} />
                  <h3 className={styles.cardTitle}>Dados da Empresa</h3>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Nome da Empresa</label>
                  <Input
                    value={formData?.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Digite o nome da empresa"
                    className={styles.fieldInput}
                    fullWidth
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Nome Legal</label>
                  <Input
                    value={formData?.legalName || ''}
                    onChange={(e) => handleInputChange('legalName', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Digite o nome legal"
                    className={styles.fieldInput}
                    fullWidth
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>NUIT</label>
                  <Input
                    value={formData?.taxNumber || ''}
                    onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Digite o NUIT"
                    className={styles.fieldInput}
                    fullWidth
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Email</label>
                  <Input
                    type="email"
                    value={formData?.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    placeholder="contato@empresa.co.mz"
                    leftIcon={<Mail size={16} />}
                    className={styles.fieldInput}
                    fullWidth
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Website</label>
                  <Input
                    value={formData?.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    disabled={!isEditing}
                    placeholder="www.empresa.co.mz"
                    leftIcon={<Globe size={16} />}
                    className={styles.fieldInput}
                    fullWidth
                  />
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <Phone size={16} className={styles.cardIcon} />
                  <h3 className={styles.cardTitle}>Contactos</h3>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Telefone</label>
                  <Input
                    value={formData?.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    placeholder="(+258) 82 123 4567"
                    leftIcon={<Phone size={16} />}
                    className={styles.fieldInput}
                    fullWidth
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Telemóvel</label>
                  <Input
                    value={formData?.mobile || ''}
                    onChange={(e) => handleInputChange('mobile', e.target.value)}
                    disabled={!isEditing}
                    placeholder="(+258) 84 123 4567"
                    className={styles.fieldInput}
                    fullWidth
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.formColumn}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <MapPin size={16} className={styles.cardIcon} />
                  <h3 className={styles.cardTitle}>Endereço</h3>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Endereço</label>
                  <Input
                    value={formData?.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Av. Julius Nyerere, 1234"
                    className={styles.fieldInput}
                    fullWidth
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Cidade</label>
                  <Input
                    value={formData?.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Maputo"
                    className={styles.fieldInput}
                    fullWidth
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Província</label>
                  <Select
                    options={provinceOptions}
                    value={formData?.province || ''}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                    disabled={!isEditing}
                    className={styles.fieldSelect}
                    fullWidth
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Código Postal</label>
                  <Input
                    value={formData?.postalCode || ''}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    disabled={!isEditing}
                    placeholder="1100"
                    className={styles.fieldInput}
                    fullWidth
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>País</label>
                  <Select
                    options={countryOptions}
                    value={formData?.country || 'Moçambique'}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    disabled={!isEditing}
                    className={styles.fieldSelect}
                    fullWidth
                  />
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <Settings size={16} className={styles.cardIcon} />
                  <h3 className={styles.cardTitle}>Configurações</h3>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Fuso Horário</label>
                  <Select
                    options={timezoneOptions}
                    value={formData?.timezone || 'Africa/Maputo'}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    disabled={!isEditing}
                    className={styles.fieldSelect}
                    fullWidth
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Moeda</label>
                  <Select
                    options={currencyOptions}
                    value={formData?.currency || 'MZN'}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    disabled={!isEditing}
                    className={styles.fieldSelect}
                    fullWidth
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className={styles.systemInfo}>
          <div className={styles.systemInfoHeader}>
            <Shield size={14} />
            <span>Informações do Sistema</span>
          </div>
          <div className={styles.systemInfoGrid}>
            <div className={styles.systemInfoItem}>
              <span className={styles.systemInfoLabel}>UUID</span>
              <span className={styles.systemInfoValue}>{company?.uuid || '-'}</span>
            </div>
            <div className={styles.systemInfoItem}>
              <span className={styles.systemInfoLabel}>ID da Empresa</span>
              <span className={styles.systemInfoValue}>{company?.id || '-'}</span>
            </div>
            <div className={styles.systemInfoItem}>
              <span className={styles.systemInfoLabel}>Criado em</span>
              <span className={styles.systemInfoValue}>
                {company?.createdAt ? new Date(company.createdAt).toLocaleString('pt-BR') : '-'}
              </span>
            </div>
            <div className={styles.systemInfoItem}>
              <span className={styles.systemInfoLabel}>Última atualização</span>
              <span className={styles.systemInfoValue}>
                {company?.updatedAt ? new Date(company.updatedAt).toLocaleString('pt-BR') : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompanyInfoSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Informações da Empresa</h1>
          <p className={styles.subtitle}>Carregando...</p>
        </div>
      </div>
      <div className={styles.content}>
        <SkeletonCard variant="default" />
        <SkeletonCard variant="default" />
      </div>
    </div>
  );
}
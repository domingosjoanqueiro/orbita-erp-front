'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { BookOpen, Hash, FileText, Layers, X, CheckCircle } from 'lucide-react';
import { Input } from '@/shared/components/ui/Input/Input';
import { Select } from '@/shared/components/ui/Select/Select';
import { Textarea } from '@/shared/components/ui/Textarea/Textarea';
import { Button } from '@/shared/components/ui/Button/Button';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { programService } from '../services/program.service';
import type { Program } from '../types/program.types';
import styles from './ProgramForm.module.css';

interface ProgramFormProps {
  program?: Program | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ProgramForm: React.FC<ProgramFormProps> = ({
  program,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!program;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [schoolLevels, setSchoolLevels] = useState<{ 
    id: number; 
    uuid: string; 
    name: string; 
    code: string; 
  }[]>([]);
  const [loadingLevels, setLoadingLevels] = useState(true);
  const { showSuccess, showError } = useToast();
  const { startLoading, stopLoading } = useLoading();

  // Estados separados para o formulário
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formSchoolLevelUuid, setFormSchoolLevelUuid] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formErrors, setFormErrors] = useState<{ 
    name?: string; 
    code?: string; 
    schoolLevelUuid?: string; 
  }>({});

  useEffect(() => {
    const loadSchoolLevels = async () => {
      try {
        setLoadingLevels(true);
        const levels = await programService.getSchoolLevels();
        console.log('📊 Níveis carregados:', levels);
        setSchoolLevels(levels);
      } catch (error) {
        console.error('Erro ao carregar níveis de ensino:', error);
        showError('Erro', 'Não foi possível carregar os níveis de ensino');
      } finally {
        setLoadingLevels(false);
      }
    };
    loadSchoolLevels();

    // Preencher dados se estiver editando
    if (program) {
      console.log('📊 Editando programa:', program);
      setFormName(program.name || '');
      setFormCode(program.code || '');
      setFormSchoolLevelUuid(
        program.schoolLevel?.uuid ||
        program.schoolLevelUuid ||
        ''
      );
      setFormDescription(program.description || '');
    }
  }, [program]);

  const handleSchoolLevelChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    console.log('🔍 School Level UUID selecionado:', value);
    setFormSchoolLevelUuid(value);
    
    if (formErrors.schoolLevelUuid) {
      setFormErrors(prev => ({
        ...prev,
        schoolLevelUuid: undefined
      }));
    }
  };

  const validateForm = () => {
    const errors: { name?: string; code?: string; schoolLevelUuid?: string } = {};
    let isValid = true;

    if (!formName.trim()) {
      errors.name = 'Nome é obrigatório';
      isValid = false;
    }
    if (!formCode.trim()) {
      errors.code = 'Código é obrigatório';
      isValid = false;
    }
    if (!formSchoolLevelUuid || formSchoolLevelUuid === '') {
      errors.schoolLevelUuid = 'Nível de ensino é obrigatório';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const onSubmit = async () => {
    try {
      // Validar antes de enviar
      if (!validateForm()) {
        console.log('❌ Validação falhou:', formErrors);
        return;
      }

      setIsSubmitting(true);
      startLoading();

      // CORREÇÃO: Não converter UUID para número! UUID é string
      const payload: any = {
        name: formName.trim(),
        code: formCode.trim(),
        schoolLevelUuid: formSchoolLevelUuid, // Enviar como string, não Number()
        description: formDescription.trim() || '',
      };

      console.log('📤 Payload final:', payload);

      let response;
      if (isEditing && program) {
        response = await programService.update(program.uuid, payload);
        showSuccess('Programa atualizado', `${response.name} foi atualizado com sucesso`);
      } else {
        response = await programService.create(payload);
        showSuccess('Programa criado', `${response.name} foi criado com sucesso`);
      }

      onSuccess();
    } catch (error: any) {
      console.error('❌ Erro ao salvar programa:', error);
      console.error('❌ Resposta de erro:', error.response?.data);

      let errorMessage = 'Erro ao salvar programa. Tente novamente.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const messages = Object.values(error.response.data.errors).flat();
        errorMessage = messages.join(', ');
      }
      showError('Erro', errorMessage);
    } finally {
      setIsSubmitting(false);
      stopLoading();
    }
  };

  const levelOptions = schoolLevels.map(level => ({
    value: level.uuid,
    label: `${level.name} (${level.code})`,
  }));

  console.log('🔍 schoolLevels:', schoolLevels);
  console.log('🔍 levelOptions:', levelOptions);
  console.log('🔍 formSchoolLevelUuid atual:', formSchoolLevelUuid);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className={styles.form}>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <BookOpen size={16} />
          Informações do Programa
        </h4>
        <div className={styles.fields}>
          <div className={styles.field}>
            <Input
              label="Nome"
              placeholder="Ex: Engenharia Informática"
              leftIcon={<BookOpen size={16} />}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              error={formErrors.name}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Input
              label="Código"
              placeholder="Ex: ENG-INF"
              leftIcon={<Hash size={16} />}
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              error={formErrors.code}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Select
              label="Nível de Ensino"
              options={levelOptions}
              placeholder={loadingLevels ? 'Carregando...' : 'Selecione um nível'}
              value={formSchoolLevelUuid}
              onChange={handleSchoolLevelChange}
              error={formErrors.schoolLevelUuid}
              fullWidth
              disabled={loadingLevels}
            />
          </div>
          <div className={styles.field}>
            <Textarea
              label="Descrição"
              placeholder="Descreva o programa"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              fullWidth
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          icon={<X size={18} />}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          icon={<CheckCircle size={18} />}
        >
          {isEditing ? 'Atualizar' : 'Criar'} Programa
        </Button>
      </div>
    </form>
  );
};
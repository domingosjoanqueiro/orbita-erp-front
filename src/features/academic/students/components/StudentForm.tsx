'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/shared/components/ui/Input/Input';
import { Select } from '@/shared/components/ui/Select/Select';
import { Button } from '@/shared/components/ui/Button/Button';
import styles from './StudentForm.module.css';

const studentSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Data de nascimento é obrigatória'),
  document: z.string().min(11, 'Documento inválido'),
  address: z.object({
    street: z.string().min(1, 'Rua é obrigatória'),
    number: z.string().min(1, 'Número é obrigatório'),
    neighborhood: z.string().min(1, 'Bairro é obrigatório'),
    city: z.string().min(1, 'Cidade é obrigatória'),
    state: z.string().min(2, 'Estado é obrigatório'),
    zipCode: z.string().min(8, 'CEP inválido'),
  }),
  roleId: z.string().uuid('Role é obrigatória'),
  companyId: z.string().uuid('Empresa é obrigatória'),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface StudentFormProps {
  student?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const StudentForm: React.FC<StudentFormProps> = ({
  student,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!student;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: student || {
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      document: '',
      address: {
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
      },
      roleId: '',
      companyId: '',
    },
  });

  const onSubmit = async (data: StudentFormData) => {
    try {
      // Simular criação/atualização
      console.log('Dados do aluno:', data);
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar aluno:', error);
    }
  };

  // Dados mockados
  const roleOptions = [
    { value: '1', label: 'Estudante' },
    { value: '2', label: 'Professor' },
  ];

  const companyOptions = [
    { value: '1', label: 'Empresa A' },
    { value: '2', label: 'Empresa B' },
  ];

  const stateOptions = [
    { value: 'SP', label: 'São Paulo' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'MG', label: 'Minas Gerais' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Dados Pessoais</h3>
        <div className={styles.fields}>
          <div className={styles.field}>
            <Input
              label="Nome completo"
              placeholder="Nome do aluno"
              {...register('name')}
              error={errors.name?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Input
              label="Email"
              type="email"
              placeholder="email@exemplo.com"
              {...register('email')}
              error={errors.email?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Input
              label="Telefone"
              placeholder="(11) 99999-9999"
              {...register('phone')}
              error={errors.phone?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Input
              label="Data de Nascimento"
              type="date"
              {...register('dateOfBirth')}
              error={errors.dateOfBirth?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Input
              label="CPF"
              placeholder="123.456.789-00"
              {...register('document')}
              error={errors.document?.message}
              fullWidth
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Endereço</h3>
        <div className={styles.fields}>
          <div className={styles.field}>
            <Input
              label="Rua"
              placeholder="Nome da rua"
              {...register('address.street')}
              error={errors.address?.street?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Input
              label="Número"
              placeholder="123"
              {...register('address.number')}
              error={errors.address?.number?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Input
              label="Bairro"
              placeholder="Nome do bairro"
              {...register('address.neighborhood')}
              error={errors.address?.neighborhood?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Input
              label="Cidade"
              placeholder="Nome da cidade"
              {...register('address.city')}
              error={errors.address?.city?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Select
              label="Estado"
              options={stateOptions}
              {...register('address.state')}
              error={errors.address?.state?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Input
              label="CEP"
              placeholder="12345-678"
              {...register('address.zipCode')}
              error={errors.address?.zipCode?.message}
              fullWidth
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Configurações do Sistema</h3>
        <div className={styles.fields}>
          <div className={styles.field}>
            <Select
              label="Role"
              options={roleOptions}
              {...register('roleId')}
              error={errors.roleId?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Select
              label="Empresa"
              options={companyOptions}
              {...register('companyId')}
              error={errors.companyId?.message}
              fullWidth
            />
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEditing ? 'Atualizar' : 'Criar'} Aluno
        </Button>
      </div>
    </form>
  );
};
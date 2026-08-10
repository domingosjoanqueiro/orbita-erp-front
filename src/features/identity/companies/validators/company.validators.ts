import { z } from 'zod';

// Função para validar URL com ou sem protocolo
const validateWebsite = (url: string) => {
  if (!url) return true;
  // Se não tiver protocolo, adiciona https:// para validação
  const urlToCheck = url.match(/^https?:\/\//) ? url : `https://${url}`;
  try {
    new URL(urlToCheck);
    return true;
  } catch {
    return false;
  }
};

const addressSchema = z.object({
  street: z.string().min(1, 'Rua/Avenida é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(1, 'Província é obrigatória'),
  zipCode: z.string().min(4, 'Código postal inválido').optional(),
  country: z.string().min(1, 'País é obrigatório'),
});

export const createCompanySchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  document: z.string()
    .min(9, 'NUIT deve ter no mínimo 9 dígitos')
    .max(12, 'NUIT deve ter no máximo 12 dígitos')
    .regex(/^[0-9]+$/, 'NUIT deve conter apenas números'),
  email: z.string()
    .email('Email inválido')
    .max(100, 'Email deve ter no máximo 100 caracteres'),
  phone: z.string()
    .regex(/^(\+258|00258|0)?[0-9]{9,12}$/, 'Telefone inválido')
    .optional(),
  website: z.string()
    .refine(validateWebsite, 'URL inválida (ex: www.exemplo.com)')
    .optional()
    .transform(val => {
      // Normalizar: se não tiver protocolo, adiciona https://
      if (val && !val.match(/^https?:\/\//)) {
        return `https://${val}`;
      }
      return val;
    }),
  address: addressSchema.optional(),
  plan: z.enum(['basic', 'professional', 'enterprise']),
});

export const updateCompanySchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .optional(),
  document: z.string()
    .min(9, 'NUIT deve ter no mínimo 9 dígitos')
    .max(12, 'NUIT deve ter no máximo 12 dígitos')
    .regex(/^[0-9]+$/, 'NUIT deve conter apenas números')
    .optional(),
  email: z.string()
    .email('Email inválido')
    .max(100, 'Email deve ter no máximo 100 caracteres')
    .optional(),
  phone: z.string()
    .regex(/^(\+258|00258|0)?[0-9]{9,12}$/, 'Telefone inválido')
    .optional(),
  website: z.string()
    .refine(validateWebsite, 'URL inválida (ex: www.exemplo.com)')
    .optional()
    .transform(val => {
      if (val && !val.match(/^https?:\/\//)) {
        return `https://${val}`;
      }
      return val;
    }),
  address: addressSchema.partial().optional(),
  plan: z.enum(['basic', 'professional', 'enterprise']).optional(),
  isActive: z.boolean().optional(),
});

export const companyFiltersSchema = z.object({
  search: z.string().optional(),
  plan: z.enum(['basic', 'professional', 'enterprise']).optional(),
  isActive: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});
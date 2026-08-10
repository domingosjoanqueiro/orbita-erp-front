import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  description: z.string()
    .max(200, 'Descrição deve ter no máximo 200 caracteres')
    .optional(),
  permissionIds: z.array(z.string()).min(1, 'Selecione pelo menos uma permissão'),
  isDefault: z.boolean().default(false),
  color: z.string().optional(),
});

export const updateRoleSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')
    .optional(),
  description: z.string()
    .max(200, 'Descrição deve ter no máximo 200 caracteres')
    .optional(),
  permissionIds: z.array(z.string()).min(1, 'Selecione pelo menos uma permissão').optional(),
  isDefault: z.boolean().optional(),
  color: z.string().optional(),
});

export const roleFiltersSchema = z.object({
  search: z.string().optional(),
  isDefault: z.boolean().optional(),
  isSystem: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});
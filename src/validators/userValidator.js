const { z } = require('zod');

const updateRoleSchema = z.object({
  role: z.enum(['CLIENT', 'EMPLOYEE', 'ADMIN']),
});

const createTeamMemberSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis').max(100),
  lastName: z.string().min(1, 'Nom requis').max(100),
  email: z.string().email('Email invalide'),
  phone: z.string().max(30).optional(),
  company: z.string().max(150).optional(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').max(100),
  role: z.enum(['CLIENT', 'EMPLOYEE', 'ADMIN']).optional().default('EMPLOYEE'),
});

const setActiveSchema = z.object({
  isActive: z.boolean(),
});

module.exports = { updateRoleSchema, createTeamMemberSchema, setActiveSchema };

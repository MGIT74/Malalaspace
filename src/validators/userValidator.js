const { z } = require('zod');

const updateRoleSchema = z.object({
  role: z.enum(['CLIENT', 'EMPLOYEE', 'ADMIN']),
});

const createTeamMemberSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis').max(100),
  lastName: z.string().min(1, 'Nom requis').max(100),
  email: z.string().email('Email invalide'),
  phone: z.string().max(30).optional(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').max(100),
  role: z.enum(['EMPLOYEE', 'ADMIN']).optional().default('EMPLOYEE'),
});

module.exports = { updateRoleSchema, createTeamMemberSchema };

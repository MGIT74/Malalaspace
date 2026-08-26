const { z } = require('zod');

const addStepSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(200),
});

const adminCreateProjectSchema = z.object({
  clientId: z.number().int(),
  name: z.string().min(1, 'Nom du projet requis').max(200),
  companyName: z.string().max(200).optional(),
  website: z.string().url('URL invalide').max(255).optional().or(z.literal('')),
  industry: z.string().max(150).optional(),
  companyDesc: z.string().max(5000).optional(),
  saasDesc: z.string().max(5000).optional(),
  problemSolved: z.string().max(5000).optional(),
  targetAudience: z.string().max(2000).optional(),
});

module.exports = { addStepSchema, adminCreateProjectSchema };

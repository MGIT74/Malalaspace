const { z } = require('zod');

const createLeadSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis').max(100),
  lastName: z.string().min(1, 'Nom requis').max(100),
  email: z.string().email('Email invalide'),
  phone: z.string().min(1, 'Téléphone requis').max(30),
  company: z.string().min(1, 'Entreprise requise').max(150),
  message: z.string().min(1, 'Message requis').max(3000),
  source: z.enum(['CONTACT_FORM', 'CHATBOT', 'OTHER']).optional(),
});

const updateLeadStatusSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'REJECTED']),
});

const replyLeadSchema = z.object({
  message: z.string().min(1, 'Message vide').max(5000),
});

module.exports = { createLeadSchema, updateLeadStatusSchema, replyLeadSchema };

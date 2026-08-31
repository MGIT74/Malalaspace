const { z } = require('zod');

const createLeadSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().max(30).optional(),
  company: z.string().max(150).optional(),
  message: z.string().max(3000).optional(),
  source: z.enum(['CONTACT_FORM', 'CHATBOT', 'OTHER']).optional(),
});

const updateLeadStatusSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'REJECTED']),
});

const replyLeadSchema = z.object({
  message: z.string().min(1, 'Message vide').max(5000),
});

module.exports = { createLeadSchema, updateLeadStatusSchema, replyLeadSchema };

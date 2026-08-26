const { z } = require('zod');

const smtpSchema = z.object({
  host: z.string().max(255).optional(),
  port: z.string().max(10).optional(),
  user: z.string().max(255).optional(),
  password: z.string().max(255).optional(), // vide = ne pas modifier le mot de passe existant
  from: z.union([z.string().email(), z.literal('')]).optional(),
});

module.exports = { smtpSchema };

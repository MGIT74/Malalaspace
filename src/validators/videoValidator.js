const { z } = require('zod');

const createVideoSchema = z.object({
  videoUrl: z.string().url('URL invalide'),
  title: z.string().min(1, 'Titre requis').max(200),
  description: z.string().max(2000).optional(),
  isFinal: z.boolean().optional().default(false),
});

module.exports = { createVideoSchema };

const { z } = require('zod');

const createVideoSchema = z.object({
  videoUrl: z.string().url('URL invalide'),
  title: z.string().min(1, 'Titre requis').max(200),
  description: z.string().max(2000).optional(),
  isFinal: z.boolean().optional().default(false),
  notifyClient: z.boolean().optional().default(true),
});

const updateVideoSchema = z.object({
  videoUrl: z.string().url('URL invalide').optional(),
  title: z.string().min(1, 'Titre requis').max(200).optional(),
  description: z.string().max(2000).optional(),
  isFinal: z.boolean().optional(),
  notifyClient: z.boolean().optional().default(false),
});

module.exports = { createVideoSchema, updateVideoSchema };

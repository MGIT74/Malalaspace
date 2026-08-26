const { z } = require('zod');

const updateStepSchema = z.object({
  status: z.enum(['UPCOMING', 'IN_PROGRESS', 'DONE', 'BLOCKED']).optional(),
  progress: z.number().min(0).max(100).optional(),
  description: z.string().max(2000).optional(),
});

module.exports = { updateStepSchema };

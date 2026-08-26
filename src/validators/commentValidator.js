const { z } = require('zod');

const createCommentSchema = z.object({
  content: z.string().min(1, 'Commentaire vide').max(3000),
  timecode: z.string().max(20).optional(), // ex: "00:18"
  videoVersionId: z.number().int().optional(),
  parentCommentId: z.number().int().optional(),
});

const updateCommentStatusSchema = z.object({
  status: z.enum(['TO_HANDLE', 'IN_PROGRESS', 'RESOLVED']),
});

module.exports = { createCommentSchema, updateCommentStatusSchema };

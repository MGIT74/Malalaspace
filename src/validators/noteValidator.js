const { z } = require('zod');

const createNoteSchema = z.object({
  content: z.string().min(1, 'Note vide').max(3000),
});

module.exports = { createNoteSchema };

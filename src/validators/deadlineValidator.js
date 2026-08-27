const { z } = require('zod');

const updateDeadlineSchema = z.object({
  deadline: z.string().nullable().optional(), // ISO date string, ou null pour effacer
});

module.exports = { updateDeadlineSchema };

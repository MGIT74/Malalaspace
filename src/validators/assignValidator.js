const { z } = require('zod');

const assignProjectSchema = z.object({
  employeeId: z.number().int(),
});

module.exports = { assignProjectSchema };

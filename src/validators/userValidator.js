const { z } = require('zod');

const updateRoleSchema = z.object({
  role: z.enum(['CLIENT', 'EMPLOYEE', 'ADMIN']),
});

module.exports = { updateRoleSchema };

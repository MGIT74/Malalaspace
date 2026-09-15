const { z } = require('zod');

const createCheckoutSchema = z.object({
  type: z.enum(['DEPOSIT', 'BALANCE']),
});

module.exports = { createCheckoutSchema };

const { z } = require('zod');

const sendMessageSchema = z.object({
  message: z.string().min(1, 'Message vide').max(4000),
  sessionId: z.string().max(200).optional(),
});

module.exports = { sendMessageSchema };

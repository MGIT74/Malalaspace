const { z } = require('zod');

const offerItemSchema = z.object({
  id: z.enum(['STANDARD', 'PREMIUM']),
  name: z.string().min(1).max(100),
  price: z.number().int().min(0),
  currency: z.string().min(1).max(10),
  deliveryEstimate: z.string().min(1).max(100),
  videoUrl: z.union([z.string().url(), z.literal('')]).optional(),
  features: z.array(z.string().min(1).max(300)).min(1).max(40),
});

const updateOffersSchema = z.array(offerItemSchema).length(2);

module.exports = { updateOffersSchema };

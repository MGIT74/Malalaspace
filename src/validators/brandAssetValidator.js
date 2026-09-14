const { z } = require('zod');

const colorItemSchema = z.object({
  id: z.string().max(60).nullable().optional(),
  label: z.string().max(50),
  hex: z.string().max(20),
});

const updateColorsSchema = z.object({
  colors: z.array(colorItemSchema).max(12),
});

module.exports = { updateColorsSchema };

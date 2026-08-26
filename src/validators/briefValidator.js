const { z } = require('zod');

const TONES = [
  'professionnel',
  'moderne',
  'dynamique',
  'pédagogique',
  'premium',
  'humoristique',
  'minimaliste',
];

const upsertBriefSchema = z.object({
  objective: z.string().max(2000).optional(),
  targetAudience: z.string().max(2000).optional(),
  productDescription: z.string().max(3000).optional(),
  mainMessage: z.string().max(2000).optional(),
  callToAction: z.string().max(300).optional(),
  tone: z.enum(TONES).optional(),
  duration: z.string().max(50).optional(), // ex: "30-45s"
  platform: z.string().max(150).optional(), // ex: "YouTube, LinkedIn"
  format: z.string().max(100).optional(), // ex: "16:9", "9:16"
  language: z.string().max(50).optional(),
  script: z.string().max(20000).optional(),
  isDraft: z.boolean().optional().default(true),
});

module.exports = { upsertBriefSchema, TONES };

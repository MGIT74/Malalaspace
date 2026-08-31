const crypto = require('crypto');
const prisma = require('../config/db');
const ApiError = require('../utils/apiError');

const HASH_KEY = 'api_key_hash';
const META_KEY = 'api_key_meta'; // JSON: { createdAt, label }

function hashKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Génère une nouvelle clé API (remplace toute clé existante). La clé brute n'est
 * jamais stockée — seul son hash l'est — et n'est retournée qu'une seule fois ici.
 */
async function generate(admin, label) {
  if (admin.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }
  const rawKey = 'mls_' + crypto.randomBytes(32).toString('hex');
  const meta = { createdAt: new Date().toISOString(), label: label || 'Agent IA (n8n)' };

  await Promise.all([
    prisma.setting.upsert({ where: { id: HASH_KEY }, update: { value: hashKey(rawKey) }, create: { id: HASH_KEY, value: hashKey(rawKey) } }),
    prisma.setting.upsert({ where: { id: META_KEY }, update: { value: JSON.stringify(meta) }, create: { id: META_KEY, value: JSON.stringify(meta) } }),
  ]);

  return { rawKey, ...meta };
}

async function getStatus(admin) {
  if (admin.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }
  const row = await prisma.setting.findUnique({ where: { id: META_KEY } });
  if (!row) return { exists: false };
  try {
    return { exists: true, ...JSON.parse(row.value) };
  } catch (err) {
    return { exists: true };
  }
}

async function revoke(admin) {
  if (admin.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }
  await prisma.setting.deleteMany({ where: { id: { in: [HASH_KEY, META_KEY] } } });
}

/**
 * Vérifie une clé API brute reçue dans le header X-API-Key. Retourne true/false.
 */
async function verify(rawKey) {
  if (!rawKey) return false;
  const row = await prisma.setting.findUnique({ where: { id: HASH_KEY } });
  if (!row) return false;
  return row.value === hashKey(rawKey);
}

module.exports = { generate, getStatus, revoke, verify };

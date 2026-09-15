const prisma = require('../config/db');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Enregistre un événement dans le journal d'activité. Ne lève jamais d'erreur :
 * un échec de journalisation ne doit jamais faire planter l'action réelle.
 */
async function log(type, message, userId) {
  try {
    await prisma.activityLog.create({ data: { type, message, userId: userId || null } });
  } catch (err) {
    logger.error('Échec journalisation:', err.message);
  }
}

async function listLogs(user, limit = 150) {
  if (user.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }
  return prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 300),
  });
}

module.exports = { log, listLogs };

const settingsService = require('./settingsService');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Envoie un message au workflow n8n "Assistant IA commercial - Malalaspace"
 * (nœud Chat Trigger, webhook public) et retourne sa réponse.
 * Réservé au super admin — c'est un outil interne, pas le chat public du site.
 */
async function sendMessage(user, message, sessionId) {
  if (user.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }

  const webhookUrl = await settingsService.getChatbotWebhookUrl();
  if (!webhookUrl) {
    throw ApiError.badRequest("Aucune URL de webhook n8n configurée. Renseigne-la dans Paramètres > Intégrations.");
  }

  let response;
  try {
    response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatInput: message, sessionId: sessionId || 'admin-panel' }),
    });
  } catch (err) {
    logger.error('Échec appel webhook chatbot n8n:', err.message);
    throw ApiError.badRequest("Impossible de contacter l'agent IA (n8n). Vérifie l'URL du webhook et que le workflow est actif.");
  }

  if (!response.ok) {
    throw ApiError.badRequest(`L'agent IA a répondu avec une erreur (${response.status}).`);
  }

  const data = await response.json().catch(() => null);
  const reply = data?.output || data?.text || data?.reply || (typeof data === 'string' ? data : null);
  if (!reply) {
    throw ApiError.badRequest("Réponse inattendue de l'agent IA (format non reconnu).");
  }

  return reply;
}

module.exports = { sendMessage };

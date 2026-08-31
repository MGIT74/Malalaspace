const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const apiKeyService = require('../services/apiKeyService');

/**
 * Autorise soit un token JWT admin classique (utilisateur connecté dans l'app),
 * soit une clé API valide (X-API-Key) — utilisée par des intégrations externes
 * comme un agent n8n qui doit lire/répondre aux leads sans compte utilisateur.
 */
const requireApiKeyOrAdmin = asyncHandler(async (req, res, next) => {
  const providedKey = req.headers['x-api-key'];

  if (providedKey) {
    const isValid = await apiKeyService.verify(providedKey);
    if (!isValid) {
      throw ApiError.unauthorized('Clé API invalide.');
    }
    req.user = { id: null, role: 'SERVICE' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Authentification requise (compte admin ou clé API).');
  }

  let payload;
  try {
    payload = jwt.verify(authHeader.split(' ')[1], env.jwt.accessSecret);
  } catch (err) {
    throw ApiError.unauthorized('Token invalide ou expiré.');
  }

  if (payload.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }

  req.user = { id: payload.sub, role: payload.role };
  next();
});

module.exports = requireApiKeyOrAdmin;

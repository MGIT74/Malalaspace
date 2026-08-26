const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Vérifie le header Authorization: Bearer <token>
 * Attache req.user = { id, role } si valide.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Token d\'authentification manquant.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.jwt.accessSecret);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    throw ApiError.unauthorized('Token invalide ou expiré.');
  }
});

module.exports = authenticate;

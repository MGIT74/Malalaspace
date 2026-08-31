const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/db');

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

  let payload;
  try {
    payload = jwt.verify(token, env.jwt.accessSecret);
  } catch (err) {
    throw ApiError.unauthorized('Token invalide ou expiré.');
  }

  // Vérifie que le compte n'a pas été suspendu depuis l'émission du token
  // (un JWT est stateless, donc sans cette vérification une suspension ne prendrait
  // effet qu'à l'expiration naturelle du token, jusqu'à 15 minutes plus tard).
  const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { isActive: true } });
  if (!user || !user.isActive) {
    throw ApiError.forbidden('Ce compte a été suspendu.');
  }

  req.user = { id: payload.sub, role: payload.role };
  next();
});

module.exports = authenticate;

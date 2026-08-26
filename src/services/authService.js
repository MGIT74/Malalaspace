const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const ApiError = require('../utils/apiError');
const tokenService = require('./tokenService');

const SALT_ROUNDS = 12;

function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function register({ firstName, lastName, email, phone, company, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict('Un compte existe déjà avec cet email.');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      company,
      passwordHash,
      role: 'CLIENT', // Seul un admin peut créer des comptes EMPLOYEE/ADMIN (à faire plus tard)
    },
  });

  const tokens = await tokenService.issueTokenPair(user);

  // TODO Phase 4: déclencher l'envoi de l'email de vérification via emailService

  return { user: sanitizeUser(user), tokens };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw ApiError.unauthorized('Email ou mot de passe incorrect.');
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    throw ApiError.unauthorized('Email ou mot de passe incorrect.');
  }

  const tokens = await tokenService.issueTokenPair(user);

  return { user: sanitizeUser(user), tokens };
}

async function refresh(refreshTokenValue) {
  const tokens = await tokenService.rotateRefreshToken(refreshTokenValue);
  if (!tokens) {
    throw ApiError.unauthorized('Refresh token invalide ou expiré.');
  }
  return tokens;
}

async function logout(refreshTokenValue) {
  await tokenService.revokeRefreshToken(refreshTokenValue);
}

async function getProfile(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('Utilisateur introuvable.');
  return sanitizeUser(user);
}

module.exports = { register, login, refresh, logout, getProfile, sanitizeUser };

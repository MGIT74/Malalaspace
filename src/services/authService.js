const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../config/db');
const ApiError = require('../utils/apiError');
const tokenService = require('./tokenService');
const emailService = require('./emailService');

const SALT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 heure

function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function register({ firstName, lastName, email, phone, company, password }, frontendUrl) {
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

  const verifyUrl = await issueEmailVerificationLink(user, frontendUrl);

  emailService.sendEmail({
    to: user.email,
    subject: 'Bienvenue sur Malalaspace',
    html: emailService.templates.welcome(user.firstName, verifyUrl),
  }).catch(() => {}); // best-effort, ne bloque jamais l'inscription

  return { user: sanitizeUser(user), tokens };
}

async function issueEmailVerificationLink(user, frontendUrl) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await prisma.emailVerificationToken.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });
  return `${frontendUrl}/#/verify-email/${rawToken}`;
}

async function verifyEmail(rawToken) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const record = await prisma.emailVerificationToken.findFirst({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw ApiError.badRequest('Lien de vérification invalide ou expiré.');
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
    prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
}

async function resendVerification(userId, frontendUrl) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.emailVerified) return;
  const verifyUrl = await issueEmailVerificationLink(user, frontendUrl);
  emailService.sendEmail({
    to: user.email,
    subject: 'Confirmez votre adresse email',
    html: emailService.templates.welcome(user.firstName, verifyUrl),
  }).catch(() => {});
}

async function updateProfile(userId, data) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      company: data.company,
    },
  });
  return sanitizeUser(user);
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw ApiError.badRequest('Mot de passe actuel incorrect.');
  }
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  // Révoque toutes les autres sessions par sécurité (garde la session courante active jusqu'à expiration naturelle)
  await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
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

/**
 * Toujours répondre de façon générique (même si l'email n'existe pas) pour ne pas
 * révéler quels emails sont enregistrés.
 */
async function forgotPassword(email, frontendUrl) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // silencieux, comportement volontaire

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const resetUrl = `${frontendUrl}/#/reset-password/${rawToken}`;

  emailService.sendEmail({
    to: user.email,
    subject: 'Réinitialisation de votre mot de passe',
    html: emailService.templates.resetPassword(resetUrl),
  }).catch(() => {});
}

async function resetPassword(rawToken, newPassword) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const resetToken = await prisma.passwordResetToken.findFirst({ where: { tokenHash } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw ApiError.badRequest('Lien de réinitialisation invalide ou expiré.');
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    // Invalide toutes les sessions existantes par sécurité (l'utilisateur devra se reconnecter partout)
    prisma.refreshToken.updateMany({ where: { userId: resetToken.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
}

module.exports = { register, login, refresh, logout, getProfile, sanitizeUser, forgotPassword, resetPassword, verifyEmail, resendVerification, updateProfile, changePassword };

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');
const prisma = require('../config/db');

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpires,
  });
}

function generateRefreshTokenValue() {
  // Token opaque (pas un JWT) : plus simple à révoquer, on ne stocke que son hash en DB
  return crypto.randomBytes(64).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseExpiryToDate(expiresIn) {
  // Convertit "7d", "15m" etc. en Date absolue
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) throw new Error(`Format d'expiration invalide: ${expiresIn}`);
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return new Date(Date.now() + value * multipliers[unit]);
}

async function issueTokenPair(user) {
  const accessToken = signAccessToken(user);
  const refreshTokenValue = generateRefreshTokenValue();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshTokenValue),
      expiresAt: parseExpiryToDate(env.jwt.refreshExpires),
    },
  });

  return { accessToken, refreshToken: refreshTokenValue };
}

/**
 * Vérifie un refresh token, le révoque (rotation) et en émet un nouveau couple.
 * Lève une erreur si invalide, expiré ou déjà révoqué.
 */
async function rotateRefreshToken(refreshTokenValue) {
  const tokenHash = hashToken(refreshTokenValue);

  const existing = await prisma.refreshToken.findFirst({
    where: { tokenHash },
    include: { user: true },
  });

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    return null;
  }

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  return issueTokenPair(existing.user);
}

async function revokeRefreshToken(refreshTokenValue) {
  const tokenHash = hashToken(refreshTokenValue);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

module.exports = {
  signAccessToken,
  issueTokenPair,
  rotateRefreshToken,
  revokeRefreshToken,
  hashToken,
};

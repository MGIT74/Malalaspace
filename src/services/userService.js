const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const ApiError = require('../utils/apiError');
const emailService = require('./emailService');

const SALT_ROUNDS = 12;
const VALID_ROLES = ['CLIENT', 'EMPLOYEE', 'ADMIN'];

async function listClients(user) {
  if (!['ADMIN', 'EMPLOYEE'].includes(user.role)) {
    throw ApiError.forbidden();
  }

  const clients = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      company: true,
      createdAt: true,
      _count: { select: { projectsAsClient: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return clients.map((c) => ({
    ...c,
    projectCount: c._count.projectsAsClient,
    _count: undefined,
  }));
}

/**
 * Liste tous les utilisateurs (tous rôles confondus) — réservé à l'admin,
 * pour la gestion des rôles.
 */
async function listAllUsers(user) {
  if (user.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }

  return prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      company: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Change le rôle d'un utilisateur. Réservé à l'admin.
 * Un admin ne peut pas changer son propre rôle via cette route (garde-fou anti-verrouillage).
 */
async function updateUserRole(user, targetUserId, newRole) {
  if (user.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }
  if (!VALID_ROLES.includes(newRole)) {
    throw ApiError.badRequest('Rôle invalide.');
  }
  if (Number(targetUserId) === user.id) {
    throw ApiError.badRequest('Vous ne pouvez pas modifier votre propre rôle.');
  }

  const target = await prisma.user.findUnique({ where: { id: Number(targetUserId) } });
  if (!target) {
    throw ApiError.notFound('Utilisateur introuvable.');
  }

  return prisma.user.update({
    where: { id: Number(targetUserId) },
    data: { role: newRole },
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  });
}

/**
 * Liste l'équipe (employés + admins), visible par l'équipe elle-même (pas les clients).
 */
async function listTeam(user) {
  if (!['ADMIN', 'EMPLOYEE'].includes(user.role)) {
    throw ApiError.forbidden();
  }

  const team = await prisma.user.findMany({
    where: { role: { in: ['EMPLOYEE', 'ADMIN'] } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      _count: { select: { projectsAssigned: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return team.map((m) => ({ ...m, projectCount: m._count.projectsAssigned, _count: undefined }));
}

/**
 * Création directe d'un membre d'équipe par l'admin (motion designer, monteur, etc.),
 * sans passer par l'inscription publique. Le mot de passe est défini par l'admin
 * et communiqué directement à la personne (jamais envoyé par email en clair).
 */
async function createTeamMember(admin, data) {
  if (admin.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw ApiError.conflict('Un compte existe déjà avec cet email.');
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  const member = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      passwordHash,
      role: data.role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE',
      emailVerified: true, // créé directement par l'admin, pas besoin de vérification
    },
  });

  emailService.sendEmail({
    to: member.email,
    subject: 'Votre accès Malalaspace',
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;"><h2 style="color:#0A84FF;">Bienvenue dans l'équipe</h2><p>Bonjour ${member.firstName},</p><p>Un compte vient d'être créé pour vous sur Malalaspace. Contactez votre administrateur pour obtenir votre mot de passe.</p></div>`,
  }).catch(() => {});

  const { passwordHash: _omit, ...safeMember } = member;
  return safeMember;
}

module.exports = { listClients, listAllUsers, listTeam, createTeamMember, updateUserRole, VALID_ROLES };

const prisma = require('../config/db');
const ApiError = require('../utils/apiError');

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

module.exports = { listClients, listAllUsers, updateUserRole, VALID_ROLES };

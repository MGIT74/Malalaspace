const prisma = require('../config/db');
const ApiError = require('../utils/apiError');

/**
 * Étapes par défaut de la timeline (Phase 2 les rendra configurables par l'admin)
 */
const DEFAULT_STEPS = [
  'Nouveau projet',
  'Brief à compléter',
  'Brief validé',
  'Script',
  'Storyboard',
  'Design 2D',
  'Animation',
  'Première version',
  'Révisions',
  'Validation client',
  'Prêt pour livraison',
  'Paiement du solde',
  'Livré',
];

/**
 * Retourne la clause `where` Prisma adaptée au rôle de l'utilisateur.
 * CLIENT       -> uniquement ses propres projets
 * EMPLOYEE     -> uniquement les projets qui lui sont attribués
 * ADMIN        -> tous les projets
 */
function scopeForUser(user) {
  if (user.role === 'CLIENT') {
    return { clientId: user.id };
  }
  if (user.role === 'EMPLOYEE') {
    return { assignedUserId: user.id };
  }
  return {}; // ADMIN : pas de restriction
}

async function listProjects(user) {
  return prisma.project.findMany({
    where: scopeForUser(user),
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, company: true } },
      assignedUser: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

async function createProject(user, data) {
  if (user.role !== 'CLIENT') {
    // Seul un client crée un projet pour lui-même à ce stade (Phase 1).
    // L'admin pourra créer un projet pour un client tiers en Phase 2.
    throw ApiError.forbidden('Seul un client peut créer un projet.');
  }

  const project = await prisma.project.create({
    data: {
      clientId: user.id,
      name: data.name,
      companyName: data.companyName || null,
      website: data.website || null,
      industry: data.industry || null,
      companyDesc: data.companyDesc || null,
      saasDesc: data.saasDesc || null,
      problemSolved: data.problemSolved || null,
      targetAudience: data.targetAudience || null,
      status: 'NEW',
      progress: 0,
      steps: {
        create: DEFAULT_STEPS.map((name, index) => ({
          name,
          order: index,
          status: index === 0 ? 'IN_PROGRESS' : 'UPCOMING',
        })),
      },
    },
    include: { steps: { orderBy: { order: 'asc' } } },
  });

  return project;
}

/**
 * Vérifie que l'utilisateur a le droit d'accéder au projet, puis le retourne.
 * Lève 404 (et non 403) si le projet n'existe pas OU n'appartient pas à l'utilisateur,
 * pour ne pas révéler l'existence d'un projet à quelqu'un qui n'y a pas accès.
 */
async function getProjectForUser(user, projectId) {
  const project = await prisma.project.findUnique({
    where: { id: Number(projectId) },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, company: true, email: true } },
      assignedUser: { select: { id: true, firstName: true, lastName: true } },
      steps: { orderBy: { order: 'asc' } },
      brief: true,
      brandAsset: true,
    },
  });

  if (!project) {
    throw ApiError.notFound('Projet introuvable.');
  }

  const hasAccess =
    user.role === 'ADMIN' ||
    (user.role === 'CLIENT' && project.clientId === user.id) ||
    (user.role === 'EMPLOYEE' && project.assignedUserId === user.id);

  if (!hasAccess) {
    throw ApiError.notFound('Projet introuvable.');
  }

  return project;
}

module.exports = { listProjects, createProject, getProjectForUser, scopeForUser };

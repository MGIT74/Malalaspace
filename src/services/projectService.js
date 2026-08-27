const prisma = require('../config/db');
const ApiError = require('../utils/apiError');
const notificationService = require('./notificationService');

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
    // L'admin utilise createProjectForClient ci-dessous.
    throw ApiError.forbidden('Seul un client peut créer un projet.');
  }

  return createProjectInternal(user.id, data);
}

/**
 * Un admin crée un projet pour un client existant (ex: onboarding fait par téléphone).
 */
async function createProjectForClient(admin, clientId, data) {
  if (admin.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }
  const client = await prisma.user.findUnique({ where: { id: Number(clientId) } });
  if (!client || client.role !== 'CLIENT') {
    throw ApiError.badRequest("L'utilisateur cible n'est pas un client.");
  }
  return createProjectInternal(client.id, data);
}

async function createProjectInternal(clientId, data) {
  const project = await prisma.project.create({
    data: {
      clientId,
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
 * Supprime un projet et toutes ses données associées (cascade DB). Réservé à l'admin.
 * Les fichiers sur disque sont nettoyés au mieux (best-effort), une erreur de suppression
 * de fichier n'empêche jamais la suppression du projet en base.
 */
async function deleteProject(user, projectId) {
  if (user.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }

  const project = await prisma.project.findUnique({ where: { id: Number(projectId) } });
  if (!project) {
    throw ApiError.notFound('Projet introuvable.');
  }

  const files = await prisma.file.findMany({ where: { projectId: project.id } });
  const storageService = require('./storageService');
  const provider = storageService.getProvider();
  await Promise.all(files.map((f) => provider.remove(f.fileUrl).catch(() => {})));

  await prisma.project.delete({ where: { id: project.id } });
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

/**
 * Attribue un projet à un employé. Réservé à l'admin.
 */
async function assignProject(user, projectId, employeeId) {
  if (user.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }

  const employee = await prisma.user.findUnique({ where: { id: Number(employeeId) } });
  if (!employee || employee.role !== 'EMPLOYEE') {
    throw ApiError.badRequest('Cet utilisateur n\'est pas un employé.');
  }

  const project = await prisma.project.update({
    where: { id: Number(projectId) },
    data: { assignedUserId: employee.id },
  });

  await notificationService.createNotification(
    employee.id,
    project.id,
    'project_assigned',
    'Nouveau projet attribué',
    `Le projet "${project.name}" vous a été attribué.`
  );

  return project;
}

/**
 * Met à jour la deadline d'un projet. Réservé à l'admin ou à l'employé assigné.
 */
async function updateDeadline(user, projectId, deadline) {
  const project = await getProjectForUser(user, projectId);
  const canEdit = user.role === 'ADMIN' || (user.role === 'EMPLOYEE' && project.assignedUserId === user.id);
  if (!canEdit) {
    throw ApiError.forbidden();
  }
  return prisma.project.update({
    where: { id: Number(projectId) },
    data: { deadline: deadline ? new Date(deadline) : null },
  });
}

module.exports = { listProjects, createProject, createProjectForClient, deleteProject, getProjectForUser, scopeForUser, assignProject, updateDeadline };

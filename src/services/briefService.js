const prisma = require('../config/db');
const projectService = require('./projectService');
const ApiError = require('../utils/apiError');

/**
 * Récupère le brief d'un projet (après vérification d'accès au projet).
 * Retourne null si le brief n'a pas encore été créé (pas une erreur : c'est l'état initial).
 */
async function getBrief(user, projectId) {
  await projectService.getProjectForUser(user, projectId); // lève 404 si pas d'accès

  return prisma.projectBrief.findUnique({ where: { projectId: Number(projectId) } });
}

/**
 * Crée ou met à jour le brief. Seul le client propriétaire du projet peut le faire
 * (l'équipe le consulte mais ne le modifie pas directement — elle utilise les notes internes).
 */
async function upsertBrief(user, projectId, data) {
  const project = await projectService.getProjectForUser(user, projectId);

  if (user.role === 'CLIENT' && project.clientId !== user.id) {
    throw ApiError.forbidden();
  }
  if (user.role !== 'CLIENT' && user.role !== 'ADMIN') {
    throw ApiError.forbidden('Seul le client (ou un admin) peut modifier le brief.');
  }

  const brief = await prisma.projectBrief.upsert({
    where: { projectId: Number(projectId) },
    update: data,
    create: { projectId: Number(projectId), ...data },
  });

  // Si le brief est soumis (isDraft: false) et que le projet est encore au tout début,
  // on avance la timeline à l'étape "Brief à compléter" -> "Brief validé".
  if (data.isDraft === false && project.status === 'NEW') {
    await prisma.project.update({
      where: { id: Number(projectId) },
      data: { status: 'BRIEF_PENDING' },
    });
  }

  return brief;
}

module.exports = { getBrief, upsertBrief };

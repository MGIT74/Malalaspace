const prisma = require('../config/db');
const ApiError = require('../utils/apiError');

function canManageVideos(user, project) {
  return user.role === 'ADMIN' || (user.role === 'EMPLOYEE' && project.assignedUserId === user.id);
}

async function listVersions(project) {
  return prisma.videoVersion.findMany({
    where: { projectId: project.id },
    orderBy: { versionNumber: 'asc' },
    include: { author: { select: { id: true, firstName: true, lastName: true } } },
  });
}

async function createVersion(user, project, data) {
  if (!canManageVideos(user, project)) {
    throw ApiError.forbidden("Seule l'équipe assignée peut ajouter une vidéo.");
  }

  const last = await prisma.videoVersion.findFirst({
    where: { projectId: project.id },
    orderBy: { versionNumber: 'desc' },
  });
  const versionNumber = (last?.versionNumber || 0) + 1;

  const version = await prisma.videoVersion.create({
    data: {
      projectId: project.id,
      createdBy: user.id,
      versionNumber,
      title: data.title,
      videoUrl: data.videoUrl,
      description: data.description || null,
      isFinal: data.isFinal || false,
      status: 'pending',
    },
  });

  // Une nouvelle version disponible => le projet passe en révision (ou prêt pour livraison si c'est la version finale)
  await prisma.project.update({
    where: { id: project.id },
    data: { status: data.isFinal ? 'READY_FOR_DELIVERY' : 'IN_REVIEW' },
  });

  return version;
}

/**
 * Le client valide une version. Seul le client propriétaire peut valider.
 */
async function validateVersion(user, project, videoId) {
  if (user.role !== 'CLIENT' || project.clientId !== user.id) {
    throw ApiError.forbidden('Seul le client peut valider une version.');
  }

  const version = await prisma.videoVersion.findUnique({ where: { id: Number(videoId) } });
  if (!version || version.projectId !== project.id) {
    throw ApiError.notFound('Version introuvable.');
  }
  if (version.validatedAt) {
    throw ApiError.conflict('Cette version a déjà été validée.');
  }

  const updated = await prisma.videoVersion.update({
    where: { id: version.id },
    data: { validatedAt: new Date(), validatedBy: user.id, status: 'validated' },
  });

  await prisma.project.update({
    where: { id: project.id },
    data: { status: version.isFinal ? 'READY_FOR_DELIVERY' : 'IN_PRODUCTION' },
  });

  return updated;
}

module.exports = { listVersions, createVersion, validateVersion };

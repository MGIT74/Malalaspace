const prisma = require('../config/db');
const ApiError = require('../utils/apiError');
const notificationService = require('./notificationService');
const emailService = require('./emailService');
const env = require('../config/env');

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

async function notifyClientVideoReady(project, versionTitle) {
  await notificationService.createNotification(
    project.clientId,
    project.id,
    'video_ready',
    'Nouvelle vidéo disponible',
    `Une nouvelle version de "${project.name}" est disponible : ${versionTitle}.`
  );

  const clientUser = await prisma.user.findUnique({ where: { id: project.clientId } });
  if (clientUser) {
    emailService.sendEmail({
      to: clientUser.email,
      subject: 'Nouvelle vidéo disponible',
      html: emailService.templates.videoReady(project.name, versionTitle, env.frontendUrl),
    }).catch(() => {});
  }
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

  // La notification/email au client n'est envoyée que si explicitement demandé
  // (double validation côté interface avant d'avertir le client).
  if (data.notifyClient !== false) {
    await notifyClientVideoReady(project, data.title);
  }

  return version;
}

/**
 * Modifie une version existante (titre, lien vidéo, description, finale ou non).
 * Bloquée si le client l'a déjà validée, pour ne pas modifier une version approuvée.
 * Peut optionnellement renotifier le client par email (double validation côté interface).
 */
async function updateVersion(user, project, videoId, data) {
  if (!canManageVideos(user, project)) {
    throw ApiError.forbidden("Seule l'équipe assignée peut modifier une vidéo.");
  }

  const version = await prisma.videoVersion.findUnique({ where: { id: Number(videoId) } });
  if (!version || version.projectId !== project.id) {
    throw ApiError.notFound('Version introuvable.');
  }
  if (version.validatedAt) {
    throw ApiError.conflict('Cette version a déjà été validée par le client, elle ne peut plus être modifiée.');
  }

  const updated = await prisma.videoVersion.update({
    where: { id: version.id },
    data: {
      title: data.title ?? version.title,
      videoUrl: data.videoUrl ?? version.videoUrl,
      description: data.description !== undefined ? data.description : version.description,
      isFinal: data.isFinal ?? version.isFinal,
    },
  });

  if (data.notifyClient) {
    await notifyClientVideoReady(project, updated.title);
  }

  return updated;
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

  await notificationService.createNotification(
    project.assignedUserId,
    project.id,
    'validation',
    'Version validée par le client',
    `Le client a validé la version "${version.title}" de "${project.name}".`
  );

  if (project.assignedUserId) {
    const employee = await prisma.user.findUnique({ where: { id: project.assignedUserId } });
    if (employee) {
      emailService.sendEmail({
        to: employee.email,
        subject: 'Version validée par le client',
        html: emailService.templates.validation(project.name, version.title),
      }).catch(() => {});
    }
  }

  return updated;
}

/**
 * Supprime une version vidéo (et ses commentaires associés, en cascade).
 * Réservé à l'admin ou à l'employé assigné.
 */
async function deleteVersion(user, project, videoId) {
  if (!canManageVideos(user, project)) {
    throw ApiError.forbidden("Seule l'équipe assignée peut supprimer une vidéo.");
  }
  const version = await prisma.videoVersion.findUnique({ where: { id: Number(videoId) } });
  if (!version || version.projectId !== project.id) {
    throw ApiError.notFound('Version introuvable.');
  }
  await prisma.videoVersion.delete({ where: { id: version.id } });
}

module.exports = { listVersions, createVersion, updateVersion, validateVersion, deleteVersion };

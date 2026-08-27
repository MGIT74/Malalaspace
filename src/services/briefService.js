const prisma = require('../config/db');
const projectService = require('./projectService');
const notificationService = require('./notificationService');
const emailService = require('./emailService');
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
 *
 * Logique de statut :
 * - Premier enregistrement (brouillon) sur un projet NEW -> passe à BRIEF_PENDING
 * - Validation (isDraft: false) -> passe à BRIEF_VALIDATED + notif/email à l'équipe
 * - Si le client modifie à nouveau un brief déjà validé -> repasse à BRIEF_PENDING
 *   (la validation précédente n'est plus considérée comme à jour) + notif à l'équipe
 *   pour lui signaler qu'une re-vérification est nécessaire.
 */
async function upsertBrief(user, projectId, data) {
  const project = await projectService.getProjectForUser(user, projectId);

  if (user.role === 'CLIENT' && project.clientId !== user.id) {
    throw ApiError.forbidden();
  }
  if (user.role !== 'CLIENT' && user.role !== 'ADMIN') {
    throw ApiError.forbidden('Seul le client (ou un admin) peut modifier le brief.');
  }

  const existingBrief = await prisma.projectBrief.findUnique({ where: { projectId: Number(projectId) } });
  const wasValidated = existingBrief ? existingBrief.isDraft === false : false;

  const brief = await prisma.projectBrief.upsert({
    where: { projectId: Number(projectId) },
    update: data,
    create: { projectId: Number(projectId), ...data },
  });

  if (data.isDraft === false) {
    // Validation (première fois ou re-validation après modification)
    if (['NEW', 'BRIEF_PENDING'].includes(project.status)) {
      await prisma.project.update({ where: { id: project.id }, data: { status: 'BRIEF_VALIDATED' } });
    }

    await notificationService.createNotification(
      project.assignedUserId,
      project.id,
      'brief_validated',
      'Brief client validé',
      `Le client a validé le brief de "${project.name}".`
    );

    if (project.assignedUserId) {
      const employee = await prisma.user.findUnique({ where: { id: project.assignedUserId } });
      if (employee) {
        emailService.sendEmail({
          to: employee.email,
          subject: 'Brief client validé',
          html: emailService.templates.briefValidated(project.name),
        }).catch(() => {});
      }
    }
  } else if (data.isDraft === true) {
    if (wasValidated) {
      // Le brief était validé, le client vient de le modifier à nouveau : la validation
      // précédente n'est plus à jour, l'équipe doit revérifier.
      await prisma.project.update({ where: { id: project.id }, data: { status: 'BRIEF_PENDING' } });

      await notificationService.createNotification(
        project.assignedUserId,
        project.id,
        'brief_updated',
        'Brief modifié après validation',
        `Le client a modifié le brief de "${project.name}" après l'avoir déjà validé. Une nouvelle vérification est nécessaire.`
      );
    } else if (project.status === 'NEW') {
      // Premier brouillon
      await prisma.project.update({ where: { id: project.id }, data: { status: 'BRIEF_PENDING' } });
    }
  }

  return brief;
}

module.exports = { getBrief, upsertBrief };

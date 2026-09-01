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
 * Crée ou met à jour le brief. Accessible au client propriétaire, à l'employé assigné,
 * ou à l'admin. Une fois le brief validé (isDraft: false), le client ne peut plus le
 * modifier lui-même — seule l'équipe (employé assigné ou admin) le peut encore, pour
 * ajuster si besoin sans devoir repasser par une nouvelle validation client.
 *
 * Logique de statut :
 * - Premier enregistrement (brouillon) sur un projet NEW -> passe à BRIEF_PENDING
 * - Validation (isDraft: false) -> passe à BRIEF_VALIDATED + notif/email à l'équipe
 */
async function upsertBrief(user, projectId, data) {
  const project = await projectService.getProjectForUser(user, projectId);

  const isOwnerClient = user.role === 'CLIENT' && project.clientId === user.id;
  const isAssignedEmployee = user.role === 'EMPLOYEE' && project.assignedUserId === user.id;

  if (!(user.role === 'ADMIN' || isAssignedEmployee || isOwnerClient)) {
    throw ApiError.forbidden();
  }

  const existingBrief = await prisma.projectBrief.findUnique({ where: { projectId: Number(projectId) } });
  const wasValidated = existingBrief ? existingBrief.isDraft === false : false;

  // Le client ne peut plus modifier un brief déjà validé — seule l'équipe le peut désormais.
  if (isOwnerClient && wasValidated) {
    throw ApiError.forbidden('Ce brief a déjà été validé. Contactez votre équipe pour toute modification.');
  }

  const brief = await prisma.projectBrief.upsert({
    where: { projectId: Number(projectId) },
    update: data,
    create: { projectId: Number(projectId), ...data },
  });

  if (data.isDraft === false) {
    // Validation (première fois ou re-validation)
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
  } else if (data.isDraft === true && project.status === 'NEW') {
    // Premier brouillon
    await prisma.project.update({ where: { id: project.id }, data: { status: 'BRIEF_PENDING' } });
  }

  return brief;
}

module.exports = { getBrief, upsertBrief };

const prisma = require('../config/db');
const ApiError = require('../utils/apiError');
const notificationService = require('./notificationService');

async function listComments(project) {
  return prisma.comment.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
  });
}

async function createComment(user, project, data) {
  // Tout le monde ayant accès au projet (client, employé assigné, admin) peut commenter
  const comment = await prisma.comment.create({
    data: {
      projectId: project.id,
      userId: user.id,
      videoVersionId: data.videoVersionId || null,
      parentCommentId: data.parentCommentId || null,
      content: data.content,
      timecode: data.timecode || null,
      status: 'TO_HANDLE',
    },
    include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
  });

  // Notifie l'autre partie : le client commente -> notifie l'équipe assignée ; l'équipe commente -> notifie le client
  if (user.role === 'CLIENT') {
    await notificationService.createNotification(
      project.assignedUserId,
      project.id,
      'new_comment',
      'Nouveau commentaire client',
      `${user.firstName} a commenté sur "${project.name}".`
    );
  } else {
    await notificationService.createNotification(
      project.clientId,
      project.id,
      'new_comment',
      'Nouveau commentaire de l\'équipe',
      `Un commentaire nécessite votre attention sur "${project.name}".`
    );
  }

  return comment;
}

async function updateCommentStatus(user, project, commentId, status) {
  if (user.role === 'CLIENT') {
    throw ApiError.forbidden("Le client ne peut pas changer le statut d'un commentaire.");
  }

  const comment = await prisma.comment.findUnique({ where: { id: Number(commentId) } });
  if (!comment || comment.projectId !== project.id) {
    throw ApiError.notFound('Commentaire introuvable.');
  }

  return prisma.comment.update({ where: { id: comment.id }, data: { status } });
}

module.exports = { listComments, createComment, updateCommentStatus };

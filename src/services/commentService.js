const prisma = require('../config/db');
const ApiError = require('../utils/apiError');

async function listComments(project) {
  return prisma.comment.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
  });
}

async function createComment(user, project, data) {
  // Tout le monde ayant accès au projet (client, employé assigné, admin) peut commenter
  return prisma.comment.create({
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

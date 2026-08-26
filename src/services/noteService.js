const prisma = require('../config/db');
const ApiError = require('../utils/apiError');

function requireTeamAccess(user) {
  if (user.role === 'CLIENT') {
    throw ApiError.forbidden('Les notes internes ne sont pas accessibles au client.');
  }
}

async function listNotes(user, project) {
  requireTeamAccess(user);
  return prisma.internalNote.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });
}

async function createNote(user, project, content) {
  requireTeamAccess(user);
  return prisma.internalNote.create({
    data: { projectId: project.id, userId: user.id, content },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });
}

module.exports = { listNotes, createNote };

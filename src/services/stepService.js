const prisma = require('../config/db');
const ApiError = require('../utils/apiError');

function canManageSteps(user, project) {
  return user.role === 'ADMIN' || (user.role === 'EMPLOYEE' && project.assignedUserId === user.id);
}

async function updateStep(user, project, stepId, data) {
  if (!canManageSteps(user, project)) {
    throw ApiError.forbidden("Seule l'équipe assignée peut modifier la production.");
  }

  const step = await prisma.projectStep.findUnique({ where: { id: Number(stepId) } });
  if (!step || step.projectId !== project.id) {
    throw ApiError.notFound('Étape introuvable.');
  }

  const updateData = { ...data };
  if (data.status === 'IN_PROGRESS' && !step.startedAt) updateData.startedAt = new Date();
  if (data.status === 'DONE') {
    updateData.completedAt = new Date();
    updateData.progress = 100;
  }

  const updatedStep = await prisma.projectStep.update({
    where: { id: step.id },
    data: updateData,
  });

  // Recalcule la progression globale du projet à partir des étapes
  const allSteps = await prisma.projectStep.findMany({ where: { projectId: project.id } });
  const doneCount = allSteps.filter((s) => s.status === 'DONE').length;
  const globalProgress = Math.round((doneCount / allSteps.length) * 100);

  await prisma.project.update({
    where: { id: project.id },
    data: { progress: globalProgress },
  });

  return updatedStep;
}

module.exports = { updateStep };

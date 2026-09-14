const prisma = require('../config/db');
const ApiError = require('../utils/apiError');

function canAccess(user, project) {
  return (
    user.role === 'ADMIN' ||
    (user.role === 'EMPLOYEE' && project.assignedUserId === user.id) ||
    (user.role === 'CLIENT' && project.clientId === user.id)
  );
}

async function getBrandAsset(project) {
  return prisma.brandAsset.findUnique({ where: { projectId: project.id } });
}

/**
 * Enregistre la liste des couleurs de marque (primaire, secondaire, accent, autre...).
 * Le client peut renseigner ses couleurs, l'équipe peut les consulter/copier et les ajuster.
 */
async function upsertColors(user, project, colors) {
  if (!canAccess(user, project)) {
    throw ApiError.forbidden();
  }

  const sanitized = (colors || [])
    .filter((c) => c && c.hex)
    .slice(0, 12) // garde-fou raisonnable
    .map((c) => ({ label: String(c.label || 'Couleur').slice(0, 50), hex: String(c.hex).slice(0, 20) }));

  return prisma.brandAsset.upsert({
    where: { projectId: project.id },
    update: { colors: sanitized },
    create: { projectId: project.id, colors: sanitized },
  });
}

module.exports = { getBrandAsset, upsertColors };

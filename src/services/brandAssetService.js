const crypto = require('crypto');
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
 * Chaque couleur garde en mémoire qui l'a ajoutée (addedBy). Un employé peut ajouter de
 * nouvelles couleurs librement, mais ne peut ni modifier ni supprimer celles ajoutées par
 * le client — ces dernières restent forcées à leur valeur d'origine côté serveur, quelle
 * que soit la donnée envoyée par le front (sécurité, pas juste une restriction visuelle).
 * Le client et l'admin gardent un contrôle libre sur toutes les couleurs.
 */
async function upsertColors(user, project, incomingColors) {
  if (!canAccess(user, project)) {
    throw ApiError.forbidden();
  }

  const existing = await prisma.brandAsset.findUnique({ where: { projectId: project.id } });
  const existingColors = (existing && existing.colors) || [];

  const cleanedIncoming = (incomingColors || [])
    .filter((c) => c && c.hex)
    .slice(0, 12)
    .map((c) => ({
      id: c.id || null,
      label: String(c.label || 'Couleur').slice(0, 50),
      hex: String(c.hex).slice(0, 20),
    }));

  let finalColors;

  if (user.role === 'EMPLOYEE') {
    // L'employé ne peut ni modifier ni supprimer les couleurs ajoutées par le client OU l'admin —
    // il peut seulement les copier et ajouter les siennes.
    const lockedColors = existingColors.filter((c) => c.addedBy === 'CLIENT' || c.addedBy === 'ADMIN');

    for (const lockedColor of lockedColors) {
      const match = cleanedIncoming.find((c) => c.id === lockedColor.id);
      if (!match || match.label !== lockedColor.label || match.hex !== lockedColor.hex) {
        throw ApiError.forbidden("Vous ne pouvez pas modifier ou supprimer les couleurs ajoutées par le client ou l'admin.");
      }
    }

    finalColors = cleanedIncoming.map((c) => {
      const existingMatch = existingColors.find((e) => e.id === c.id);
      if (existingMatch && (existingMatch.addedBy === 'CLIENT' || existingMatch.addedBy === 'ADMIN')) {
        return existingMatch; // verrouillé : on ignore toute tentative de modification
      }
      return {
        id: c.id || crypto.randomUUID(),
        label: c.label,
        hex: c.hex,
        addedBy: existingMatch ? existingMatch.addedBy : 'EMPLOYEE',
      };
    });
  } else {
    // ADMIN ou CLIENT : contrôle libre sur toutes les couleurs
    finalColors = cleanedIncoming.map((c) => {
      const existingMatch = existingColors.find((e) => e.id === c.id);
      return {
        id: c.id || crypto.randomUUID(),
        label: c.label,
        hex: c.hex,
        addedBy: existingMatch ? existingMatch.addedBy : user.role,
      };
    });
  }

  return prisma.brandAsset.upsert({
    where: { projectId: project.id },
    update: { colors: finalColors },
    create: { projectId: project.id, colors: finalColors },
  });
}

/**
 * Enregistre les polices de la charte graphique (primaire/secondaire).
 * Pas de verrouillage par rôle ici (contrairement aux couleurs) : simple info partagée.
 */
async function updateFonts(user, project, primaryFont, secondaryFont) {
  if (!canAccess(user, project)) {
    throw ApiError.forbidden();
  }
  return prisma.brandAsset.upsert({
    where: { projectId: project.id },
    update: { primaryFont: primaryFont || null, secondaryFont: secondaryFont || null },
    create: { projectId: project.id, primaryFont: primaryFont || null, secondaryFont: secondaryFont || null },
  });
}

module.exports = { getBrandAsset, upsertColors, updateFonts };

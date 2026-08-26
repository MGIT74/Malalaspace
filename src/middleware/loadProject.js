const asyncHandler = require('../utils/asyncHandler');
const projectService = require('../services/projectService');

/**
 * Charge le projet (avec vérification d'accès) et l'attache à req.project.
 * Évite de dupliquer la vérification dans chaque route imbriquée (/projects/:id/files, etc.)
 */
module.exports = asyncHandler(async (req, res, next) => {
  req.project = await projectService.getProjectForUser(req.user, req.params.id);
  next();
});

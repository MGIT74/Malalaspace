const path = require('path');

module.exports = {
  // 'local' pour l'instant. Passera à 's3' plus tard sans changer le code métier
  // (seul storageService.js aura besoin d'un nouveau provider).
  provider: process.env.STORAGE_PROVIDER || 'local',
  localDir: process.env.STORAGE_LOCAL_DIR || path.join(process.cwd(), 'storage', 'uploads'),
  maxFileSize: 100 * 1024 * 1024, // 100 Mo
};

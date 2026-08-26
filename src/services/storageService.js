const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const config = require('../config/storage');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Provider "local disque". Respecte la même interface qu'un futur provider S3
 * (save / remove / getAbsolutePath) pour que fileService.js n'ait jamais à changer.
 */
const localProvider = {
  async save({ buffer, originalName, projectId }) {
    const dir = path.join(config.localDir, String(projectId));
    await ensureDir(dir);

    const ext = path.extname(originalName);
    const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const fullPath = path.join(dir, safeName);

    await fs.writeFile(fullPath, buffer);

    // storageKey = chemin relatif stocké en base (fileUrl). Ne dépend d'aucun détail
    // du provider, donc réutilisable tel quel avec un futur provider S3.
    return { storageKey: path.join(String(projectId), safeName) };
  },

  async remove(storageKey) {
    const fullPath = path.join(config.localDir, storageKey);
    await fs.unlink(fullPath).catch(() => {
      // Fichier déjà absent : on ignore silencieusement pour ne pas bloquer la suppression en base
    });
  },

  async getAbsolutePath(storageKey) {
    return path.join(config.localDir, storageKey);
  },
};

function getProvider() {
  if (config.provider === 'local') return localProvider;
  throw new Error(`Provider de stockage "${config.provider}" non implémenté.`);
}

module.exports = { getProvider };

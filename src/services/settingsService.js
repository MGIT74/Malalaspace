const prisma = require('../config/db');
const storageConfig = require('../config/storage');

const SMTP_KEYS = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from'];

/**
 * État des intégrations en lecture seule : dérivé des variables d'environnement,
 * jamais des valeurs elles-mêmes (aucune clé secrète n'est renvoyée par cette route).
 * Pour changer ces valeurs, il faut les définir dans le .env du serveur (pas via l'UI).
 */
function getIntegrationsStatus() {
  return {
    stripe: {
      configured: Boolean(process.env.STRIPE_SECRET_KEY),
      label: 'Stripe (paiements)',
    },
    storage: {
      configured: true,
      label: 'Stockage des fichiers',
      detail: storageConfig.provider === 'local' ? 'Disque local (serveur)' : storageConfig.provider,
    },
    database: {
      configured: true,
      label: 'Base de données MySQL',
    },
  };
}

async function getSmtpSettings() {
  const rows = await prisma.setting.findMany({ where: { id: { in: SMTP_KEYS } } });
  const map = {};
  rows.forEach((r) => { map[r.id] = r.value; });

  return {
    host: map.smtp_host || '',
    port: map.smtp_port || '',
    user: map.smtp_user || '',
    from: map.smtp_from || '',
    passwordSet: Boolean(map.smtp_password), // on indique juste si un mot de passe est déjà enregistré
  };
}

async function updateSmtpSettings(data) {
  const updates = [];
  if (data.host !== undefined) updates.push(['smtp_host', data.host]);
  if (data.port !== undefined) updates.push(['smtp_port', data.port]);
  if (data.user !== undefined) updates.push(['smtp_user', data.user]);
  if (data.from !== undefined) updates.push(['smtp_from', data.from]);
  // Le mot de passe n'est mis à jour que si un nouveau a été saisi (champ non vide)
  if (data.password) updates.push(['smtp_password', data.password]);

  await Promise.all(
    updates.map(([id, value]) =>
      prisma.setting.upsert({ where: { id }, update: { value }, create: { id, value } })
    )
  );

  return getSmtpSettings();
}

module.exports = { getIntegrationsStatus, getSmtpSettings, updateSmtpSettings };

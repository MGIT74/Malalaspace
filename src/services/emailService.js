const nodemailer = require('nodemailer');
const prisma = require('../config/db');
const logger = require('../utils/logger');

const SMTP_KEYS = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from'];

async function getTransportConfig() {
  const rows = await prisma.setting.findMany({ where: { id: { in: SMTP_KEYS } } });
  const map = {};
  rows.forEach((r) => { map[r.id] = r.value; });
  return {
    host: map.smtp_host,
    port: map.smtp_port ? Number(map.smtp_port) : 587,
    user: map.smtp_user,
    password: map.smtp_password,
    from: map.smtp_from || map.smtp_user,
  };
}

/**
 * Envoie un email si le SMTP est configuré. Sinon, log un avertissement et continue
 * sans jamais faire planter l'appelant : l'email est toujours "best effort", jamais bloquant.
 */
async function sendEmail({ to, subject, html }) {
  try {
    const config = await getTransportConfig();
    if (!config.host || !config.user || !config.password) {
      logger.warn(`Email non envoyé (SMTP non configuré) — destinataire: ${to}, sujet: ${subject}`);
      return { sent: false, reason: 'smtp_not_configured' };
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.password },
    });

    await transporter.sendMail({ from: config.from, to, subject, html });
    return { sent: true };
  } catch (err) {
    logger.error('Échec envoi email:', err.message);
    return { sent: false, reason: err.message };
  }
}

function wrapTemplate(title, bodyHtml) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
      <h2 style="color:#0A84FF;margin-bottom:16px;">${title}</h2>
      <div style="color:#333;font-size:14px;line-height:1.6;">${bodyHtml}</div>
      <p style="color:#999;font-size:12px;margin-top:32px;">Malalaspace — Portail client</p>
    </div>`;
}

const templates = {
  welcome: (firstName, verifyUrl) => wrapTemplate('Bienvenue sur Malalaspace', `<p>Bonjour ${firstName},</p><p>Votre compte a été créé avec succès. Vous pouvez dès maintenant créer votre premier projet vidéo.</p>${verifyUrl ? `<p><a href="${verifyUrl}" style="color:#0A84FF">Cliquez ici pour confirmer votre adresse email</a>.</p>` : ''}`),
  resetPassword: (resetUrl) => wrapTemplate('Réinitialisation de mot de passe', `<p>Vous avez demandé la réinitialisation de votre mot de passe.</p><p><a href="${resetUrl}" style="color:#0A84FF">Cliquez ici pour choisir un nouveau mot de passe</a>. Ce lien expire dans 1 heure.</p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`),
  videoReady: (projectName, versionTitle) => wrapTemplate('Nouvelle vidéo disponible', `<p>Une nouvelle version de votre projet <strong>${projectName}</strong> est disponible : ${versionTitle}.</p><p>Connectez-vous à votre espace client pour la visionner.</p>`),
  briefValidated: (projectName) => wrapTemplate('Brief client validé', `<p>Le client a validé le brief du projet <strong>${projectName}</strong>.</p>`),
  validation: (projectName, versionTitle) => wrapTemplate('Version validée par le client', `<p>Le client a validé la version "${versionTitle}" du projet <strong>${projectName}</strong>.</p>`),
};

module.exports = { sendEmail, templates };

const prisma = require('../config/db');
const ApiError = require('../utils/apiError');
const notificationService = require('./notificationService');

/**
 * Création d'un lead — endpoint public (formulaire de contact du site, chatbot IA).
 * Notifie tous les admins.
 */
async function createLead(data) {
  const lead = await prisma.lead.create({
    data: {
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      message: data.message || null,
      source: data.source || 'CONTACT_FORM',
      status: 'NEW',
    },
  });

  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  const sourceLabel = data.source === 'CHATBOT' ? 'chatbot IA' : 'formulaire de contact';
  await Promise.all(
    admins.map((admin) =>
      notificationService.createNotification(
        admin.id,
        null,
        'new_lead',
        'Nouveau lead',
        `${data.firstName || 'Quelqu\'un'} a laissé un message via le ${sourceLabel}.`
      )
    )
  );

  return lead;
}

async function listLeads(user) {
  if (user.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }
  return prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
}

async function updateLeadStatus(user, leadId, status) {
  if (user.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }
  const lead = await prisma.lead.findUnique({ where: { id: Number(leadId) } });
  if (!lead) {
    throw ApiError.notFound('Lead introuvable.');
  }
  return prisma.lead.update({ where: { id: lead.id }, data: { status } });
}

async function deleteLead(user, leadId) {
  if (user.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }
  await prisma.lead.deleteMany({ where: { id: Number(leadId) } });
}

module.exports = { createLead, listLeads, updateLeadStatus, deleteLead };

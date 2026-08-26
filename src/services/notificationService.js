const prisma = require('../config/db');

async function createNotification(userId, projectId, type, title, message) {
  if (!userId) return null; // pas de destinataire (ex: aucun employé assigné) -> on ignore silencieusement
  return prisma.notification.create({
    data: { userId, projectId, type, title, message },
  });
}

async function listForUser(user) {
  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

async function markAsRead(user, notificationId) {
  await prisma.notification.updateMany({
    where: { id: Number(notificationId), userId: user.id },
    data: { readAt: new Date() },
  });
}

async function markAllAsRead(user) {
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
}

module.exports = { createNotification, listForUser, markAsRead, markAllAsRead };

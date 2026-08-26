const prisma = require('../config/db');
const ApiError = require('../utils/apiError');

async function listClients(user) {
  if (!['ADMIN', 'EMPLOYEE'].includes(user.role)) {
    throw ApiError.forbidden();
  }

  const clients = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      company: true,
      createdAt: true,
      _count: { select: { projectsAsClient: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return clients.map((c) => ({
    ...c,
    projectCount: c._count.projectsAsClient,
    _count: undefined,
  }));
}

module.exports = { listClients };

const prisma = require('../config/db');
const ApiError = require('../utils/apiError');

async function listPayments(user) {
  if (user.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }
  return prisma.payment.findMany({
    include: { project: { select: { id: true, name: true, companyName: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = { listPayments };

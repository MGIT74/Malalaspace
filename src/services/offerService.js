const prisma = require('../config/db');
const ApiError = require('../utils/apiError');
const { DEFAULT_OFFERS } = require('../config/offers');

const SETTING_KEY = 'offers_catalog';

async function getOffers() {
  const row = await prisma.setting.findUnique({ where: { id: SETTING_KEY } });
  if (!row) return DEFAULT_OFFERS;
  try {
    return JSON.parse(row.value);
  } catch (err) {
    return DEFAULT_OFFERS; // en cas de JSON corrompu, on ne casse jamais l'affichage
  }
}

async function updateOffers(user, offers) {
  if (user.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }
  const value = JSON.stringify(offers);
  await prisma.setting.upsert({
    where: { id: SETTING_KEY },
    update: { value },
    create: { id: SETTING_KEY, value },
  });
  return offers;
}

module.exports = { getOffers, updateOffers };

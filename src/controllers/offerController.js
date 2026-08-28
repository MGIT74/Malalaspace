const asyncHandler = require('../utils/asyncHandler');
const offerService = require('../services/offerService');

const list = asyncHandler(async (req, res) => {
  const offers = await offerService.getOffers();
  res.status(200).json({ success: true, data: offers });
});

const update = asyncHandler(async (req, res) => {
  const offers = await offerService.updateOffers(req.user, req.body);
  res.status(200).json({ success: true, data: offers });
});

module.exports = { list, update };

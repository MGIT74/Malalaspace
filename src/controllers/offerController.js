const asyncHandler = require('../utils/asyncHandler');
const { OFFERS } = require('../config/offers');

const list = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: OFFERS });
});

module.exports = { list };

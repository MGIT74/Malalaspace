const asyncHandler = require('../utils/asyncHandler');
const paymentService = require('../services/paymentService');

const list = asyncHandler(async (req, res) => {
  const payments = await paymentService.listPayments(req.user);
  res.status(200).json({ success: true, data: payments });
});

module.exports = { list };

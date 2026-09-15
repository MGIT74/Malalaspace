const asyncHandler = require('../utils/asyncHandler');
const stripeService = require('../services/stripeService');

const getSummary = asyncHandler(async (req, res) => {
  const summary = await stripeService.getPaymentSummary(req.project);
  res.status(200).json({ success: true, data: summary });
});

const createCheckout = asyncHandler(async (req, res) => {
  const url = await stripeService.createCheckoutSession(req.user, req.project, req.body.type);
  res.status(200).json({ success: true, data: { url } });
});

module.exports = { getSummary, createCheckout };

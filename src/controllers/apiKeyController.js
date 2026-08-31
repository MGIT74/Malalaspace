const asyncHandler = require('../utils/asyncHandler');
const apiKeyService = require('../services/apiKeyService');

const generate = asyncHandler(async (req, res) => {
  const result = await apiKeyService.generate(req.user, req.body.label);
  res.status(201).json({ success: true, data: result });
});

const getStatus = asyncHandler(async (req, res) => {
  const status = await apiKeyService.getStatus(req.user);
  res.status(200).json({ success: true, data: status });
});

const revoke = asyncHandler(async (req, res) => {
  await apiKeyService.revoke(req.user);
  res.status(200).json({ success: true, message: 'Clé API révoquée.' });
});

module.exports = { generate, getStatus, revoke };

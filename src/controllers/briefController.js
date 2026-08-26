const asyncHandler = require('../utils/asyncHandler');
const briefService = require('../services/briefService');

const getBrief = asyncHandler(async (req, res) => {
  const brief = await briefService.getBrief(req.user, req.params.id);
  res.status(200).json({ success: true, data: brief });
});

const upsertBrief = asyncHandler(async (req, res) => {
  const brief = await briefService.upsertBrief(req.user, req.params.id, req.body);
  res.status(200).json({ success: true, data: brief });
});

module.exports = { getBrief, upsertBrief };

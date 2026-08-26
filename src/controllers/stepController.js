const asyncHandler = require('../utils/asyncHandler');
const stepService = require('../services/stepService');

const update = asyncHandler(async (req, res) => {
  const step = await stepService.updateStep(req.user, req.project, req.params.stepId, req.body);
  res.status(200).json({ success: true, data: step });
});

module.exports = { update };

const asyncHandler = require('../utils/asyncHandler');
const stepService = require('../services/stepService');

const update = asyncHandler(async (req, res) => {
  const step = await stepService.updateStep(req.user, req.project, req.params.stepId, req.body);
  res.status(200).json({ success: true, data: step });
});

const add = asyncHandler(async (req, res) => {
  const step = await stepService.addStep(req.user, req.project, req.body.name);
  res.status(201).json({ success: true, data: step });
});

const remove = asyncHandler(async (req, res) => {
  await stepService.deleteStep(req.user, req.project, req.params.stepId);
  res.status(200).json({ success: true, message: 'Étape supprimée.' });
});

module.exports = { update, add, remove };

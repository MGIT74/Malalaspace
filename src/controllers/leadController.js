const asyncHandler = require('../utils/asyncHandler');
const leadService = require('../services/leadService');

const create = asyncHandler(async (req, res) => {
  const lead = await leadService.createLead(req.body);
  res.status(201).json({ success: true, data: { id: lead.id } });
});

const list = asyncHandler(async (req, res) => {
  const leads = await leadService.listLeads(req.user);
  res.status(200).json({ success: true, data: leads });
});

const updateStatus = asyncHandler(async (req, res) => {
  const lead = await leadService.updateLeadStatus(req.user, req.params.id, req.body.status);
  res.status(200).json({ success: true, data: lead });
});

const remove = asyncHandler(async (req, res) => {
  await leadService.deleteLead(req.user, req.params.id);
  res.status(200).json({ success: true, message: 'Lead supprimé.' });
});

module.exports = { create, list, updateStatus, remove };

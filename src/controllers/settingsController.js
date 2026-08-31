const asyncHandler = require('../utils/asyncHandler');
const settingsService = require('../services/settingsService');

const getIntegrations = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: settingsService.getIntegrationsStatus() });
});

const getSmtp = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSmtpSettings();
  res.status(200).json({ success: true, data: settings });
});

const updateSmtp = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateSmtpSettings(req.body);
  res.status(200).json({ success: true, data: settings });
});

const getContactFormRedirect = asyncHandler(async (req, res) => {
  const redirectUrl = await settingsService.getContactFormRedirect();
  res.status(200).json({ success: true, data: { redirectUrl } });
});

const updateContactFormRedirect = asyncHandler(async (req, res) => {
  const redirectUrl = await settingsService.updateContactFormRedirect(req.body.redirectUrl);
  res.status(200).json({ success: true, data: { redirectUrl } });
});

module.exports = { getIntegrations, getSmtp, updateSmtp, getContactFormRedirect, updateContactFormRedirect };

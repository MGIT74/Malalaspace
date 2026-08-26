const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notificationService');

const list = asyncHandler(async (req, res) => {
  const notifications = await notificationService.listForUser(req.user);
  res.status(200).json({ success: true, data: notifications });
});

const markAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAsRead(req.user, req.params.id);
  res.status(200).json({ success: true });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user);
  res.status(200).json({ success: true });
});

module.exports = { list, markAsRead, markAllAsRead };

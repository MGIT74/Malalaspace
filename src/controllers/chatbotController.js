const asyncHandler = require('../utils/asyncHandler');
const chatbotService = require('../services/chatbotService');

const sendMessage = asyncHandler(async (req, res) => {
  const reply = await chatbotService.sendMessage(req.user, req.body.message, req.body.sessionId);
  res.status(200).json({ success: true, data: { reply } });
});

module.exports = { sendMessage };

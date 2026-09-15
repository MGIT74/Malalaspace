const asyncHandler = require('../utils/asyncHandler');
const logService = require('../services/logService');

const list = asyncHandler(async (req, res) => {
  const logs = await logService.listLogs(req.user);
  res.status(200).json({ success: true, data: logs });
});

module.exports = { list };

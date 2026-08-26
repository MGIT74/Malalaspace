const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');

const listClients = asyncHandler(async (req, res) => {
  const clients = await userService.listClients(req.user);
  res.status(200).json({ success: true, data: clients });
});

module.exports = { listClients };

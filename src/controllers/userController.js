const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');

const listClients = asyncHandler(async (req, res) => {
  const clients = await userService.listClients(req.user);
  res.status(200).json({ success: true, data: clients });
});

const listAllUsers = asyncHandler(async (req, res) => {
  const users = await userService.listAllUsers(req.user);
  res.status(200).json({ success: true, data: users });
});

const updateRole = asyncHandler(async (req, res) => {
  const user = await userService.updateUserRole(req.user, req.params.id, req.body.role);
  res.status(200).json({ success: true, data: user });
});

module.exports = { listClients, listAllUsers, updateRole };

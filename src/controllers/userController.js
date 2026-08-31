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

const listTeam = asyncHandler(async (req, res) => {
  const team = await userService.listTeam(req.user);
  res.status(200).json({ success: true, data: team });
});

const createTeamMember = asyncHandler(async (req, res) => {
  const member = await userService.createTeamMember(req.user, req.body);
  res.status(201).json({ success: true, data: member });
});

const updateRole = asyncHandler(async (req, res) => {
  const user = await userService.updateUserRole(req.user, req.params.id, req.body.role);
  res.status(200).json({ success: true, data: user });
});

const setActive = asyncHandler(async (req, res) => {
  const user = await userService.setUserActive(req.user, req.params.id, req.body.isActive);
  res.status(200).json({ success: true, data: user });
});

const remove = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.user, req.params.id);
  res.status(200).json({ success: true, message: 'Utilisateur supprimé.' });
});

module.exports = { listClients, listAllUsers, listTeam, createTeamMember, updateRole, setActive, remove };

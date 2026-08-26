const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

const register = asyncHandler(async (req, res) => {
  const { user, tokens } = await authService.register(req.body);
  res.status(201).json({ success: true, data: { user, ...tokens } });
});

const login = asyncHandler(async (req, res) => {
  const { user, tokens } = await authService.login(req.body);
  res.status(200).json({ success: true, data: { user, ...tokens } });
});

const refresh = asyncHandler(async (req, res) => {
  const tokens = await authService.refresh(req.body.refreshToken);
  res.status(200).json({ success: true, data: tokens });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(200).json({ success: true, message: 'Déconnexion réussie.' });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.status(200).json({ success: true, data: user });
});

module.exports = { register, login, refresh, logout, me };

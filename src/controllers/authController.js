const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const env = require('../config/env');
const ApiError = require('../utils/apiError');

// Inscription publique désactivée : seul un admin peut créer un compte (client ou employé)
// depuis l'app, via /api/users/team. La fonction authService.register reste disponible
// pour un usage futur éventuel (ex: invitation), mais n'est plus exposée publiquement ici.
const register = asyncHandler(async (req, res) => {
  throw ApiError.forbidden("L'inscription publique est désactivée. Contactez votre administrateur pour obtenir un accès.");
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

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email, env.frontendUrl);
  // Réponse toujours identique, qu'un compte existe ou non (anti-énumération)
  res.status(200).json({ success: true, message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  res.status(200).json({ success: true, message: 'Mot de passe réinitialisé avec succès.' });
});

const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.body.token);
  res.status(200).json({ success: true, message: 'Email vérifié avec succès.' });
});

const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerification(req.user.id, env.frontendUrl);
  res.status(200).json({ success: true, message: 'Email de vérification renvoyé.' });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  res.status(200).json({ success: true, data: user });
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  res.status(200).json({ success: true, message: 'Mot de passe modifié avec succès.' });
});

module.exports = { register, login, refresh, logout, me, forgotPassword, resetPassword, verifyEmail, resendVerification, updateProfile, changePassword };

const rateLimit = require('express-rate-limit');

// Protection contre le bruteforce sur login/register/forgot-password
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de tentatives. Veuillez réessayer plus tard.',
  },
});

module.exports = { authLimiter };

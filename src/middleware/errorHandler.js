const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational === true;

  if (!isOperational) {
    // Erreur inattendue : on log les détails techniques serveur uniquement
    logger.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message: isOperational ? err.message : 'Une erreur est survenue. Veuillez réessayer.',
    details: isOperational ? err.details : undefined,
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: 'Route introuvable.' });
}

module.exports = { errorHandler, notFoundHandler };

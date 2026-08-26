const ApiError = require('../utils/apiError');

/**
 * Usage: authorize('ADMIN', 'EMPLOYEE')
 * Doit être placé après authenticate.
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('Vous n\'avez pas les droits pour cette action.'));
    }
    next();
  };
}

module.exports = authorize;

const ApiError = require('../utils/apiError');

/**
 * Usage: validate(schema) où schema est un schéma Zod appliqué à req.body
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.flatten().fieldErrors;
      return next(ApiError.badRequest('Données invalides.', details));
    }
    req.body = result.data;
    next();
  };
}

module.exports = validate;

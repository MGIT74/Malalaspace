const express = require('express');
const settingsController = require('../controllers/settingsController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { smtpSchema, contactFormRedirectSchema } = require('../validators/settingsValidator');

const router = express.Router();

// Lecture publique — utilisée par la page de formulaire de contact autonome (pas d'authentification)
router.get('/contact-form-redirect', settingsController.getContactFormRedirect);

router.use(authenticate, authorize('ADMIN'));

router.get('/integrations', settingsController.getIntegrations);
router.get('/smtp', settingsController.getSmtp);
router.put('/smtp', validate(smtpSchema), settingsController.updateSmtp);
router.put('/contact-form-redirect', validate(contactFormRedirectSchema), settingsController.updateContactFormRedirect);

module.exports = router;

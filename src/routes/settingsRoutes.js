const express = require('express');
const settingsController = require('../controllers/settingsController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { smtpSchema } = require('../validators/settingsValidator');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/integrations', settingsController.getIntegrations);
router.get('/smtp', settingsController.getSmtp);
router.put('/smtp', validate(smtpSchema), settingsController.updateSmtp);

module.exports = router;

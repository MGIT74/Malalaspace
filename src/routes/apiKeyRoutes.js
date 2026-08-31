const express = require('express');
const apiKeyController = require('../controllers/apiKeyController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', apiKeyController.getStatus);
router.post('/generate', apiKeyController.generate);
router.delete('/', apiKeyController.revoke);

module.exports = router;

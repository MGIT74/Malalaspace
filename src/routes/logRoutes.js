const express = require('express');
const logController = require('../controllers/logController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));
router.get('/', logController.list);

module.exports = router;

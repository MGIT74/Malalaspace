const express = require('express');
const offerController = require('../controllers/offerController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);
router.get('/', offerController.list);

module.exports = router;

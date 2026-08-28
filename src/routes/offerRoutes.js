const express = require('express');
const offerController = require('../controllers/offerController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { updateOffersSchema } = require('../validators/offerValidator');

const router = express.Router();

router.use(authenticate);
router.get('/', offerController.list);
router.put('/', authorize('ADMIN'), validate(updateOffersSchema), offerController.update);

module.exports = router;

const express = require('express');
const chatbotController = require('../controllers/chatbotController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { sendMessageSchema } = require('../validators/chatbotValidator');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));
router.post('/message', validate(sendMessageSchema), chatbotController.sendMessage);

module.exports = router;

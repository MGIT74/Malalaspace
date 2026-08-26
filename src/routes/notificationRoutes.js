const express = require('express');
const notificationController = require('../controllers/notificationController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

router.get('/', notificationController.list);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);

module.exports = router;

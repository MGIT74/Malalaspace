const express = require('express');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);

router.get('/clients', authorize('ADMIN', 'EMPLOYEE'), userController.listClients);

module.exports = router;

const express = require('express');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { updateRoleSchema } = require('../validators/userValidator');

const router = express.Router();

router.use(authenticate);

router.get('/clients', authorize('ADMIN', 'EMPLOYEE'), userController.listClients);
router.get('/', authorize('ADMIN'), userController.listAllUsers);
router.put('/:id/role', authorize('ADMIN'), validate(updateRoleSchema), userController.updateRole);

module.exports = router;

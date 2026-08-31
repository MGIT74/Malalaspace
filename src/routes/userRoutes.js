const express = require('express');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { updateRoleSchema, createTeamMemberSchema, setActiveSchema } = require('../validators/userValidator');

const router = express.Router();

router.use(authenticate);

router.get('/clients', authorize('ADMIN'), userController.listClients);
router.get('/team', authorize('ADMIN'), userController.listTeam);
router.post('/team', authorize('ADMIN'), validate(createTeamMemberSchema), userController.createTeamMember);
router.get('/', authorize('ADMIN'), userController.listAllUsers);
router.put('/:id/role', authorize('ADMIN'), validate(updateRoleSchema), userController.updateRole);
router.patch('/:id/status', authorize('ADMIN'), validate(setActiveSchema), userController.setActive);
router.delete('/:id', authorize('ADMIN'), userController.remove);

module.exports = router;

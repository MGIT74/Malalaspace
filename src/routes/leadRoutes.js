const express = require('express');
const leadController = require('../controllers/leadController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { createLeadSchema, updateLeadStatusSchema, replyLeadSchema } = require('../validators/leadValidator');

const router = express.Router();

// Endpoint public — formulaire de contact du site vitrine ou chatbot IA (pas d'authentification requise)
router.post('/', authLimiter, validate(createLeadSchema), leadController.create);

// Le reste est réservé à l'admin
router.get('/', authenticate, authorize('ADMIN'), leadController.list);
router.patch('/:id/status', authenticate, authorize('ADMIN'), validate(updateLeadStatusSchema), leadController.updateStatus);
router.delete('/:id', authenticate, authorize('ADMIN'), leadController.remove);
router.post('/:id/reply', authenticate, authorize('ADMIN'), validate(replyLeadSchema), leadController.reply);
router.get('/:id/replies', authenticate, authorize('ADMIN'), leadController.listReplies);

module.exports = router;

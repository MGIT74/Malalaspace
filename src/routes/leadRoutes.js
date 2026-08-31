const express = require('express');
const leadController = require('../controllers/leadController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const requireApiKeyOrAdmin = require('../middleware/apiKeyOrAdmin');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { createLeadSchema, updateLeadStatusSchema, replyLeadSchema } = require('../validators/leadValidator');

const router = express.Router();

// Endpoint public — formulaire de contact du site vitrine ou chatbot IA (pas d'authentification requise)
router.post('/', authLimiter, validate(createLeadSchema), leadController.create);

// Accessible par un admin connecté OU par une intégration externe (agent IA n8n) via clé API
router.get('/', requireApiKeyOrAdmin, leadController.list);
router.patch('/:id/status', requireApiKeyOrAdmin, validate(updateLeadStatusSchema), leadController.updateStatus);
router.post('/:id/reply', requireApiKeyOrAdmin, validate(replyLeadSchema), leadController.reply);
router.get('/:id/replies', requireApiKeyOrAdmin, leadController.listReplies);

// La suppression reste réservée à un admin humain connecté (pas de clé API)
router.delete('/:id', authenticate, authorize('ADMIN'), leadController.remove);

module.exports = router;

const express = require('express');
const projectController = require('../controllers/projectController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createProjectSchema } = require('../validators/projectValidator');

const router = express.Router();

// Toutes les routes projets nécessitent d'être authentifié
router.use(authenticate);

router.get('/', projectController.list);
router.post('/', validate(createProjectSchema), projectController.create);
router.get('/:id', projectController.getById);

// Phase 2: router.put('/:id/brief', ...), router.post('/:id/files', ...), etc.

module.exports = router;

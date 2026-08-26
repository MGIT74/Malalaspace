const express = require('express');
const projectController = require('../controllers/projectController');
const briefController = require('../controllers/briefController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createProjectSchema } = require('../validators/projectValidator');
const { upsertBriefSchema } = require('../validators/briefValidator');

const router = express.Router();

// Toutes les routes projets nécessitent d'être authentifié
router.use(authenticate);

router.get('/', projectController.list);
router.post('/', validate(createProjectSchema), projectController.create);
router.get('/:id', projectController.getById);

router.get('/:id/brief', briefController.getBrief);
router.put('/:id/brief', validate(upsertBriefSchema), briefController.upsertBrief);

// Phase 2: router.post('/:id/files', ...), router.get('/:id/videos', ...), etc.

module.exports = router;

const express = require('express');
const projectController = require('../controllers/projectController');
const briefController = require('../controllers/briefController');
const fileController = require('../controllers/fileController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const loadProject = require('../middleware/loadProject');
const upload = require('../middleware/upload');
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

// loadProject vérifie l'accès une seule fois puis attache req.project pour ces 4 routes
router.post('/:id/files', loadProject, upload.single('file'), fileController.upload);
router.get('/:id/files', loadProject, fileController.list);
router.get('/:id/files/:fileId/download', loadProject, fileController.download);
router.delete('/:id/files/:fileId', loadProject, fileController.remove);

// Phase 2: router.get('/:id/videos', ...), router.post('/:id/comments', ...), etc.

module.exports = router;

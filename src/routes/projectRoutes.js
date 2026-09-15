const express = require('express');
const projectController = require('../controllers/projectController');
const briefController = require('../controllers/briefController');
const fileController = require('../controllers/fileController');
const brandAssetController = require('../controllers/brandAssetController');
const projectPaymentController = require('../controllers/projectPaymentController');
const videoController = require('../controllers/videoController');
const commentController = require('../controllers/commentController');
const stepController = require('../controllers/stepController');
const noteController = require('../controllers/noteController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const loadProject = require('../middleware/loadProject');
const upload = require('../middleware/upload');
const { createProjectSchema, updateProjectSchema } = require('../validators/projectValidator');
const { upsertBriefSchema } = require('../validators/briefValidator');
const { createVideoSchema, updateVideoSchema } = require('../validators/videoValidator');
const { createCommentSchema, updateCommentStatusSchema } = require('../validators/commentValidator');
const { updateStepSchema } = require('../validators/stepValidator');
const { createNoteSchema } = require('../validators/noteValidator');
const { assignProjectSchema } = require('../validators/assignValidator');
const { addStepSchema, adminCreateProjectSchema } = require('../validators/adminValidator');
const { updateDeadlineSchema } = require('../validators/deadlineValidator');
const { updateColorsSchema, updateFontsSchema } = require('../validators/brandAssetValidator');
const { createCheckoutSchema } = require('../validators/projectPaymentValidator');

const router = express.Router();

// Toutes les routes projets nécessitent d'être authentifié
router.use(authenticate);

router.get('/', projectController.list);
router.post('/', validate(createProjectSchema), projectController.create);
router.post('/admin', authorize('ADMIN'), validate(adminCreateProjectSchema), projectController.createForClient);
router.get('/:id', projectController.getById);
router.patch('/:id/assign', authorize('ADMIN'), validate(assignProjectSchema), projectController.assign);
router.patch('/:id/deadline', validate(updateDeadlineSchema), projectController.updateDeadline);
router.patch('/:id', validate(updateProjectSchema), projectController.updateInfo);
router.delete('/:id', authorize('ADMIN'), projectController.remove);

router.get('/:id/brief', briefController.getBrief);
router.put('/:id/brief', validate(upsertBriefSchema), briefController.upsertBrief);

// loadProject vérifie l'accès une seule fois puis attache req.project pour toutes ces routes
router.post('/:id/files', loadProject, upload.single('file'), fileController.upload);
router.get('/:id/files', loadProject, fileController.list);
router.get('/:id/brand-asset', loadProject, brandAssetController.get);
router.put('/:id/brand-asset', loadProject, validate(updateColorsSchema), brandAssetController.updateColors);
router.put('/:id/brand-asset/fonts', loadProject, validate(updateFontsSchema), brandAssetController.updateFonts);
router.get('/:id/payments/summary', loadProject, projectPaymentController.getSummary);
router.post('/:id/payments/checkout', loadProject, validate(createCheckoutSchema), projectPaymentController.createCheckout);
router.get('/:id/files/:fileId/download', loadProject, fileController.download);
router.delete('/:id/files/:fileId', loadProject, fileController.remove);

router.get('/:id/videos', loadProject, videoController.list);
router.post('/:id/videos', loadProject, validate(createVideoSchema), videoController.create);
router.patch('/:id/videos/:videoId', loadProject, validate(updateVideoSchema), videoController.update);
router.post('/:id/videos/:videoId/validate', loadProject, videoController.validate);
router.delete('/:id/videos/:videoId', loadProject, videoController.remove);

router.get('/:id/comments', loadProject, commentController.list);
router.post('/:id/comments', loadProject, validate(createCommentSchema), commentController.create);
router.patch('/:id/comments/:commentId/status', loadProject, validate(updateCommentStatusSchema), commentController.updateStatus);

router.patch('/:id/steps/:stepId', loadProject, validate(updateStepSchema), stepController.update);
router.patch('/:id/steps/:stepId/reorder', loadProject, stepController.reorder);
router.post('/:id/steps', loadProject, validate(addStepSchema), stepController.add);
router.delete('/:id/steps/:stepId', loadProject, stepController.remove);

router.get('/:id/notes', loadProject, noteController.list);
router.post('/:id/notes', loadProject, validate(createNoteSchema), noteController.create);

module.exports = router;

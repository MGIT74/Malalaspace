const express = require('express');
const authRoutes = require('./authRoutes');
const projectRoutes = require('./projectRoutes');
const userRoutes = require('./userRoutes');
const settingsRoutes = require('./settingsRoutes');
const notificationRoutes = require('./notificationRoutes');

const router = express.Router();

router.get('/health', (req, res) => res.json({ success: true, message: 'API opérationnelle' }));
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/users', userRoutes);
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationRoutes);

// Phase 2+: router.use('/files', fileRoutes); router.use('/videos', ...); etc.

module.exports = router;

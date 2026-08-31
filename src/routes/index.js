const express = require('express');
const authRoutes = require('./authRoutes');
const projectRoutes = require('./projectRoutes');
const userRoutes = require('./userRoutes');
const settingsRoutes = require('./settingsRoutes');
const notificationRoutes = require('./notificationRoutes');
const paymentRoutes = require('./paymentRoutes');
const offerRoutes = require('./offerRoutes');
const leadRoutes = require('./leadRoutes');
const apiKeyRoutes = require('./apiKeyRoutes');
const chatbotRoutes = require('./chatbotRoutes');

const router = express.Router();

router.get('/health', (req, res) => res.json({ success: true, message: 'API opérationnelle' }));
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/users', userRoutes);
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/payments', paymentRoutes);
router.use('/offers', offerRoutes);
router.use('/leads', leadRoutes);
router.use('/api-key', apiKeyRoutes);
router.use('/chatbot', chatbotRoutes);

// Phase 2+: router.use('/files', fileRoutes); router.use('/videos', ...); etc.

module.exports = router;

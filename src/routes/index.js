const express = require('express');
const authRoutes = require('./authRoutes');

const router = express.Router();

router.get('/health', (req, res) => res.json({ success: true, message: 'API opérationnelle' }));
router.use('/auth', authRoutes);

// Phase 2+: router.use('/projects', projectRoutes); etc.

module.exports = router;

const express = require('express');
const authRoutes = require('./auth');
const backupRoutes = require('./backup');
const syncRoutes = require('./sync');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/backup', backupRoutes);
router.use('/sync', syncRoutes);

module.exports = router;
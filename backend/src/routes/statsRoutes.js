// backend/src/routes/statsRoutes.js
const express = require('express');
const { getOverviewStats, getDailyStats, getLevelDistribution } = require('../controllers/statsController');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/overview', adminAuth, getOverviewStats);
router.get('/daily', adminAuth, getDailyStats);
router.get('/levels', adminAuth, getLevelDistribution);

module.exports = router;
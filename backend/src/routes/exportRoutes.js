// backend/src/routes/exportRoutes.js
const express = require('express');
const { exportUsers, exportMatches, exportRanking } = require('../controllers/exportController');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

// Chỉ admin mới được xuất báo cáo
router.get('/users', adminAuth, exportUsers);
router.get('/matches', adminAuth, exportMatches);
router.get('/ranking', adminAuth, exportRanking);

module.exports = router;
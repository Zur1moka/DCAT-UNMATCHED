const express = require('express');
const { adminAuth } = require('../middleware/auth');
const {
  exportUsers,
  exportMatches,
  exportRanking,
  exportUsersExcel,
  exportMatchesExcel,
  exportRankingExcel,
} = require('../controllers/exportController');
const router = express.Router();

// CSV
router.get('/users', adminAuth, exportUsers);
router.get('/matches', adminAuth, exportMatches);
router.get('/ranking', adminAuth, exportRanking);

// Excel
router.get('/excel/users', adminAuth, exportUsersExcel);
router.get('/excel/matches', adminAuth, exportMatchesExcel);
router.get('/excel/ranking', adminAuth, exportRankingExcel);

module.exports = router;
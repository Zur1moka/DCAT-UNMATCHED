// backend/src/routes/questRoutes.js
const express = require('express');
const { 
  doCheckIn, 
  getUserQuests, 
  approveQuest, 
  getPendingQuests 
} = require('../controllers/questController');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// User routes
router.post('/checkin', auth, doCheckIn);
router.get('/', auth, getUserQuests);

// Admin routes
router.get('/pending', adminAuth, getPendingQuests);
router.put('/approve/:userQuestId', adminAuth, approveQuest);

module.exports = router;
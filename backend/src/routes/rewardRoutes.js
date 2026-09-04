// backend/src/routes/rewardRoutes.js
const express = require('express');
const {
  getAllRewards,
  getReward,
  createReward,
  updateReward,
  deleteReward,
} = require('../controllers/rewardController');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/', getAllRewards);
router.get('/:id', getReward);
router.post('/', adminAuth, createReward);
router.put('/:id', adminAuth, updateReward);
router.delete('/:id', adminAuth, deleteReward);

module.exports = router;
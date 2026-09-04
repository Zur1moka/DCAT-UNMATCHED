const express = require('express');
const { checkIn } = require('../services/questService');
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

router.post('/checkin/:userId', adminAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ error: 'ID không hợp lệ' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User không tồn tại' });
    const result = await checkIn(userId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
// src/routes/matches.js
const express = require('express');
const router = express.Router();
const { processMatch } = require('../services/matchService');

// POST /api/matches - Nhập kết quả trận đấu
router.post('/', async (req, res) => {
  try {
    const { player1Id, player2Id, winnerId, player1Hero, player2Hero, isAdminChallenge, isHandicap } = req.body;

    // Validate cơ bản
    if (!player1Id || !player2Id || !winnerId || !player1Hero || !player2Hero) {
      return res.status(400).json({ error: 'Thiếu thông tin trận đấu' });
    }

    const result = await processMatch({
      player1Id,
      player2Id,
      winnerId,
      player1Hero,
      player2Hero,
      isAdminChallenge: isAdminChallenge || false,
      isHandicap: isHandicap || false
    });

    res.status(201).json({
      message: 'Trận đấu đã được lưu',
      xpAwarded: result.xp,
      honorChange: result.honorChange
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
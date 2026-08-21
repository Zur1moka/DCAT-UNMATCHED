// src/controllers/matchController.js
const { processMatch } = require('../services/matchService');
const User = require('../models/User');

exports.createMatch = async (req, res) => {
  try {
    const { player1Id, player2Id, winnerId, player1Hero, player2Hero, isAdminChallenge, isHandicap, isBountyChallenge } = req.body;

    // Validate: các ID phải tồn tại
    const p1 = await User.findById(player1Id);
    const p2 = await User.findById(player2Id);
    const winner = await User.findById(winnerId);
    if (!p1 || !p2 || !winner) {
      return res.status(400).json({ error: 'ID người chơi không hợp lệ' });
    }

    // Kiểm tra tướng
    const hero1 = await Hero.findByName(player1Hero);
    const hero2 = await Hero.findByName(player2Hero);
    if (!hero1 || !hero2) {
      return res.status(400).json({ error: 'Tên tướng không hợp lệ' });
    }

    const result = await processMatch({
      player1Id, player2Id, winnerId,
      player1Hero, player2Hero,
      isAdminChallenge: !!isAdminChallenge,
      isHandicap: !!isHandicap,
      isBountyChallenge: !!isBountyChallenge
    });

    res.status(201).json({
      message: 'Trận đấu đã được lưu',
      data: result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lịch sử trận đấu của một người
exports.getMatchHistory = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const db = require('../config/database');
    db.all(`
      SELECT m.*, 
             u1.username as player1_name, u2.username as player2_name, w.username as winner_name
      FROM matches m
      LEFT JOIN users u1 ON m.player1_id = u1.id
      LEFT JOIN users u2 ON m.player2_id = u2.id
      LEFT JOIN users w ON m.winner_id = w.id
      WHERE m.player1_id = ? OR m.player2_id = ?
      ORDER BY m.created_at DESC
    `, [userId, userId], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
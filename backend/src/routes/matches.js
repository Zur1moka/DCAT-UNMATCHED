// backend/src/routes/matches.js
const express = require('express');
const router = express.Router();
const { processMatch } = require('../services/matchService');
const db = require('../config/database');

// POST /api/matches - Nhập kết quả trận đấu
router.post('/', async (req, res) => {
  try {
    const {
      player1Id,
      player2Id,
      winnerId,
      player1Hero,
      player2Hero,
      isAdminChallenge,
      isHandicap,
      isBountyChallenge
    } = req.body;

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
      isHandicap: isHandicap || false,
      isBountyChallenge: isBountyChallenge || false
    });

    res.status(201).json({
      message: 'Trận đấu đã được lưu',
      data: result
    });
  } catch (error) {
    console.error('Lỗi tạo trận đấu:', error);
    res.status(500).json({ error: error.message || 'Lỗi server' });
  }
});

// GET /api/matches/history/:userId - Lấy lịch sử trận đấu của user
router.get('/history/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID không hợp lệ' });
    }

    db.all(
      `
      SELECT 
        m.*,
        u1.username as player1_name,
        u2.username as player2_name,
        w.username as winner_name
      FROM matches m
      LEFT JOIN users u1 ON m.player1_id = u1.id
      LEFT JOIN users u2 ON m.player2_id = u2.id
      LEFT JOIN users w ON m.winner_id = w.id
      WHERE m.player1_id = ? OR m.player2_id = ?
      ORDER BY m.created_at DESC
      `,
      [userId, userId],
      (err, rows) => {
        if (err) {
          console.error('Lỗi lấy lịch sử:', err);
          return res.status(500).json({ error: err.message });
        }
        res.json(rows);
      }
    );
  } catch (error) {
    console.error('Lỗi lấy lịch sử:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/matches - Lấy tất cả trận đấu (admin)
router.get('/', async (req, res) => {
  try {
    db.all(
      `
      SELECT 
        m.*,
        u1.username as player1_name,
        u2.username as player2_name,
        w.username as winner_name
      FROM matches m
      LEFT JOIN users u1 ON m.player1_id = u1.id
      LEFT JOIN users u2 ON m.player2_id = u2.id
      LEFT JOIN users w ON m.winner_id = w.id
      ORDER BY m.created_at DESC
      `,
      (err, rows) => {
        if (err) {
          console.error('Lỗi lấy danh sách trận:', err);
          return res.status(500).json({ error: err.message });
        }
        res.json(rows);
      }
    );
  } catch (error) {
    console.error('Lỗi lấy danh sách trận:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
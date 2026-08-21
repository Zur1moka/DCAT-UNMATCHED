// backend/src/routes/matches.js
const express = require('express');
const router = express.Router();
const { processMatch } = require('../services/matchService');
const { adminAuth } = require('../middleware/auth');
const db = require('../config/database');
const User = require('../models/User');
const Hero = require('../models/Hero');
const { calculateLevelAndOvercap } = require('../services/userService');

// POST /api/matches - Tạo trận mới
router.post('/', async (req, res) => {
  try {
    const {
      player1Id, player2Id, winnerId,
      player1Hero, player2Hero,
      isAdminChallenge, isHandicap, isBountyChallenge
    } = req.body;

    if (!player1Id || !player2Id || !winnerId || !player1Hero || !player2Hero) {
      return res.status(400).json({ error: 'Thiếu thông tin trận đấu' });
    }

    const result = await processMatch({
      player1Id, player2Id, winnerId,
      player1Hero, player2Hero,
      isAdminChallenge: isAdminChallenge || false,
      isHandicap: isHandicap || false,
      isBountyChallenge: isBountyChallenge || false
    });

    // Emit realtime
    const io = req.app.get('io');
    if (io) {
      io.emit('newMatch', { match: result, timestamp: new Date().toISOString() });
    }

    res.status(201).json({ message: 'Trận đấu đã được lưu', data: result });
  } catch (error) {
    console.error('Lỗi tạo trận:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/matches/history/:userId
router.get('/history/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ error: 'ID không hợp lệ' });
    db.all(
      `SELECT m.*, u1.username as player1_name, u2.username as player2_name, w.username as winner_name
       FROM matches m
       LEFT JOIN users u1 ON m.player1_id = u1.id
       LEFT JOIN users u2 ON m.player2_id = u2.id
       LEFT JOIN users w ON m.winner_id = w.id
       WHERE m.player1_id = ? OR m.player2_id = ?
       ORDER BY m.created_at DESC`,
      [userId, userId],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/matches - Tất cả trận (admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    db.all(
      `SELECT m.*, u1.username as player1_name, u2.username as player2_name, w.username as winner_name
       FROM matches m
       LEFT JOIN users u1 ON m.player1_id = u1.id
       LEFT JOIN users u2 ON m.player2_id = u2.id
       LEFT JOIN users w ON m.winner_id = w.id
       ORDER BY m.created_at DESC`,
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/matches/:id - Cập nhật trận (admin)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const matchId = req.params.id;
    const {
      player1Id, player2Id, winnerId,
      player1Hero, player2Hero,
      isAdminChallenge, isHandicap, isBountyChallenge
    } = req.body;

    // Lấy thông tin trận cũ
    const oldMatch = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM matches WHERE id = ?`, [matchId], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    if (!oldMatch) return res.status(404).json({ error: 'Không tìm thấy trận đấu' });

    // TODO: Cần logic hoàn chỉnh để hoàn tác điểm cũ và cộng điểm mới
    // Phức tạp, tạm thời chưa implement đầy đủ

    res.status(501).json({ error: 'Chức năng đang phát triển' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/matches/:id - Xóa trận (admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const matchId = req.params.id;

    // Lấy thông tin trận
    const match = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM matches WHERE id = ?`, [matchId], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    if (!match) return res.status(404).json({ error: 'Không tìm thấy trận đấu' });

    // Hoàn tác điểm cho người thắng
    const winner = await User.findById(match.winner_id);
    const loserId = match.player1_id === match.winner_id ? match.player2_id : match.player1_id;
    const loser = await User.findById(loserId);

    if (winner) {
      const newXp = Math.max(0, winner.xp - match.xp_awarded);
      // Nếu có honor, trừ đi (tạm thời bỏ qua phức tạp)
      const levelInfo = calculateLevelAndOvercap(newXp);
      await User.update(match.winner_id, {
        xp: newXp,
        level: levelInfo.level,
        overcap_xp: levelInfo.overcapXp,
        overcap_tickets: levelInfo.overcapTickets,
        wins: Math.max(0, winner.wins - 1)
      });
    }

    if (loser) {
      await User.update(loserId, {
        losses: Math.max(0, loser.losses - 1)
      });
    }

    // Xóa trận
    await new Promise((resolve, reject) => {
      db.run(`DELETE FROM matches WHERE id = ?`, [matchId], function(err) {
        if (err) reject(err);
        resolve(this.changes);
      });
    });

    // Emit realtime
    const io = req.app.get('io');
    if (io) {
      io.emit('matchDeleted', { matchId });
    }

    res.json({ message: 'Xóa trận thành công' });
  } catch (error) {
    console.error('Lỗi xóa trận:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
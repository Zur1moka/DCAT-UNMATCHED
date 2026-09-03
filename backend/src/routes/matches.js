// backend/src/routes/matches.js
const express = require('express');
const router = express.Router();
const { processMatch } = require('../services/matchService');
const { adminAuth } = require('../middleware/auth');
const pool = require('../config/database');
const User = require('../models/User');
const { calculateLevelAndOvercap } = require('../services/userService');

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

router.get('/history/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ error: 'ID không hợp lệ' });
    const result = await pool.query(`
      SELECT m.*, u1.username as player1_name, u2.username as player2_name, w.username as winner_name
      FROM matches m
      LEFT JOIN users u1 ON m.player1_id = u1.id
      LEFT JOIN users u2 ON m.player2_id = u2.id
      LEFT JOIN users w ON m.winner_id = w.id
      WHERE m.player1_id = $1 OR m.player2_id = $1
      ORDER BY m.created_at DESC
    `, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Lỗi history:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, u1.username as player1_name, u2.username as player2_name, w.username as winner_name
      FROM matches m
      LEFT JOIN users u1 ON m.player1_id = u1.id
      LEFT JOIN users u2 ON m.player2_id = u2.id
      LEFT JOIN users w ON m.winner_id = w.id
      ORDER BY m.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Lỗi getAllMatches:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const matchId = req.params.id;
    const oldMatch = await pool.query(`SELECT * FROM matches WHERE id = $1`, [matchId]);
    if (oldMatch.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy trận đấu' });
    }
    res.status(501).json({ error: 'Chức năng đang phát triển' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const matchId = req.params.id;
    const matchResult = await pool.query(`SELECT * FROM matches WHERE id = $1`, [matchId]);
    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy trận đấu' });
    }
    const match = matchResult.rows[0];

    const winner = await User.findById(match.winner_id);
    const loserId = match.player1_id === match.winner_id ? match.player2_id : match.player1_id;
    const loser = await User.findById(loserId);

    if (winner) {
      const newXp = Math.max(0, winner.xp - match.xp_awarded);
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

    await pool.query(`DELETE FROM matches WHERE id = $1`, [matchId]);

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
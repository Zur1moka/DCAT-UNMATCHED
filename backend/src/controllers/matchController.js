// backend/src/controllers/matchController.js
const { processMatch } = require('../services/matchService');
const db = require('../config/database');

exports.createMatch = async (req, res) => {
  try {
    const result = await processMatch(req.body);
    res.status(201).json({
      message: 'Trận đấu đã được lưu',
      data: result
    });
  } catch (err) {
    console.error('Lỗi createMatch:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getMatchHistory = (req, res) => {
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
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

exports.getAllMatches = (req, res) => {
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
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};
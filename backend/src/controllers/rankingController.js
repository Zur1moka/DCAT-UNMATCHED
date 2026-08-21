// src/controllers/rankingController.js
const db = require('../config/database');

exports.getExpRanking = (req, res) => {
  // Xếp hạng theo XP, tie-breaker: wins
  db.all(`
    SELECT id, username, xp, wins, level, overcap_tickets
    FROM users
    ORDER BY xp DESC, wins DESC
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.getHonorRanking = (req, res) => {
  // Xếp hạng theo honor_points, tie-breaker: winrate (tính từ wins/(wins+losses))
  db.all(`
    SELECT id, username, honor_points, wins, losses,
           CASE WHEN (wins + losses) = 0 THEN 0 ELSE ROUND(1.0 * wins / (wins + losses), 2) END as winrate
    FROM users
    ORDER BY honor_points DESC, winrate DESC
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};
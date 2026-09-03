// backend/src/controllers/rankingController.js
const pool = require('../config/database');

exports.getExpRanking = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, xp, wins, level, overcap_tickets
      FROM users
      ORDER BY xp DESC, wins DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHonorRanking = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, honor_points, wins, losses,
             CASE WHEN (wins + losses) = 0 THEN 0 ELSE ROUND(1.0 * wins / (wins + losses), 2) END as winrate
      FROM users
      ORDER BY honor_points DESC, winrate DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
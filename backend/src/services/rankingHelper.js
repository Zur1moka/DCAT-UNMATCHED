const pool = require('../config/database');

async function getUserHonorRank(userId) {
  const result = await pool.query(`
    SELECT rank FROM (
      SELECT 
        id,
        RANK() OVER (ORDER BY honor_points DESC, (wins * 1.0 / NULLIF(wins + losses, 0)) DESC) as rank
      FROM users
    ) ranked WHERE id = $1
  `, [userId]);
  return result.rows[0]?.rank || null;
}

async function getUserExpRank(userId) {
  const result = await pool.query(`
    SELECT rank FROM (
      SELECT 
        id,
        RANK() OVER (ORDER BY xp DESC, wins DESC) as rank
      FROM users
    ) ranked WHERE id = $1
  `, [userId]);
  return result.rows[0]?.rank || null;
}

module.exports = { getUserHonorRank, getUserExpRank };
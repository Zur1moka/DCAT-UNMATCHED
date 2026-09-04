const pool = require('../config/database');

async function canAdminChallenge(userId) {
  const today = new Date().toISOString().split('T')[0];
  const result = await pool.query(
    `SELECT count FROM admin_challenges WHERE user_id = $1 AND challenge_date = $2`,
    [userId, today]
  );
  if (result.rows.length === 0) return true;
  return result.rows[0].count < 5;
}

async function incrementAdminChallenge(userId) {
  const today = new Date().toISOString().split('T')[0];
  await pool.query(
    `INSERT INTO admin_challenges (user_id, challenge_date, count)
     VALUES ($1, $2, 1)
     ON CONFLICT(user_id, challenge_date) DO UPDATE SET count = admin_challenges.count + 1`,
    [userId, today]
  );
}

module.exports = { canAdminChallenge, incrementAdminChallenge };
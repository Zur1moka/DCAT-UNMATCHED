// backend/src/services/adminBonusService.js
const db = require('../config/database');

/**
 * Kiểm tra xem người chơi có thể khiêu chiến admin trong ngày không
 * @param {number} userId - ID của người chơi
 * @returns {Promise<boolean>} - true nếu có thể, false nếu đã đủ 5 lần
 */
async function canAdminChallenge(userId) {
  const today = new Date().toISOString().split('T')[0];
  const row = await new Promise((resolve, reject) => {
    db.get(
      `SELECT count FROM admin_challenges WHERE user_id = ? AND challenge_date = ?`,
      [userId, today],
      (err, row) => {
        if (err) reject(err);
        resolve(row);
      }
    );
  });
  if (!row) return true;
  return row.count < 5;
}

/**
 * Tăng số lần khiêu chiến admin của người chơi trong ngày
 * @param {number} userId - ID của người chơi
 */
async function incrementAdminChallenge(userId) {
  const today = new Date().toISOString().split('T')[0];
  await new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO admin_challenges (user_id, challenge_date, count)
       VALUES (?, ?, 1)
       ON CONFLICT(user_id, challenge_date) DO UPDATE SET count = count + 1`,
      [userId, today],
      (err) => {
        if (err) reject(err);
        resolve();
      }
    );
  });
}

module.exports = { canAdminChallenge, incrementAdminChallenge };
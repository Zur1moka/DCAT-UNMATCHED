// backend/src/services/rankingHelper.js
const db = require('../config/database');

/**
 * Lấy thứ hạng Honor (ELO) của một người chơi
 * @param {number} userId - ID của người chơi
 * @returns {Promise<number|null>} - Thứ hạng (1-based), null nếu không tìm thấy
 */
async function getUserHonorRank(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      `
      SELECT rank FROM (
        SELECT 
          id,
          RANK() OVER (ORDER BY honor_points DESC, (wins * 1.0 / NULLIF(wins + losses, 0)) DESC) as rank
        FROM users
      ) WHERE id = ?
      `,
      [userId],
      (err, row) => {
        if (err) reject(err);
        resolve(row ? row.rank : null);
      }
    );
  });
}

/**
 * Lấy thứ hạng EXP của một người chơi
 * @param {number} userId - ID của người chơi
 * @returns {Promise<number|null>} - Thứ hạng (1-based), null nếu không tìm thấy
 */
async function getUserExpRank(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      `
      SELECT rank FROM (
        SELECT 
          id,
          RANK() OVER (ORDER BY xp DESC, wins DESC) as rank
        FROM users
      ) WHERE id = ?
      `,
      [userId],
      (err, row) => {
        if (err) reject(err);
        resolve(row ? row.rank : null);
      }
    );
  });
}

module.exports = { getUserHonorRank, getUserExpRank };
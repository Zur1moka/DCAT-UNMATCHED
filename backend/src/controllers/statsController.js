// backend/src/controllers/statsController.js
const pool = require('../config/database');

// ===== TỔNG QUAN =====
exports.getOverviewStats = async (req, res) => {
  try {
    // Tổng người chơi
    const totalUsersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = totalUsersResult.rows[0].count;

    // Tổng trận đấu
    const totalMatchesResult = await pool.query('SELECT COUNT(*) as count FROM matches');
    const totalMatches = totalMatchesResult.rows[0].count;

    // Tổng check-in
    const totalCheckinsResult = await pool.query('SELECT COUNT(*) as count FROM checkins');
    const totalCheckins = totalCheckinsResult.rows[0].count;

    // Tổng nhiệm vụ hoàn thành
    const totalQuestsResult = await pool.query('SELECT COUNT(*) as count FROM user_quests');
    const totalQuestsCompleted = totalQuestsResult.rows[0].count;

    // Top 5 tướng được sử dụng nhiều nhất
    const topHeroesResult = await pool.query(`
      SELECT name, tier, usage_count, wins, losses,
             ROUND(1.0 * wins / NULLIF(usage_count, 0) * 100, 1) as winrate
      FROM heroes
      WHERE usage_count > 0
      ORDER BY usage_count DESC
      LIMIT 5
    `);
    const topHeroes = topHeroesResult.rows;

    res.json({
      totalUsers,
      totalMatches,
      totalCheckins,
      totalQuestsCompleted,
      topHeroes
    });
  } catch (err) {
    console.error('Lỗi getOverviewStats:', err);
    res.status(500).json({ error: err.message });
  }
};

// ===== THỐNG KÊ THEO NGÀY =====
exports.getDailyStats = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as matches,
        SUM(xp_awarded) as total_xp
      FROM matches
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi getDailyStats:', err);
    res.status(500).json({ error: err.message });
  }
};

// ===== PHÂN BỐ CẤP ĐỘ =====
exports.getLevelDistribution = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        level,
        COUNT(*) as count
      FROM users
      GROUP BY level
      ORDER BY level ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi getLevelDistribution:', err);
    res.status(500).json({ error: err.message });
  }
};
// backend/src/services/exportService.js
const db = require('../config/database');

// Hàm chuyển đổi dữ liệu thành CSV
function convertToCSV(data, headers) {
  if (!data || data.length === 0) return '';
  
  const headerRow = headers.map(h => `"${h}"`).join(',');
  const rows = data.map(row => {
    return headers.map(header => {
      const value = row[header] !== undefined && row[header] !== null ? row[header] : '';
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });
  return [headerRow, ...rows].join('\n');
}

// 1. Xuất danh sách người chơi
async function exportUsers() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        id, 
        username, 
        xp, 
        honor_points as honor, 
        level, 
        wins, 
        losses,
        CASE WHEN (wins + losses) = 0 THEN 0 ELSE ROUND(1.0 * wins / (wins + losses) * 100, 1) END as winrate
      FROM users 
      ORDER BY xp DESC
    `, (err, rows) => {
      if (err) reject(err);
      const headers = ['id', 'username', 'xp', 'honor', 'level', 'wins', 'losses', 'winrate'];
      resolve({
        data: rows,
        csv: convertToCSV(rows, headers),
        filename: `users_${new Date().toISOString().split('T')[0]}.csv`
      });
    });
  });
}

// 2. Xuất lịch sử trận đấu
async function exportMatches() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        m.id,
        m.created_at as time,
        u1.username as player1,
        m.player1_hero as hero1,
        u2.username as player2,
        m.player2_hero as hero2,
        w.username as winner,
        m.xp_awarded as xp,
        CASE WHEN m.is_admin_challenge = 1 THEN 'Yes' ELSE 'No' END as admin_challenge,
        CASE WHEN m.handicap_applied = 1 THEN 'Yes' ELSE 'No' END as handicap_applied
      FROM matches m
      LEFT JOIN users u1 ON m.player1_id = u1.id
      LEFT JOIN users u2 ON m.player2_id = u2.id
      LEFT JOIN users w ON m.winner_id = w.id
      ORDER BY m.created_at DESC
    `, (err, rows) => {
      if (err) reject(err);
      const headers = ['id', 'time', 'player1', 'hero1', 'player2', 'hero2', 'winner', 'xp', 'admin_challenge', 'handicap_applied'];
      resolve({
        data: rows,
        csv: convertToCSV(rows, headers),
        filename: `matches_${new Date().toISOString().split('T')[0]}.csv`
      });
    });
  });
}

// 3. Xuất bảng xếp hạng (EXP + Honor)
async function exportRanking() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        ROW_NUMBER() OVER (ORDER BY xp DESC, wins DESC) as exp_rank,
        username,
        xp,
        level,
        wins,
        losses,
        honor_points as honor,
        CASE WHEN (wins + losses) = 0 THEN 0 ELSE ROUND(1.0 * wins / (wins + losses) * 100, 1) END as winrate
      FROM users 
      ORDER BY xp DESC, wins DESC
    `, (err, rows) => {
      if (err) reject(err);
      const headers = ['exp_rank', 'username', 'xp', 'level', 'wins', 'losses', 'honor', 'winrate'];
      resolve({
        data: rows,
        csv: convertToCSV(rows, headers),
        filename: `ranking_${new Date().toISOString().split('T')[0]}.csv`
      });
    });
  });
}

module.exports = { exportUsers, exportMatches, exportRanking };
const pool = require('../config/database');

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

async function exportUsers() {
  const result = await pool.query(`
    SELECT 
      id, username, xp, honor_points as honor, level, wins, losses,
      CASE WHEN (wins + losses) = 0 THEN 0 ELSE ROUND(1.0 * wins / (wins + losses) * 100, 1) END as winrate
    FROM users ORDER BY xp DESC
  `);
  const headers = ['id', 'username', 'xp', 'honor', 'level', 'wins', 'losses', 'winrate'];
  return {
    data: result.rows,
    csv: convertToCSV(result.rows, headers),
    filename: `users_${new Date().toISOString().split('T')[0]}.csv`
  };
}

// Tương tự cho exportMatches và exportRanking (cũng sửa thành pool.query)
// Vì dài nên mình sẽ gửi phần còn lại nếu bạn cần, nhưng cách sửa tương tự
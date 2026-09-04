const db = require('../config/database');
const ExcelJS = require('exceljs');

// ===== HELPER CSV =====
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

// ===== CSV EXPORTS =====
exports.exportUsers = async (req, res) => {
  try {
    const users = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, username, xp, honor_points as honor, level, wins, losses,
               CASE WHEN (wins + losses) = 0 THEN 0 ELSE ROUND(1.0 * wins / (wins + losses) * 100, 1) END as winrate
        FROM users ORDER BY xp DESC
      `, (err, rows) => { if (err) reject(err); resolve(rows); });
    });
    const headers = ['id', 'username', 'xp', 'honor', 'level', 'wins', 'losses', 'winrate'];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=users_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(convertToCSV(users, headers));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.exportMatches = async (req, res) => {
  try {
    const matches = await new Promise((resolve, reject) => {
      db.all(`
        SELECT m.id, m.created_at as time, u1.username as player1, m.player1_hero as hero1,
               u2.username as player2, m.player2_hero as hero2, w.username as winner,
               m.xp_awarded as xp
        FROM matches m
        LEFT JOIN users u1 ON m.player1_id = u1.id
        LEFT JOIN users u2 ON m.player2_id = u2.id
        LEFT JOIN users w ON m.winner_id = w.id
        ORDER BY m.created_at DESC
      `, (err, rows) => { if (err) reject(err); resolve(rows); });
    });
    const headers = ['id', 'time', 'player1', 'hero1', 'player2', 'hero2', 'winner', 'xp'];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=matches_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(convertToCSV(matches, headers));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.exportRanking = async (req, res) => {
  try {
    const ranking = await new Promise((resolve, reject) => {
      db.all(`
        SELECT ROW_NUMBER() OVER (ORDER BY xp DESC, wins DESC) as exp_rank,
               username, xp, level, wins, losses, honor_points as honor,
               CASE WHEN (wins + losses) = 0 THEN 0 ELSE ROUND(1.0 * wins / (wins + losses) * 100, 1) END as winrate
        FROM users ORDER BY xp DESC, wins DESC
      `, (err, rows) => { if (err) reject(err); resolve(rows); });
    });
    const headers = ['exp_rank', 'username', 'xp', 'level', 'wins', 'losses', 'honor', 'winrate'];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=ranking_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(convertToCSV(ranking, headers));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ===== HELPER EXCEL =====
async function createExcelWorkbook(data, headers, sheetName) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName || 'Sheet1');

  // Header
  const headerRow = worksheet.addRow(headers.map(h => h.label || h.key));
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
  headerRow.height = 25;

  headers.forEach((h, i) => {
    worksheet.getColumn(i + 1).width = h.width || 20;
    worksheet.getColumn(i + 1).alignment = { horizontal: 'left', vertical: 'middle' };
  });

  data.forEach(row => {
    const rowData = headers.map(h => row[h.key] !== undefined ? row[h.key] : '');
    const addedRow = worksheet.addRow(rowData);
    addedRow.alignment = { vertical: 'middle' };
  });

  // Border
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };
    });
  });

  return workbook;
}

// ===== EXCEL EXPORTS =====
exports.exportUsersExcel = async (req, res) => {
  try {
    const users = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, username, xp, honor_points as honor, level, wins, losses,
               CASE WHEN (wins + losses) = 0 THEN 0 ELSE ROUND(1.0 * wins / (wins + losses) * 100, 1) END as winrate
        FROM users ORDER BY xp DESC
      `, (err, rows) => { if (err) reject(err); resolve(rows); });
    });
    const headers = [
      { key: 'id', label: 'ID', width: 10 },
      { key: 'username', label: 'Username', width: 20 },
      { key: 'xp', label: 'XP', width: 15 },
      { key: 'honor', label: 'Honor', width: 15 },
      { key: 'level', label: 'Level', width: 10 },
      { key: 'wins', label: 'Wins', width: 10 },
      { key: 'losses', label: 'Losses', width: 10 },
      { key: 'winrate', label: 'Winrate %', width: 12 },
    ];
    const workbook = await createExcelWorkbook(users, headers, 'Users');
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=users_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.exportMatchesExcel = async (req, res) => {
  try {
    const matches = await new Promise((resolve, reject) => {
      db.all(`
        SELECT m.id, m.created_at as time, u1.username as player1, m.player1_hero as hero1,
               u2.username as player2, m.player2_hero as hero2, w.username as winner,
               m.xp_awarded as xp
        FROM matches m
        LEFT JOIN users u1 ON m.player1_id = u1.id
        LEFT JOIN users u2 ON m.player2_id = u2.id
        LEFT JOIN users w ON m.winner_id = w.id
        ORDER BY m.created_at DESC
      `, (err, rows) => { if (err) reject(err); resolve(rows); });
    });
    const headers = [
      { key: 'id', label: 'ID', width: 8 },
      { key: 'time', label: 'Time', width: 20 },
      { key: 'player1', label: 'Player 1', width: 20 },
      { key: 'hero1', label: 'Hero 1', width: 15 },
      { key: 'player2', label: 'Player 2', width: 20 },
      { key: 'hero2', label: 'Hero 2', width: 15 },
      { key: 'winner', label: 'Winner', width: 20 },
      { key: 'xp', label: 'XP', width: 10 },
    ];
    const workbook = await createExcelWorkbook(matches, headers, 'Matches');
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=matches_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.exportRankingExcel = async (req, res) => {
  try {
    const ranking = await new Promise((resolve, reject) => {
      db.all(`
        SELECT ROW_NUMBER() OVER (ORDER BY xp DESC, wins DESC) as exp_rank,
               username, xp, level, wins, losses, honor_points as honor,
               CASE WHEN (wins + losses) = 0 THEN 0 ELSE ROUND(1.0 * wins / (wins + losses) * 100, 1) END as winrate
        FROM users ORDER BY xp DESC, wins DESC
      `, (err, rows) => { if (err) reject(err); resolve(rows); });
    });
    const headers = [
      { key: 'exp_rank', label: 'Exp Rank', width: 10 },
      { key: 'username', label: 'Username', width: 20 },
      { key: 'xp', label: 'XP', width: 15 },
      { key: 'level', label: 'Level', width: 10 },
      { key: 'wins', label: 'Wins', width: 10 },
      { key: 'losses', label: 'Losses', width: 10 },
      { key: 'honor', label: 'Honor', width: 15 },
      { key: 'winrate', label: 'Winrate %', width: 12 },
    ];
    const workbook = await createExcelWorkbook(ranking, headers, 'Ranking');
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=ranking_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
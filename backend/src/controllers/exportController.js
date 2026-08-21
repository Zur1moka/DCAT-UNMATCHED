// backend/src/controllers/exportController.js
const { exportUsers, exportMatches, exportRanking } = require('../services/exportService');

// Export danh sách người chơi
exports.exportUsers = async (req, res) => {
  try {
    const result = await exportUsers();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Export lịch sử trận đấu
exports.exportMatches = async (req, res) => {
  try {
    const result = await exportMatches();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Export bảng xếp hạng
exports.exportRanking = async (req, res) => {
  try {
    const result = await exportRanking();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
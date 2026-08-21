const { checkIn } = require('../services/questService');

exports.doCheckIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await checkIn(userId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getUserQuests = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = require('../config/database');
    const quests = await new Promise((resolve, reject) => {
      db.all(`
        SELECT q.*, 
               CASE WHEN uq.id IS NOT NULL THEN 1 ELSE 0 END as completed
        FROM quests q
        LEFT JOIN user_quests uq ON q.id = uq.quest_id AND uq.user_id = ?
        WHERE q.is_active = 1
      `, [userId], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
    res.json(quests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
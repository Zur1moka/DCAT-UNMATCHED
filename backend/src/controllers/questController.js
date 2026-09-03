// backend/src/controllers/questController.js
const pool = require('../config/database');
const { checkIn, approveQuest } = require('../services/questService');

// ===== CHECK-IN =====
exports.doCheckIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await checkIn(userId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ===== LẤY DANH SÁCH NHIỆM VỤ CỦA USER =====
exports.getUserQuests = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(`
      SELECT q.*, 
             CASE WHEN uq.id IS NOT NULL THEN 1 ELSE 0 END as completed
      FROM quests q
      LEFT JOIN user_quests uq ON q.id = uq.quest_id AND uq.user_id = $1
      WHERE q.is_active = true
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi getUserQuests:', err);
    res.status(500).json({ error: err.message });
  }
};

// ===== LẤY DANH SÁCH NHIỆM VỤ CHỜ DUYỆT (ADMIN) =====
exports.getPendingQuests = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        qa.id,
        qa.user_quest_id,
        qa.status,
        qa.created_at,
        u.username as user_name,
        q.name as quest_name,
        q.description,
        q.reward_xp,
        q.reward_honor,
        uq.completed_at
      FROM quest_approvals qa
      JOIN user_quests uq ON qa.user_quest_id = uq.id
      JOIN users u ON uq.user_id = u.id
      JOIN quests q ON uq.quest_id = q.id
      WHERE qa.status = 'pending'
      ORDER BY qa.created_at ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi getPendingQuests:', err);
    res.status(500).json({ error: err.message });
  }
};

// ===== PHÊ DUYỆT NHIỆM VỤ (ADMIN) =====
exports.approveQuest = async (req, res) => {
  try {
    const { userQuestId } = req.params;
    const { status, note } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }
    const result = await approveQuest(parseInt(userQuestId), req.user.id, status, note);
    res.json({ 
      message: `Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} nhiệm vụ`, 
      result 
    });
  } catch (err) {
    console.error('Lỗi approveQuest:', err);
    res.status(400).json({ error: err.message });
  }
};
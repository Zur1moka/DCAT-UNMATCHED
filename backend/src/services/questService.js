// backend/src/services/questService.js
const db = require('../config/database');
const User = require('../models/User');
const { calculateLevelAndOvercap } = require('./userService');

// ===== CHECK-IN =====
async function checkIn(userId) {
  const today = new Date().toISOString().split('T')[0];
  
  const existing = await new Promise((resolve, reject) => {
    db.get(`SELECT * FROM checkins WHERE user_id = ? AND checkin_date = ?`, [userId, today], (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });

  if (existing) {
    throw new Error('Hôm nay bạn đã check-in rồi!');
  }

  await new Promise((resolve, reject) => {
    db.run(`INSERT INTO checkins (user_id, checkin_date) VALUES (?, ?)`, [userId, today], function(err) {
      if (err) reject(err);
      resolve(this.lastID);
    });
  });

  const user = await User.findById(userId);
  const newXp = user.xp + 50;
  const levelInfo = calculateLevelAndOvercap(newXp);
  
  await User.update(userId, {
    xp: newXp,
    level: levelInfo.level,
    overcap_xp: levelInfo.overcapXp,
    overcap_tickets: levelInfo.overcapTickets
  });

  return {
    message: 'Check-in thành công! +50XP',
    xpAwarded: 50,
    newLevel: levelInfo.level,
    overcapTickets: levelInfo.overcapTickets
  };
}

// ===== KIỂM TRA NHIỆM VỤ =====
async function checkQuests(userId, matchData) {
  const completedQuests = [];
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sunday, 4=Thursday
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  // 1. Đêm Thứ 5 (Thursday)
  if (dayOfWeek === 4) {
    const quest = await getQuestByName('Đêm Thứ 5 Nhộn Nhịp');
    if (quest) {
      const completed = await isQuestCompleted(userId, quest.id);
      if (!completed) {
        await completeQuest(userId, quest.id, quest.reward_xp, quest.reward_honor);
        completedQuests.push(quest.name);
      }
    }
  }

  // 2. Thử thách Thảm Đỏ (thắng bằng tướng C/D)
  if (matchData.isWin && matchData.winnerHeroTier && ['C', 'D'].includes(matchData.winnerHeroTier)) {
    const quest = await getQuestByName('Thử thách Thảm Đỏ');
    if (quest) {
      const completed = await isQuestCompleted(userId, quest.id);
      if (!completed) {
        const weeklyCompleted = await isQuestCompletedInWeek(userId, quest.id, weekStart);
        if (!weeklyCompleted) {
          await completeQuest(userId, quest.id, quest.reward_xp, quest.reward_honor);
          completedQuests.push(quest.name);
        }
      }
    }
  }

  return completedQuests;
}

// ===== LẤY QUEST THEO TÊN =====
function getQuestByName(name) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM quests WHERE name = ?`, [name], (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });
}

// ===== LẤY QUEST THEO ID =====
function getQuestById(questId) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM quests WHERE id = ?`, [questId], (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });
}

// ===== KIỂM TRA QUEST ĐÃ HOÀN THÀNH CHƯA =====
function isQuestCompleted(userId, questId) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM user_quests WHERE user_id = ? AND quest_id = ?`, [userId, questId], (err, row) => {
      if (err) reject(err);
      resolve(!!row);
    });
  });
}

// ===== KIỂM TRA QUEST HOÀN THÀNH TRONG TUẦN =====
function isQuestCompletedInWeek(userId, questId, weekStart) {
  return new Promise((resolve, reject) => {
    const weekStartStr = weekStart.toISOString();
    db.get(`
      SELECT * FROM user_quests 
      WHERE user_id = ? AND quest_id = ? AND completed_at >= ?
    `, [userId, questId, weekStartStr], (err, row) => {
      if (err) reject(err);
      resolve(!!row);
    });
  });
}

// ===== HOÀN THÀNH QUEST (CÓ PHÊ DUYỆT) =====
async function completeQuest(userId, questId, xpReward, honorReward = 0) {
  // Kiểm tra quest có yêu cầu phê duyệt không
  const quest = await getQuestById(questId);
  
  // Lưu user_quests
  const userQuestId = await new Promise((resolve, reject) => {
    db.run(`INSERT INTO user_quests (user_id, quest_id) VALUES (?, ?)`, [userId, questId], function (err) {
      if (err) reject(err);
      resolve(this.lastID);
    });
  });

  if (quest && quest.requires_approval) {
    // Tạo bản ghi chờ phê duyệt (admin_id = 1 tạm thời, sau này lấy từ req.user)
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO quest_approvals (user_quest_id, admin_id, status) VALUES (?, ?, 'pending')`,
        [userQuestId, 1],
        function (err) {
          if (err) reject(err);
          resolve(this.lastID);
        }
      );
    });
    return { xpAwarded: 0, honorAwarded: 0, pending: true };
  } else {
    // Cộng thưởng ngay
    const user = await User.findById(userId);
    const newXp = user.xp + xpReward;
    const newHonor = user.honor_points + honorReward;
    const levelInfo = calculateLevelAndOvercap(newXp);

    await User.update(userId, {
      xp: newXp,
      honor_points: newHonor,
      level: levelInfo.level,
      overcap_xp: levelInfo.overcapXp,
      overcap_tickets: levelInfo.overcapTickets,
    });

    return { xpAwarded: xpReward, honorAwarded: honorReward, pending: false };
  }
}

// ===== PHÊ DUYỆT NHIỆM VỤ (ADMIN) =====
async function approveQuest(userQuestId, adminId, status, note = '') {
  // Kiểm tra tồn tại
  const approval = await new Promise((resolve, reject) => {
    db.get(`SELECT * FROM quest_approvals WHERE user_quest_id = ?`, [userQuestId], (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });
  if (!approval) throw new Error('Không tìm thấy yêu cầu phê duyệt');

  // Lấy thông tin user_quest
  const userQuest = await new Promise((resolve, reject) => {
    db.get(`SELECT * FROM user_quests WHERE id = ?`, [userQuestId], (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });
  if (!userQuest) throw new Error('Không tìm thấy user_quest');

  // Lấy quest
  const quest = await getQuestById(userQuest.quest_id);
  if (!quest) throw new Error('Không tìm thấy quest');

  // Cập nhật approval
  await new Promise((resolve, reject) => {
    db.run(
      `UPDATE quest_approvals SET status = ?, note = ?, updated_at = CURRENT_TIMESTAMP WHERE user_quest_id = ?`,
      [status, note, userQuestId],
      function (err) {
        if (err) reject(err);
        resolve(this.changes);
      }
    );
  });

  if (status === 'approved') {
    // Cộng thưởng
    const user = await User.findById(userQuest.user_id);
    const newXp = user.xp + quest.reward_xp;
    const newHonor = user.honor_points + quest.reward_honor;
    const levelInfo = calculateLevelAndOvercap(newXp);

    await User.update(userQuest.user_id, {
      xp: newXp,
      honor_points: newHonor,
      level: levelInfo.level,
      overcap_xp: levelInfo.overcapXp,
      overcap_tickets: levelInfo.overcapTickets,
    });
  }

  return { userQuestId, status };
}

module.exports = { 
  checkIn, 
  checkQuests, 
  completeQuest, 
  approveQuest, 
  getQuestById,
  getQuestByName,
  isQuestCompleted,
  isQuestCompletedInWeek
};
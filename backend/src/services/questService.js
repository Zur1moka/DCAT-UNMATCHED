// backend/src/services/questService.js
const pool = require('../config/database');
const User = require('../models/User');
const { calculateLevelAndOvercap } = require('./userService');

async function checkIn(userId) {
  const today = new Date().toISOString().split('T')[0];
  const existing = await pool.query(
    `SELECT * FROM checkins WHERE user_id = $1 AND checkin_date = $2`,
    [userId, today]
  );
  if (existing.rows.length > 0) {
    throw new Error('Hôm nay bạn đã check-in rồi!');
  }
  await pool.query(
    `INSERT INTO checkins (user_id, checkin_date) VALUES ($1, $2)`,
    [userId, today]
  );
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

async function getQuestByName(name) {
  const result = await pool.query(`SELECT * FROM quests WHERE name = $1`, [name]);
  return result.rows[0];
}

async function getQuestById(questId) {
  const result = await pool.query(`SELECT * FROM quests WHERE id = $1`, [questId]);
  return result.rows[0];
}

async function isQuestCompleted(userId, questId) {
  const result = await pool.query(
    `SELECT * FROM user_quests WHERE user_id = $1 AND quest_id = $2`,
    [userId, questId]
  );
  return result.rows.length > 0;
}

async function isQuestCompletedInWeek(userId, questId, weekStart) {
  const result = await pool.query(
    `SELECT * FROM user_quests WHERE user_id = $1 AND quest_id = $2 AND completed_at >= $3`,
    [userId, questId, weekStart.toISOString()]
  );
  return result.rows.length > 0;
}

async function completeQuest(userId, questId, xpReward, honorReward = 0) {
  const quest = await getQuestById(questId);
  const uqResult = await pool.query(
    `INSERT INTO user_quests (user_id, quest_id) VALUES ($1, $2) RETURNING id`,
    [userId, questId]
  );
  const userQuestId = uqResult.rows[0].id;

  if (quest && quest.requires_approval) {
    await pool.query(
      `INSERT INTO quest_approvals (user_quest_id, admin_id, status) VALUES ($1, $2, 'pending')`,
      [userQuestId, 1]
    );
    return { xpAwarded: 0, honorAwarded: 0, pending: true };
  } else {
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

async function checkQuests(userId, matchData) {
  const completedQuests = [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

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

async function approveQuest(userQuestId, adminId, status, note = '') {
  const approvalResult = await pool.query(
    `SELECT * FROM quest_approvals WHERE user_quest_id = $1`,
    [userQuestId]
  );
  if (approvalResult.rows.length === 0) {
    throw new Error('Không tìm thấy yêu cầu phê duyệt');
  }

  const uqResult = await pool.query(
    `SELECT * FROM user_quests WHERE id = $1`,
    [userQuestId]
  );
  if (uqResult.rows.length === 0) {
    throw new Error('Không tìm thấy user_quest');
  }
  const userQuest = uqResult.rows[0];

  const quest = await getQuestById(userQuest.quest_id);
  if (!quest) throw new Error('Không tìm thấy quest');

  await pool.query(
    `UPDATE quest_approvals SET status = $1, note = $2, updated_at = CURRENT_TIMESTAMP WHERE user_quest_id = $3`,
    [status, note, userQuestId]
  );

  if (status === 'approved') {
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

module.exports = { checkIn, checkQuests, completeQuest, approveQuest, getQuestById };
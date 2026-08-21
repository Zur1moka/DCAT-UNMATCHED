const db = require('../config/database');
const User = require('../models/User');
const { calculateLevelAndOvercap } = require('./userService');

async function checkIn(userId) {
  const today = new Date().toISOString().split('T')[0];
  
  const existing = await new Promise((resolve, reject) => {
    db.get(`SELECT * FROM checkins WHERE user_id = ? AND checkin_date = ?`, [userId, today], (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });

  if (existing) throw new Error('Hôm nay bạn đã check-in rồi!');

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

async function checkQuests(userId, matchData) {
  const completedQuests = [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  // 1. Đêm Thứ 5
  if (dayOfWeek === 4) {
    const quest = await getQuestByName('Đêm Thứ 5 Nhộn Nhịp');
    if (quest && !(await isQuestCompleted(userId, quest.id))) {
      await completeQuest(userId, quest.id, quest.reward_xp, quest.reward_honor);
      completedQuests.push(quest.name);
    }
  }

  // 2. Thử thách Thảm Đỏ
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

function getQuestByName(name) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM quests WHERE name = ?`, [name], (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });
}

function isQuestCompleted(userId, questId) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM user_quests WHERE user_id = ? AND quest_id = ?`, [userId, questId], (err, row) => {
      if (err) reject(err);
      resolve(!!row);
    });
  });
}

function isQuestCompletedInWeek(userId, questId, weekStart) {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT * FROM user_quests 
      WHERE user_id = ? AND quest_id = ? AND completed_at >= ?
    `, [userId, questId, weekStart.toISOString()], (err, row) => {
      if (err) reject(err);
      resolve(!!row);
    });
  });
}

async function completeQuest(userId, questId, xpReward, honorReward = 0) {
  await new Promise((resolve, reject) => {
    db.run(`INSERT INTO user_quests (user_id, quest_id) VALUES (?, ?)`, [userId, questId], function(err) {
      if (err) reject(err);
      resolve(this.lastID);
    });
  });

  const user = await User.findById(userId);
  const newXp = user.xp + xpReward;
  const newHonor = user.honor_points + honorReward;
  const levelInfo = calculateLevelAndOvercap(newXp);

  await User.update(userId, {
    xp: newXp,
    honor_points: newHonor,
    level: levelInfo.level,
    overcap_xp: levelInfo.overcapXp,
    overcap_tickets: levelInfo.overcapTickets
  });

  return { xpAwarded: xpReward, honorAwarded: honorReward };
}

module.exports = { checkIn, checkQuests, completeQuest };
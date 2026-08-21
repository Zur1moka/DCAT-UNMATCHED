// src/services/matchService.js
const db = require('../config/database');
const User = require('../models/User');
const Hero = require('../models/Hero');
const { calculateLevelAndOvercap } = require('./userService');

// Tính XP trận đấu
function calculateMatchXP({ winnerHero, isAdminChallenge, isHandicap, isWin }) {
  return new Promise((resolve, reject) => {
    if (!isWin) return resolve(10);

    Hero.findByName(winnerHero)
      .then(hero => {
        if (!hero) return resolve(50);
        let baseXP = 50;
        if (hero.tier === 'S' || hero.tier === 'A') baseXP = 35;
        else if (hero.tier === 'B') baseXP = 50;
        else if (hero.tier === 'C' || hero.tier === 'D') baseXP = 70;

        let total = baseXP;
        if (isAdminChallenge) total += 20;
        if (isHandicap) total += 30;
        resolve(total);
      })
      .catch(reject);
  });
}

// Xử lý trận đấu (cập nhật XP, level, honor, thợ săn)
async function processMatch({
  player1Id, player2Id, winnerId,
  player1Hero, player2Hero,
  isAdminChallenge = false,
  isHandicap = false,
  isBountyChallenge = false  // Thợ săn tiền thưởng
}) {
  const isWin = (winnerId === player1Id);
  const winnerHero = isWin ? player1Hero : player2Hero;
  const loserId = isWin ? player2Id : player1Id;
  const loserHero = isWin ? player2Hero : player1Hero;

  // Tính XP
  const xp = await calculateMatchXP({ winnerHero, isAdminChallenge, isHandicap, isWin });

  // Lấy user thắng và thua để cập nhật
  const winner = await User.findById(winnerId);
  const loser = await User.findById(loserId);

  // Cập nhật XP, wins/losses cho winner
  let newXp = winner.xp + xp;
  let newHonor = winner.honor_points;

  // Xử lý ELO: nếu là thợ săn và thắng top 4 => +100 ELO
  if (isBountyChallenge && isWin) {
    newHonor += 100;
    // Top 4 thua bị trừ 100 ELO (giả định loser là top 4)
    if (loser && loser.honor_points >= 100) {
      await User.update(loserId, { honor_points: loser.honor_points - 100 });
    }
  } else if (isWin) {
    // Thắng thường: +10 ELO (giữ nguyên logic cũ)
    newHonor += 10;
  }

  // Tính level và overcap
  const levelInfo = calculateLevelAndOvercap(newXp);

  // Cập nhật winner
  await User.update(winnerId, {
    xp: newXp,
    honor_points: newHonor,
    level: levelInfo.level,
    overcap_xp: levelInfo.overcapXp,
    overcap_tickets: levelInfo.overcapTickets,
    wins: winner.wins + 1
  });

  // Cập nhật loser (thua)
  await User.update(loserId, {
    losses: loser.losses + 1
  });

  // Cập nhật thống kê tướng
  await Hero.incrementStats(winnerHero, true);
  await Hero.incrementStats(loserHero, false);

  // Lưu trận đấu
  const stmt = db.prepare(`
    INSERT INTO matches 
    (player1_id, player2_id, winner_id, player1_hero, player2_hero, xp_awarded, is_admin_challenge, handicap_applied, is_bounty_challenge)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(player1Id, player2Id, winnerId, player1Hero, player2Hero, xp, isAdminChallenge ? 1 : 0, isHandicap ? 1 : 0, isBountyChallenge ? 1 : 0);
  stmt.finalize();

  return {
    xpAwarded: xp,
    honorChange: isWin ? (isBountyChallenge ? 100 : 10) : 0,
    newLevel: levelInfo.level,
    overcapTickets: levelInfo.overcapTickets
  };
}

module.exports = { calculateMatchXP, processMatch };
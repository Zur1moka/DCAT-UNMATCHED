// backend/src/services/matchService.js
const pool = require('../config/database');
const User = require('../models/User');
const Hero = require('../models/Hero');
const { calculateLevelAndOvercap } = require('./userService');
const { checkQuests } = require('./questService');
const { getUserHonorRank, getUserExpRank } = require('./rankingHelper');
const { canAdminChallenge, incrementAdminChallenge } = require('./adminBonusService');

// ===== TÍNH XP =====
async function calculateMatchXP({ winnerHero, isAdminChallenge, isHandicap, isWin }) {
  if (!isWin) return 10;
  const hero = await Hero.findByName(winnerHero);
  if (!hero) return 50;
  let baseXP = 50;
  if (hero.tier === 'S' || hero.tier === 'A') baseXP = 35;
  else if (hero.tier === 'B') baseXP = 50;
  else if (hero.tier === 'C' || hero.tier === 'D') baseXP = 70;
  let total = baseXP;
  if (isAdminChallenge) total += 20;
  if (isHandicap) total += 30;
  return total;
}

// ===== XỬ LÝ TRẬN ĐẤU =====
async function processMatch({
  player1Id,
  player2Id,
  winnerId,
  player1Hero,
  player2Hero,
  isAdminChallenge = false,
  isHandicap = false,
  isBountyChallenge = false,
}) {
  try {
    if (!player1Id || !player2Id || !winnerId || !player1Hero || !player2Hero) {
      throw new Error('Thiếu thông tin trận đấu');
    }

    const isWin = parseInt(winnerId) === parseInt(player1Id);
    const winnerHero = isWin ? player1Hero : player2Hero;
    const loserId = isWin ? player2Id : player1Id;
    const loserHero = isWin ? player2Hero : player1Hero;

    const winnerHeroObj = await Hero.findByName(winnerHero);
    const loserHeroObj = await Hero.findByName(loserHero);
    if (!winnerHeroObj || !loserHeroObj) {
      throw new Error('Tướng không tồn tại trong hệ thống');
    }

    const winner = await User.findById(winnerId);
    const loser = await User.findById(loserId);
    if (!winner || !loser) {
      throw new Error('Không tìm thấy người chơi');
    }

    const winnerRank = await getUserHonorRank(winnerId);
    const loserRank = await getUserHonorRank(loserId);
    const winnerExpRank = await getUserExpRank(winnerId);
    const loserExpRank = await getUserExpRank(loserId);

    let xp = await calculateMatchXP({
      winnerHero,
      isAdminChallenge,
      isHandicap,
      isWin,
    });

    let bonusXp = 0;
    let honorPenalty = 0;
    let isAdminChallengeEffective = isAdminChallenge;

    // Top 5 special
    if (isWin && winnerExpRank > 5 && loserExpRank <= 5) {
      bonusXp += 100;
      const newLoserXp = Math.max(0, loser.xp - 100);
      await User.update(loserId, { xp: newLoserXp });
      loser.xp = newLoserXp;
    }

    // Top 4 ELO penalty
    if (!isWin && winnerRank >= 5 && loserRank <= 4) {
      honorPenalty = -100;
      const newLoserHonor = Math.max(0, loser.honor_points - 100);
      await User.update(loserId, { honor_points: newLoserHonor });
      loser.honor_points = newLoserHonor;
    }

    // Admin bonus limit
    if (isAdminChallenge) {
      const canChallenge = await canAdminChallenge(winnerId);
      if (canChallenge) {
        await incrementAdminChallenge(winnerId);
      } else {
        xp -= 20;
        isAdminChallengeEffective = false;
      }
    }

    // Handicap bonus
    let handicapBonus = 0;
    if (isWin && winnerRank <= 4 && loser.level < 5) {
      const winnerHeroData = await Hero.findByName(winnerHero);
      if (winnerHeroData && ['C', 'D'].includes(winnerHeroData.tier)) {
        handicapBonus = 30;
        xp += handicapBonus;
      }
    }

    let bountyBonus = 0;
    if (isBountyChallenge && isWin) {
      bountyBonus = 100;
    }

    let newXp = winner.xp + xp + bonusXp + bountyBonus;
    let newHonor = winner.honor_points;

    if (isWin && isBountyChallenge) {
      newHonor += 100;
    } else if (isWin) {
      newHonor += 10;
    }

    const levelInfo = calculateLevelAndOvercap(newXp);

    await User.update(winnerId, {
      xp: newXp,
      honor_points: newHonor,
      level: levelInfo.level,
      overcap_xp: levelInfo.overcapXp,
      overcap_tickets: levelInfo.overcapTickets,
      wins: winner.wins + 1,
    });

    // Update loser only if not already deducted in Top 5
    if (!isWin || winnerExpRank > 5 || loserExpRank > 5) {
      await User.update(loserId, {
        losses: loser.losses + 1,
      });
    }

    await Hero.incrementStats(winnerHero, true);
    await Hero.incrementStats(loserHero, false);

    // Save match
    await pool.query(
      `INSERT INTO matches 
       (player1_id, player2_id, winner_id, player1_hero, player2_hero, 
        xp_awarded, is_admin_challenge, handicap_applied, is_bounty_challenge)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        player1Id,
        player2Id,
        winnerId,
        player1Hero,
        player2Hero,
        xp + bonusXp + bountyBonus,
        isAdminChallengeEffective ? 1 : 0,
        isHandicap ? 1 : 0,
        isBountyChallenge ? 1 : 0,
      ]
    );

    // Check quests
    let questResults = [];
    try {
      const winnerHeroData = await Hero.findByName(winnerHero);
      questResults = await checkQuests(winnerId, {
        isWin: true,
        winnerHeroTier: winnerHeroData?.tier,
      });
    } catch (questErr) {
      console.error('Lỗi kiểm tra nhiệm vụ:', questErr.message);
    }

    return {
      xpAwarded: xp + bonusXp + bountyBonus,
      honorChange: isWin ? (isBountyChallenge ? 100 : 10) : 0,
      newLevel: levelInfo.level,
      overcapTickets: levelInfo.overcapTickets,
      questsCompleted: questResults,
      bonusXp,
      handicapBonus,
      bountyBonus,
      honorPenalty,
      adminChallengeUsed: isAdminChallengeEffective,
    };
  } catch (error) {
    console.error('Lỗi xử lý trận đấu:', error);
    throw error;
  }
}

module.exports = { calculateMatchXP, processMatch };
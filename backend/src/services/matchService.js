// backend/src/services/matchService.js
const db = require('../config/database');
const User = require('../models/User');
const Hero = require('../models/Hero');
const { calculateLevelAndOvercap } = require('./userService');
const { checkQuests } = require('./questService');
const { getUserHonorRank, getUserExpRank } = require('./rankingHelper');
const { canAdminChallenge, incrementAdminChallenge } = require('./adminBonusService');

// ===== TÍNH XP =====
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
    // Validate đầu vào
    if (!player1Id || !player2Id || !winnerId || !player1Hero || !player2Hero) {
      throw new Error('Thiếu thông tin trận đấu');
    }

    const isWin = parseInt(winnerId) === parseInt(player1Id);
    const winnerHero = isWin ? player1Hero : player2Hero;
    const loserId = isWin ? player2Id : player1Id;
    const loserHero = isWin ? player2Hero : player1Hero;

    // Kiểm tra tướng tồn tại
    const winnerHeroObj = await Hero.findByName(winnerHero);
    const loserHeroObj = await Hero.findByName(loserHero);
    if (!winnerHeroObj || !loserHeroObj) {
      throw new Error('Tướng không tồn tại trong hệ thống');
    }

    // Lấy thông tin user
    const winner = await User.findById(winnerId);
    const loser = await User.findById(loserId);
    if (!winner || !loser) {
      throw new Error('Không tìm thấy người chơi');
    }

    // ===== LẤY THỨ HẠNG =====
    const winnerRank = await getUserHonorRank(winnerId);
    const loserRank = await getUserHonorRank(loserId);
    const winnerExpRank = await getUserExpRank(winnerId);
    const loserExpRank = await getUserExpRank(loserId);

    // ===== TÍNH XP CƠ BẢN =====
    let xp = await calculateMatchXP({
      winnerHero,
      isAdminChallenge,
      isHandicap,
      isWin,
    });

    let bonusXp = 0;
    let honorPenalty = 0;
    let isAdminChallengeEffective = isAdminChallenge;

    // ===== 1. Yêu cầu đặc biệt: Người dưới top 5 thắng top 5 (dựa trên EXP) =====
    if (isWin && winnerExpRank > 5 && loserExpRank <= 5) {
      bonusXp += 100; // +100 EXP cho người thắng
      // Người thua (top 5) bị trừ 100 EXP (không xuống dưới 0)
      const newLoserXp = Math.max(0, loser.xp - 100);
      await User.update(loserId, { xp: newLoserXp });
      loser.xp = newLoserXp;
    }

    // ===== 2. Yêu cầu đặc biệt: Top 4 thua thách đấu từ hạng 5 trở xuống (dựa trên ELO) =====
    if (!isWin && winnerRank >= 5 && loserRank <= 4) {
      // loser là top 4, bị trừ 100 ELO
      honorPenalty = -100;
      const newLoserHonor = Math.max(0, loser.honor_points - 100);
      await User.update(loserId, { honor_points: newLoserHonor });
      loser.honor_points = newLoserHonor;
    }

    // ===== 3. Xử lý Admin Bonus (giới hạn 5 lần/ngày) =====
    if (isAdminChallenge) {
      const canChallenge = await canAdminChallenge(winnerId);
      if (canChallenge) {
        // Cộng 20XP đã có trong calculateMatchXP
        await incrementAdminChallenge(winnerId);
      } else {
        // Không cộng admin_bonus, trừ xp đã cộng thêm (20)
        xp -= 20;
        isAdminChallengeEffective = false;
      }
    }

    // ===== 4. Xử lý Handicap Bonus =====
    let handicapBonus = 0;
    if (isWin && winnerRank <= 4 && loser.level < 5) {
      // winner là top 4, đối thủ dưới cấp 5
      const winnerHeroData = await Hero.findByName(winnerHero);
      if (winnerHeroData && ['C', 'D'].includes(winnerHeroData.tier)) {
        handicapBonus = 30;
        xp += handicapBonus;
      }
    }

    // ===== 5. Xử lý Thợ Săn Tiền Thưởng =====
    let bountyBonus = 0;
    if (isBountyChallenge && isWin) {
      bountyBonus = 100;
      // Nếu loser là top 4, trừ 100 ELO (đã có ở phần 2)
    }

    // ===== 6. Cập nhật điểm =====
    let newXp = winner.xp + xp + bonusXp + bountyBonus;
    let newHonor = winner.honor_points;

    if (isWin && isBountyChallenge) {
      newHonor += 100;
    } else if (isWin) {
      newHonor += 10;
    }

    const levelInfo = calculateLevelAndOvercap(newXp);

    // Cập nhật winner
    await User.update(winnerId, {
      xp: newXp,
      honor_points: newHonor,
      level: levelInfo.level,
      overcap_xp: levelInfo.overcapXp,
      overcap_tickets: levelInfo.overcapTickets,
      wins: winner.wins + 1,
    });

    // Cập nhật loser (nếu chưa bị trừ ở phần trên)
    if (!isWin || winnerExpRank > 5 || loserExpRank > 5) {
      // Nếu chưa bị trừ ở top 5, cập nhật bình thường
      await User.update(loserId, {
        losses: loser.losses + 1,
      });
    }

    // Cập nhật thống kê tướng
    await Hero.incrementStats(winnerHero, true);
    await Hero.incrementStats(loserHero, false);

    // Lưu trận đấu
    const stmt = db.prepare(`
      INSERT INTO matches 
      (player1_id, player2_id, winner_id, player1_hero, player2_hero, 
       xp_awarded, is_admin_challenge, handicap_applied, is_bounty_challenge)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    await new Promise((resolve, reject) => {
      stmt.run(
        player1Id,
        player2Id,
        winnerId,
        player1Hero,
        player2Hero,
        xp + bonusXp + bountyBonus,
        isAdminChallengeEffective ? 1 : 0,
        isHandicap ? 1 : 0,
        isBountyChallenge ? 1 : 0,
        function (err) {
          if (err) reject(err);
          resolve(this);
        }
      );
      stmt.finalize();
    });

    // ===== KIỂM TRA NHIỆM VỤ =====
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
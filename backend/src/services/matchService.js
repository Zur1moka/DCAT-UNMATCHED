// backend/src/services/matchService.js
const db = require('../config/database');
const User = require('../models/User');
const Hero = require('../models/Hero');
const { calculateLevelAndOvercap } = require('./userService');
const { checkQuests } = require('./questService');

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
  player1Id, player2Id, winnerId,
  player1Hero, player2Hero,
  isAdminChallenge = false,
  isHandicap = false,
  isBountyChallenge = false
}) {
  try {
    // Validate đầu vào
    if (!player1Id || !player2Id || !winnerId || !player1Hero || !player2Hero) {
      throw new Error('Thiếu thông tin trận đấu');
    }

    const isWin = (parseInt(winnerId) === parseInt(player1Id));
    const winnerHero = isWin ? player1Hero : player2Hero;
    const loserId = isWin ? player2Id : player1Id;
    const loserHero = isWin ? player2Hero : player1Hero;

    // Kiểm tra tướng tồn tại
    const winnerHeroObj = await Hero.findByName(winnerHero);
    const loserHeroObj = await Hero.findByName(loserHero);
    if (!winnerHeroObj || !loserHeroObj) {
      throw new Error('Tướng không tồn tại trong hệ thống');
    }

    // Tính XP
    const xp = await calculateMatchXP({ winnerHero, isAdminChallenge, isHandicap, isWin });

    // Lấy thông tin user
    const winner = await User.findById(winnerId);
    const loser = await User.findById(loserId);
    if (!winner || !loser) {
      throw new Error('Không tìm thấy người chơi');
    }

    // Cập nhật XP & Honor
    let newXp = winner.xp + xp;
    let newHonor = winner.honor_points;

    if (isBountyChallenge && isWin) {
      newHonor += 100;
      // Trừ ELO của loser nếu là top 4 (giả định)
      if (loser.honor_points >= 100) {
        await User.update(loserId, { honor_points: loser.honor_points - 100 });
      }
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
      wins: winner.wins + 1
    });

    // Cập nhật loser
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
    const result = await new Promise((resolve, reject) => {
      stmt.run(
        player1Id, player2Id, winnerId, player1Hero, player2Hero, xp,
        isAdminChallenge ? 1 : 0,
        isHandicap ? 1 : 0,
        isBountyChallenge ? 1 : 0,
        function(err) {
          if (err) reject(err);
          resolve(this);
        }
      );
      stmt.finalize();
    });

    // Kiểm tra nhiệm vụ (không để crash)
    let questResults = [];
    try {
      const winnerHeroData = await Hero.findByName(winnerHero);
      questResults = await checkQuests(winnerId, {
        isWin: true,
        winnerHeroTier: winnerHeroData?.tier
      });
    } catch (questErr) {
      console.error('Lỗi kiểm tra nhiệm vụ:', questErr.message);
    }

    return {
      xpAwarded: xp,
      honorChange: isWin ? (isBountyChallenge ? 100 : 10) : 0,
      newLevel: levelInfo.level,
      overcapTickets: levelInfo.overcapTickets,
      questsCompleted: questResults
    };
  } catch (error) {
    console.error('Lỗi xử lý trận đấu:', error);
    throw error;
  }
}

module.exports = { calculateMatchXP, processMatch };
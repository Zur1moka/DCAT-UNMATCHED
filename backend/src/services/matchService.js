// src/services/matchService.js
const db = require('../config/database');

// Công thức tính match_xp
function calculateMatchXP({ winnerId, winnerHero, isAdminChallenge, isHandicap, isWin }) {
  return new Promise((resolve, reject) => {
    if (!isWin) {
      return resolve(10); // thua cố định +10XP
    }

    // Lấy tier và bonus của tướng thắng
    db.get(`SELECT tier, bonus_multiplier FROM heroes WHERE name = ?`, [winnerHero], (err, hero) => {
      if (err) return reject(err);
      if (!hero) return resolve(50); // fallback

      let baseXP = 50; // hệ số chuẩn
      const bonus = hero.bonus_multiplier / 100;
      if (hero.tier === 'S' || hero.tier === 'A') baseXP = 35;
      else if (hero.tier === 'B') baseXP = 50;
      else if (hero.tier === 'C' || hero.tier === 'D') baseXP = 70;

      let totalXP = baseXP;

      // Admin bonus
      if (isAdminChallenge) totalXP += 20;

      // Handicap bonus (Top 4 dùng C/D)
      if (isHandicap) totalXP += 30;

      resolve(totalXP);
    });
  });
}

// Hàm cập nhật điểm sau trận
async function processMatch({ player1Id, player2Id, winnerId, player1Hero, player2Hero, isAdminChallenge, isHandicap }) {
  const isWin = (winnerId === player1Id);
  const winnerHero = isWin ? player1Hero : player2Hero;

  const xp = await calculateMatchXP({ winnerId, winnerHero, isAdminChallenge, isHandicap, isWin });

  // Lưu match vào DB
  const stmt = db.prepare(`
    INSERT INTO matches (player1_id, player2_id, winner_id, player1_hero, player2_hero, xp_awarded, is_admin_challenge, handicap_applied)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(player1Id, player2Id, winnerId, player1Hero, player2Hero, xp, isAdminChallenge ? 1 : 0, isHandicap ? 1 : 0);
  stmt.finalize();

  // Cập nhật XP, level, honor points cho người thắng (đơn giản hóa)
  // Ở đây bạn sẽ thêm logic tính level, overcap, honor...
  // Tạm thời chỉ cộng XP và honor (giả định +10 honor cho mỗi trận thắng)
  if (isWin) {
    db.run(`UPDATE users SET xp = xp + ?, wins = wins + 1 WHERE id = ?`, [xp, winnerId]);
    db.run(`UPDATE users SET honor_points = honor_points + 10 WHERE id = ?`, [winnerId]);
    // Cập nhật thống kê tướng
    db.run(`UPDATE heroes SET usage_count = usage_count + 1, wins = wins + 1 WHERE name = ?`, [winnerHero]);
  } else {
    const loserId = winnerId === player1Id ? player2Id : player1Id;
    db.run(`UPDATE users SET losses = losses + 1 WHERE id = ?`, [loserId]);
    const loserHero = isWin ? player2Hero : player1Hero;
    db.run(`UPDATE heroes SET usage_count = usage_count + 1, losses = losses + 1 WHERE name = ?`, [loserHero]);
  }

  return { xp, honorChange: isWin ? 10 : 0 };
}

module.exports = { calculateMatchXP, processMatch };
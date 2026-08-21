const db = require('../config/database');
const User = require('../models/User');
const Hero = require('../models/Hero');
const { calculateLevelAndOvercap } = require('./userService');
const { checkQuests } = require('./questService');

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

async function processMatch({
  player1Id, player2Id, winnerId,
  player1Hero, player2Hero,
  isAdminChallenge = false,
  isHandicap = false,
  isBountyChallenge = false
}) {
  const isWin = (winnerId === player1Id);
  const winnerHero = isWin ? player1Hero : player2Hero;
  const loserId = isWin ? player2Id : player1Id;
  const loserHero = isWin ? player2Hero : player1Hero;

  const xp = await calculateMatchXP({ winnerHero, isAdminChallenge, isHandicap, isWin });

  const winner = await User.findById(winnerId);
  const loser = await User.findById(loserId);

  let newXp = winner.xp + xp;
  let newHonor = winner.honor_points;

  if (isBountyChallenge && isWin) {
    newHonor += 100;
    if (loser && loser.honor_points >= 100) {
      await User.update(loserId, { honor_points: loser.honor_points - 100 });
    }
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
    wins: winner.wins + 1
  });

  await User.update(loserId, {
    losses: loser.losses + 1
  });

  await Hero.incrementStats(winnerHero, true);
  await Hero.incrementStats(loserHero, false);

  const stmt = db.prepare(`
    INSERT INTO matches 
    (player1_id, player2_id, winner_id, player1_hero, player2_hero, xp_awarded, is_admin_challenge, handicap_applied, is_bounty_challenge)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(player1Id, player2Id, winnerId, player1Hero, player2Hero, xp, isAdminChallenge ? 1 : 0, isHandicap ? 1 : 0, isBountyChallenge ? 1 : 0);
  stmt.finalize();

  // Kiểm tra nhiệm vụ
  const winnerHeroData = await Hero.findByName(winnerHero);
  const questResults = await checkQuests(winnerId, {
    isWin: true,
    winnerHeroTier: winnerHeroData?.tier
  });

  return {
    xpAwarded: xp,
    honorChange: isWin ? (isBountyChallenge ? 100 : 10) : 0,
    newLevel: levelInfo.level,
    overcapTickets: levelInfo.overcapTickets,
    questsCompleted: questResults
  };
}

module.exports = { calculateMatchXP, processMatch };
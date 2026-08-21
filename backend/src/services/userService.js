// src/services/userService.js
const XP_TABLE = {
  1: 0,
  2: 300,
  3: 800,
  4: 1500,
  5: 2500,
  6: 3600,
  7: 4800,
  8: 6000,
  9: 7200,
  10: 8500
};

function calculateLevelAndOvercap(xp) {
  if (xp < 8500) {
    let level = 1;
    for (let i = 10; i >= 1; i--) {
      if (xp >= XP_TABLE[i]) {
        level = i;
        break;
      }
    }
    return { level, overcapXp: 0, overcapTickets: 0 };
  } else {
    const overcapXp = xp - 8500;
    const tickets = Math.floor(overcapXp / 800);
    return { level: 10, overcapXp, overcapTickets: tickets };
  }
}

function getXpForNextLevel(level) {
  if (level >= 10) return Infinity;
  return XP_TABLE[level + 1] || 8500;
}

module.exports = { calculateLevelAndOvercap, getXpForNextLevel };
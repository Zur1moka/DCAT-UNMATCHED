export const mockUser = {
  id: 1,
  nickname: "KhoaUnmatched",
  level: 7,
  xp: 4200,
  maxXpForLevel: 4800, // Cấp 7 cần 4800 XP
  overcapXp: 0,
  overcapTickets: 0,
  win: 45,
  loss: 20,
  honorPoints: 1250,
};

export const mockHistory = [
  { id: 1, time: "20/08/2026 14:30", hero: "Medusa", opponent: "King Arthur", result: "Win", xp: 50 },
  { id: 2, time: "20/08/2026 13:00", hero: "Bigfoot", opponent: "Robin Hood", result: "Lose", xp: 10 },
  { id: 3, time: "19/08/2026 21:15", hero: "Bloody Mary", opponent: "Admin", result: "Win", xp: 70 },
  { id: 4, time: "19/08/2026 20:00", hero: "Medusa", opponent: "Sherlock", result: "Win", xp: 35 },
];

export const mockHeroes = [
  { name: "Medusa", tier: "S", usage: 120, wins: 80, losses: 40, bonus: 70 },
  { name: "Bigfoot", tier: "A", usage: 95, wins: 60, losses: 35, bonus: 70 },
  { name: "King Arthur", tier: "B", usage: 150, wins: 75, losses: 75, bonus: 100 },
  { name: "Robin Hood", tier: "C", usage: 80, wins: 30, losses: 50, bonus: 140 },
  { name: "Bloody Mary", tier: "D", usage: 40, wins: 10, losses: 30, bonus: 140 },
];

export const mockRankings = [
  { rank: 1, name: "ProPlayer", xp: 12000, wins: 100, level: 10, tickets: 4 },
  { rank: 2, name: "UnmatchedKing", xp: 9500, wins: 85, level: 10, tickets: 1 },
  { rank: 3, name: "KhoaUnmatched", xp: 4200, wins: 45, level: 7, tickets: 0 },
  { rank: 4, name: "Newbie", xp: 1500, wins: 10, level: 4, tickets: 0 },
];

export const mockHonorRankings = [
  { rank: 1, name: "ProPlayer", honor: 2500, wins: 100, losses: 20, winrate: 83 },
  { rank: 2, name: "UnmatchedKing", honor: 2100, wins: 85, losses: 30, winrate: 74 },
  { rank: 3, name: "KhoaUnmatched", honor: 1250, wins: 45, losses: 20, winrate: 69 },
  { rank: 4, name: "Challenger", honor: 800, wins: 20, losses: 25, winrate: 44 },
];
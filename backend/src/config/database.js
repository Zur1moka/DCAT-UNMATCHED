const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(
  path.join(__dirname, '../../database.sqlite'),
  (err) => {
    if (err) console.error('❌ Database connection error:', err.message);
    else console.log('✅ Connected to SQLite database');
  }
);

db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      honor_points INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      overcap_xp INTEGER DEFAULT 0,
      overcap_tickets INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      role TEXT DEFAULT 'user'
    )
  `);

  // Matches table
  db.run(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player1_id INTEGER,
      player2_id INTEGER,
      winner_id INTEGER,
      player1_hero TEXT,
      player2_hero TEXT,
      xp_awarded INTEGER,
      honor_change INTEGER,
      is_admin_challenge BOOLEAN DEFAULT 0,
      handicap_applied BOOLEAN DEFAULT 0,
      is_bounty_challenge BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player1_id) REFERENCES users(id),
      FOREIGN KEY (player2_id) REFERENCES users(id),
      FOREIGN KEY (winner_id) REFERENCES users(id)
    )
  `);

  // Heroes table
  db.run(`
    CREATE TABLE IF NOT EXISTS heroes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      tier TEXT CHECK(tier IN ('S','A','B','C','D')) NOT NULL,
      bonus_multiplier INTEGER DEFAULT 100,
      usage_count INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0
    )
  `);

  // ===== NEW TABLES FOR CHECKIN & QUESTS =====
  db.run(`
    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      checkin_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, checkin_date)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS quests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      trigger_type TEXT NOT NULL,
      reward_xp INTEGER DEFAULT 0,
      reward_honor INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_quests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      quest_id INTEGER NOT NULL,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (quest_id) REFERENCES quests(id),
      UNIQUE(user_id, quest_id)
    )
  `);

  // Seed heroes
  db.get(`SELECT COUNT(*) as count FROM heroes`, (err, row) => {
    if (row.count === 0) {
      const heroes = [
        ['Medusa', 'S', 70],
        ['Bigfoot', 'A', 70],
        ['King Arthur', 'B', 100],
        ['Robin Hood', 'C', 140],
        ['Bloody Mary', 'D', 140]
      ];
      const stmt = db.prepare(`INSERT INTO heroes (name, tier, bonus_multiplier) VALUES (?, ?, ?)`);
      heroes.forEach(h => stmt.run(h));
      stmt.finalize();
      console.log('✅ Seeded default heroes');
    }
  });

  // Seed quests
  db.get(`SELECT COUNT(*) as count FROM quests`, (err, row) => {
    if (row.count === 0) {
      const quests = [
        ['Điểm danh hàng ngày', 'Check-in khi gọi nước', 'daily', 50, 0],
        ['Đêm Thứ 5 Nhộn Nhịp', 'Tham gia trận đấu vào thứ 5', 'weekly', 50, 0],
        ['Thử thách Thảm Đỏ', 'Thắng trận đầu tuần bằng tướng C/D', 'weekly', 50, 0],
        ['Thợ Săn Tiền Thưởng', 'Thách đấu Top 4 và giành chiến thắng', 'special', 100, 100]
      ];
      const stmt = db.prepare(`INSERT INTO quests (name, description, trigger_type, reward_xp, reward_honor) VALUES (?, ?, ?, ?, ?)`);
      quests.forEach(q => stmt.run(q));
      stmt.finalize();
      console.log('✅ Seeded default quests');
    }
  });
});

module.exports = db;
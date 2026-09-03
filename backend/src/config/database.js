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
  // ===== USERS TABLE =====
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT,
      is_verified BOOLEAN DEFAULT 0,
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

  // ===== HEROES TABLE =====
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

  // ===== MATCHES TABLE =====
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

  // ===== CHECKINS TABLE =====
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

  // ===== QUESTS TABLE =====
  db.run(`
    CREATE TABLE IF NOT EXISTS quests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      trigger_type TEXT NOT NULL,
      reward_xp INTEGER DEFAULT 0,
      reward_honor INTEGER DEFAULT 0,
      requires_approval BOOLEAN DEFAULT 0,
      is_active BOOLEAN DEFAULT 1
    )
  `);

  // ===== USER_QUESTS TABLE =====
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

  // ===== QUEST_APPROVALS TABLE =====
  db.run(`
    CREATE TABLE IF NOT EXISTS quest_approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_quest_id INTEGER NOT NULL,
      admin_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      FOREIGN KEY (user_quest_id) REFERENCES user_quests(id),
      FOREIGN KEY (admin_id) REFERENCES users(id)
    )
  `);

  // ===== REWARDS TABLE =====
  db.run(`
    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      condition_type TEXT NOT NULL,
      condition_value TEXT,
      reward_type TEXT NOT NULL,
      reward_value TEXT NOT NULL,
      image TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ===== ADMIN_CHALLENGES TABLE =====
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      challenge_date TEXT NOT NULL,
      count INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, challenge_date)
    )
  `);

  // ===== EMAIL_VERIFICATIONS TABLE =====
  db.run(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      otp TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      verified BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // ===== PASSWORD_RESETS TABLE =====
  db.run(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // ===== SEED HEROES =====
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

  // ===== SEED QUESTS =====
  db.get(`SELECT COUNT(*) as count FROM quests`, (err, row) => {
    if (row.count === 0) {
      const quests = [
        ['Điểm danh hàng ngày', 'Check-in khi gọi nước', 'daily', 50, 0, 0],
        ['Đêm Thứ 5 Nhộn Nhịp', 'Tham gia trận đấu vào thứ 5', 'weekly', 50, 0, 0],
        ['Thử thách Thảm Đỏ', 'Thắng trận đầu tuần bằng tướng C/D', 'weekly', 50, 0, 0],
        ['Thợ Săn Tiền Thưởng', 'Thách đấu Top 4 và giành chiến thắng', 'special', 100, 100, 1]
      ];
      const stmt = db.prepare(`INSERT INTO quests (name, description, trigger_type, reward_xp, reward_honor, requires_approval) VALUES (?, ?, ?, ?, ?, ?)`);
      quests.forEach(q => stmt.run(q));
      stmt.finalize();
      console.log('✅ Seeded default quests');
    }
  });
});

module.exports = db;
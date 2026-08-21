// src/config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(
  path.join(__dirname, '../../database.sqlite'),
  (err) => {
    if (err) console.error('❌ Database connection error:', err.message);
    else console.log('✅ Connected to SQLite database');
  }
);

// Tạo bảng cơ bản nếu chưa có
db.serialize(() => {
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player1_id) REFERENCES users(id),
      FOREIGN KEY (player2_id) REFERENCES users(id),
      FOREIGN KEY (winner_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS heroes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      tier TEXT CHECK(tier IN ('S','A','B','C','D')) NOT NULL,
      bonus_multiplier INTEGER DEFAULT 100, -- 70, 100, 140
      usage_count INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0
    )
  `);

  // Seed heroes mẫu nếu bảng rỗng
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
});

module.exports = db;
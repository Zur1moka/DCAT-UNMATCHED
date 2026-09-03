-- backend/src/migrations/init.sql

-- Bảng users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  xp INTEGER DEFAULT 0,
  honor_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  overcap_xp INTEGER DEFAULT 0,
  overcap_tickets INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  role TEXT DEFAULT 'user'
);

-- Bảng heroes
CREATE TABLE IF NOT EXISTS heroes (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  tier TEXT CHECK(tier IN ('S','A','B','C','D')) NOT NULL,
  bonus_multiplier INTEGER DEFAULT 100,
  usage_count INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0
);

-- Bảng matches
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  player1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  player2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  winner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  player1_hero TEXT,
  player2_hero TEXT,
  xp_awarded INTEGER,
  honor_change INTEGER,
  is_admin_challenge BOOLEAN DEFAULT FALSE,
  handicap_applied BOOLEAN DEFAULT FALSE,
  is_bounty_challenge BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng checkins
CREATE TABLE IF NOT EXISTS checkins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checkin_date TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, checkin_date)
);

-- Bảng quests
CREATE TABLE IF NOT EXISTS quests (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  reward_xp INTEGER DEFAULT 0,
  reward_honor INTEGER DEFAULT 0,
  requires_approval BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Bảng user_quests
CREATE TABLE IF NOT EXISTS user_quests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, quest_id)
);

-- Bảng quest_approvals
CREATE TABLE IF NOT EXISTS quest_approvals (
  id SERIAL PRIMARY KEY,
  user_quest_id INTEGER NOT NULL REFERENCES user_quests(id) ON DELETE CASCADE,
  admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

-- Bảng rewards
CREATE TABLE IF NOT EXISTS rewards (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  condition_type TEXT NOT NULL,
  condition_value TEXT,
  reward_type TEXT NOT NULL,
  reward_value TEXT NOT NULL,
  image TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng admin_challenges
CREATE TABLE IF NOT EXISTS admin_challenges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_date TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  UNIQUE(user_id, challenge_date)
);

-- Bảng email_verifications
CREATE TABLE IF NOT EXISTS email_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng password_resets
CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed heroes
INSERT INTO heroes (name, tier, bonus_multiplier) VALUES
('Medusa', 'S', 70),
('Bigfoot', 'A', 70),
('King Arthur', 'B', 100),
('Robin Hood', 'C', 140),
('Bloody Mary', 'D', 140)
ON CONFLICT (name) DO NOTHING;

-- Seed quests
INSERT INTO quests (name, description, trigger_type, reward_xp, reward_honor, requires_approval) VALUES
('Điểm danh hàng ngày', 'Check-in khi gọi nước', 'daily', 50, 0, FALSE),
('Đêm Thứ 5 Nhộn Nhịp', 'Tham gia trận đấu vào thứ 5', 'weekly', 50, 0, FALSE),
('Thử thách Thảm Đỏ', 'Thắng trận đầu tuần bằng tướng C/D', 'weekly', 50, 0, FALSE),
('Thợ Săn Tiền Thưởng', 'Thách đấu Top 4 và giành chiến thắng', 'special', 100, 100, TRUE)
ON CONFLICT (id) DO NOTHING;
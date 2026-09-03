// backend/src/config/database.js
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;

if (process.env.DATABASE_URL) {
  // === Môi trường Production (Railway) - Dùng PostgreSQL ===
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  // Hàm giả lập giao diện của sqlite3 để các model cũ không bị lỗi
  db = {
    get: (sql, params, callback) => {
      pool.query(sql, params).then(result => {
        callback(null, result.rows[0]);
      }).catch(err => callback(err, null));
    },
    all: (sql, params, callback) => {
      pool.query(sql, params).then(result => {
        callback(null, result.rows);
      }).catch(err => callback(err, null));
    },
    run: (sql, params, callback) => {
      pool.query(sql, params).then(result => {
        callback(null, { lastID: result.rows[0]?.id || null, changes: result.rowCount });
      }).catch(err => callback(err, null));
    },
    // Thêm prepare nếu cần (có thể bỏ qua nếu không dùng)
    prepare: (sql) => {
      return {
        run: (params, callback) => {
          pool.query(sql, params).then(result => {
            callback(null, { lastID: result.rows[0]?.id || null });
          }).catch(err => callback(err, null));
        },
        finalize: () => {}
      };
    }
  };

  console.log('✅ Connected to PostgreSQL (Production)');
} else {
  // === Môi trường Development (Local) - Dùng SQLite ===
  const dbPath = path.join(__dirname, '../../database.sqlite');
  const sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('❌ SQLite connection error:', err.message);
    else console.log('✅ Connected to SQLite (Development)');
  });

  db = sqliteDb;
}

module.exports = db;
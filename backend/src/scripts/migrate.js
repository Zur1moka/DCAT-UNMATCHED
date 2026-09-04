require('dotenv').config();
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    // Đường dẫn chính xác đến file init.sql
    const sqlFilePath = path.join(__dirname, '../migrations/init.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Chạy từng câu lệnh (tách biệt với ;)
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    for (const stmt of statements) {
      await pool.query(stmt);
    }
    console.log('✅ Migration completed successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

runMigration();
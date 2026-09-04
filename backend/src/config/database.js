// backend/src/config/database.js
const { Pool } = require('pg');
require('dotenv').config();

let poolConfig;

if (process.env.DATABASE_URL) {
  // Trên production (Render) - dùng DATABASE_URL
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  };
  console.log('🔗 Connecting with DATABASE_URL');
} else {
  // Trên local - dùng các biến riêng lẻ
  poolConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'unmatched_db',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
  };
  console.log('🔗 Connecting with local config');
}

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err);
});

module.exports = pool;
// backend/src/models/User.js
const pool = require('../config/database');

class User {
  static async create({ username, passwordHash, email, role = 'user', is_verified = 0 }) {
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, email, role, is_verified, xp, honor_points, level, wins, losses)
       VALUES ($1, $2, $3, $4, $5, 0, 0, 1, 0, 0)
       RETURNING id, username, email, role, is_verified`,
      [username, passwordHash, email, role, is_verified]
    );
    return result.rows[0];
  }

  static async findByUsername(username) {
    const result = await pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
    return result.rows[0];
  }

  static async update(userId, updates) {
    const keys = Object.keys(updates);
    if (keys.length === 0) return null;
    
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = [...Object.values(updates), userId];
    
    const result = await pool.query(
      `UPDATE users SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async getAll() {
    const result = await pool.query(
      `SELECT id, username, email, xp, honor_points, level, wins, losses, role, is_verified FROM users`
    );
    return result.rows;
  }
}

module.exports = User;
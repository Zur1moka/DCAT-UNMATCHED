// backend/src/models/User.js
const db = require('../config/database');

class User {
  static async create({ username, passwordHash, email, role = 'user', is_verified = 0 }) {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(
        `INSERT INTO users (username, password_hash, email, role, is_verified, xp, honor_points, level, wins, losses) 
         VALUES (?, ?, ?, ?, ?, 0, 0, 1, 0, 0)`
      );
      stmt.run(username, passwordHash, email, role, is_verified, function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, username, email, role, is_verified });
      });
      stmt.finalize();
    });
  }

  static async findByUsername(username) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  static async update(userId, updates) {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(userId);
    return new Promise((resolve, reject) => {
      db.run(`UPDATE users SET ${fields} WHERE id = ?`, values, function(err) {
        if (err) return reject(err);
        resolve(this.changes);
      });
    });
  }

  static async getAll() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT id, username, email, xp, honor_points, level, wins, losses, role, is_verified FROM users`, (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  }
}

module.exports = User;
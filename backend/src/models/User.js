// src/models/User.js
const db = require('../config/database');

class User {
  static async create({ username, passwordHash, role = 'user' }) {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(
        `INSERT INTO users (username, password_hash, role, xp, honor_points, level, wins, losses) 
         VALUES (?, ?, ?, 0, 0, 1, 0, 0)`
      );
      stmt.run(username, passwordHash, role, function(err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, username, role });
      });
      stmt.finalize();
    });
  }

  static async findByUsername(username) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
        if (err) return reject(err);
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
      db.all(`SELECT id, username, xp, honor_points, level, wins, losses, role FROM users`, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }
}

module.exports = User;
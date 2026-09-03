// backend/src/models/Reward.js
const db = require('../config/database');

class Reward {
  static async create(data) {
    const { name, description, condition_type, condition_value, reward_type, reward_value, image } = data;
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO rewards (name, description, condition_type, condition_value, reward_type, reward_value, image)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(name, description, condition_type, condition_value, reward_type, reward_value, image, function (err) {
        if (err) reject(err);
        resolve({ id: this.lastID, ...data });
      });
      stmt.finalize();
    });
  }

  static async findAll() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM rewards ORDER BY id DESC`, (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM rewards WHERE id = ?`, [id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  static async update(id, data) {
    const fields = Object.keys(data)
      .filter((k) => k !== 'id' && k !== 'created_at')
      .map((k) => `${k} = ?`)
      .join(', ');
    const values = Object.keys(data)
      .filter((k) => k !== 'id' && k !== 'created_at')
      .map((k) => data[k]);
    values.push(id);

    return new Promise((resolve, reject) => {
      db.run(`UPDATE rewards SET ${fields} WHERE id = ?`, values, function (err) {
        if (err) reject(err);
        resolve(this.changes);
      });
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM rewards WHERE id = ?`, [id], function (err) {
        if (err) reject(err);
        resolve(this.changes);
      });
    });
  }
}

module.exports = Reward;
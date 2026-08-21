// backend/src/models/Hero.js
const db = require('../config/database');

class Hero {
  static async findAll() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM heroes ORDER BY 
               CASE tier 
                 WHEN 'S' THEN 1
                 WHEN 'A' THEN 2
                 WHEN 'B' THEN 3
                 WHEN 'C' THEN 4
                 WHEN 'D' THEN 5
               END`, (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM heroes WHERE id = ?`, [id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  static async findByName(name) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM heroes WHERE name = ?`, [name], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  static async create({ name, tier, bonus_multiplier }) {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(
        `INSERT INTO heroes (name, tier, bonus_multiplier, usage_count, wins, losses) 
         VALUES (?, ?, ?, 0, 0, 0)`
      );
      stmt.run(name, tier, bonus_multiplier, function(err) {
        if (err) reject(err);
        resolve({ id: this.lastID, name, tier, bonus_multiplier });
      });
      stmt.finalize();
    });
  }

  static async update(id, { name, tier, bonus_multiplier }) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE heroes SET name = ?, tier = ?, bonus_multiplier = ? WHERE id = ?`,
        [name, tier, bonus_multiplier, id],
        function(err) {
          if (err) reject(err);
          resolve(this.changes);
        }
      );
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM heroes WHERE id = ?`, [id], function(err) {
        if (err) reject(err);
        resolve(this.changes);
      });
    });
  }

  static async incrementStats(name, isWin) {
    const winField = isWin ? 'wins' : 'losses';
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE heroes SET usage_count = usage_count + 1, ${winField} = ${winField} + 1 WHERE name = ?`,
        [name],
        function(err) {
          if (err) reject(err);
          resolve(this.changes);
        }
      );
    });
  }
}

module.exports = Hero;
// src/models/Hero.js
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
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  static async findByName(name) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM heroes WHERE name = ?`, [name], (err, row) => {
        if (err) return reject(err);
        resolve(row);
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
          if (err) return reject(err);
          resolve(this.changes);
        }
      );
    });
  }
}

module.exports = Hero;
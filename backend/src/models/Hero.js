// backend/src/models/Hero.js
const pool = require('../config/database');

class Hero {
  static async findAll() {
    const result = await pool.query(`
      SELECT * FROM heroes 
      ORDER BY CASE tier 
        WHEN 'S' THEN 1
        WHEN 'A' THEN 2
        WHEN 'B' THEN 3
        WHEN 'C' THEN 4
        WHEN 'D' THEN 5
      END
    `);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(`SELECT * FROM heroes WHERE id = $1`, [id]);
    return result.rows[0];
  }

  static async findByName(name) {
    const result = await pool.query(`SELECT * FROM heroes WHERE name = $1`, [name]);
    return result.rows[0];
  }

  static async create({ name, tier, bonus_multiplier }) {
    const result = await pool.query(
      `INSERT INTO heroes (name, tier, bonus_multiplier, usage_count, wins, losses) 
       VALUES ($1, $2, $3, 0, 0, 0) RETURNING *`,
      [name, tier, bonus_multiplier]
    );
    return result.rows[0];
  }

  static async update(id, { name, tier, bonus_multiplier }) {
    const result = await pool.query(
      `UPDATE heroes SET name = $1, tier = $2, bonus_multiplier = $3 WHERE id = $4 RETURNING *`,
      [name, tier, bonus_multiplier, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(`DELETE FROM heroes WHERE id = $1 RETURNING id`, [id]);
    return result.rows[0];
  }

  static async incrementStats(name, isWin) {
    const winField = isWin ? 'wins' : 'losses';
    const result = await pool.query(
      `UPDATE heroes SET usage_count = usage_count + 1, ${winField} = ${winField} + 1 WHERE name = $1 RETURNING *`,
      [name]
    );
    return result.rows[0];
  }
}

module.exports = Hero;
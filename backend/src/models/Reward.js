// backend/src/models/Reward.js
const pool = require('../config/database');

class Reward {
  static async create(data) {
    const { name, description, condition_type, condition_value, reward_type, reward_value, image } = data;
    const result = await pool.query(
      `INSERT INTO rewards (name, description, condition_type, condition_value, reward_type, reward_value, image)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description, condition_type, condition_value, reward_type, reward_value, image]
    );
    return result.rows[0];
  }

  static async findAll() {
    const result = await pool.query(`SELECT * FROM rewards ORDER BY id DESC`);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(`SELECT * FROM rewards WHERE id = $1`, [id]);
    return result.rows[0];
  }

  static async update(id, data) {
    const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at');
    if (keys.length === 0) return null;
    
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = [...keys.map(k => data[k]), id];
    
    const result = await pool.query(
      `UPDATE rewards SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(`DELETE FROM rewards WHERE id = $1 RETURNING id`, [id]);
    return result.rows[0];
  }
}

module.exports = Reward;
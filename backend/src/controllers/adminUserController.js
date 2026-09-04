// backend/src/controllers/adminUserController.js
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, email, username } = req.body;
    const updates = {};
    if (role) updates.role = role;
    if (email) updates.email = email;
    if (username) updates.username = username;
    await User.update(id, updates);
    res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.update(id, { password_hash: hashed });
    res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Xóa các bản ghi liên quan
    await pool.query('DELETE FROM matches WHERE player1_id = $1 OR player2_id = $1', [id]);
    await pool.query('DELETE FROM checkins WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM user_quests WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM quest_approvals WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM email_verifications WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM password_resets WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM admin_challenges WHERE user_id = $1', [id]);
    // Xóa user
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'Xóa user thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
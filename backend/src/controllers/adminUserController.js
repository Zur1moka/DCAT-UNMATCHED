// backend/src/controllers/adminUserController.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Lấy danh sách tất cả user
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cập nhật user (role, email, username)
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

// Reset mật khẩu user
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

// Xóa user (có cascade)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Xóa các bản ghi liên quan
    await db.run('DELETE FROM matches WHERE player1_id = ? OR player2_id = ?', [id, id]);
    await db.run('DELETE FROM checkins WHERE user_id = ?', [id]);
    await db.run('DELETE FROM user_quests WHERE user_id = ?', [id]);
    await db.run('DELETE FROM quest_approvals WHERE user_id = ?', [id]);
    await db.run('DELETE FROM email_verifications WHERE user_id = ?', [id]);
    await db.run('DELETE FROM password_resets WHERE user_id = ?', [id]);
    await db.run('DELETE FROM admin_challenges WHERE user_id = ?', [id]);
    // Xóa user
    await db.run('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Xóa user thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const db = require('../config/database');
const { sendPasswordResetEmail } = require('../services/emailService');

// 1. Gửi email reset password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Vui lòng nhập email' });
    }

    // Tìm user theo email
    const user = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json({ error: 'Email không tồn tại trong hệ thống' });
    }

    // Tạo token reset
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    // Lưu token vào database
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)`,
        [user.id, token, expiresAt.toISOString()],
        function (err) {
          if (err) reject(err);
          resolve(this.lastID);
        }
      );
    });

    // Tạo link reset
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    // Gửi email
    await sendPasswordResetEmail(email, user.username, resetLink);

    res.json({ message: 'Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: err.message });
  }
};

// 2. Xác thực token reset
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Thiếu token' });
    }

    const record = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM password_resets WHERE token = ? AND used = 0`,
        [token],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (!record) {
      return res.status(400).json({ error: 'Token không hợp lệ hoặc đã được sử dụng' });
    }

    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Token đã hết hạn' });
    }

    res.json({ valid: true, userId: record.user_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Đặt lại mật khẩu
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    // Kiểm tra token
    const record = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM password_resets WHERE token = ? AND used = 0`,
        [token],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (!record) {
      return res.status(400).json({ error: 'Token không hợp lệ hoặc đã được sử dụng' });
    }

    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Token đã hết hạn' });
    }

    // Hash mật khẩu mới
    const hashed = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu user
    await new Promise((resolve, reject) => {
      db.run(`UPDATE users SET password_hash = ? WHERE id = ?`, [hashed, record.user_id], function (err) {
        if (err) reject(err);
        resolve(this.changes);
      });
    });

    // Đánh dấu token đã sử dụng
    await new Promise((resolve, reject) => {
      db.run(`UPDATE password_resets SET used = 1 WHERE id = ?`, [record.id], function (err) {
        if (err) reject(err);
        resolve(this.changes);
      });
    });

    res.json({ message: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: err.message });
  }
};
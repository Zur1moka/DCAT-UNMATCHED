const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const db = require('../config/database');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../services/emailService');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.register = async (req, res) => {
  try {
    const { username, password, email, role = 'user' } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
    }

    const existing = await User.findByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }

    const emailExists = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    if (emailExists) {
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      passwordHash: hashed,
      email,
      role,
      is_verified: 0,
    });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO email_verifications (user_id, email, otp, expires_at) VALUES (?, ?, ?, ?)`,
        [user.id, email, otp, expiresAt.toISOString()],
        function (err) {
          if (err) reject(err);
          resolve(this.lastID);
        }
      );
    });

    try {
      await sendVerificationEmail(email, otp, username);
    } catch (emailError) {
      return res.status(500).json({
        error: 'Không thể gửi email xác thực. Vui lòng thử lại sau.',
      });
    }

    res.status(201).json({
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
      userId: user.id,
      email: email,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Vui lòng nhập email và mã OTP' });
    }

    const record = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM email_verifications WHERE email = ? AND otp = ? AND verified = 0 ORDER BY created_at DESC LIMIT 1`,
        [email, otp],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (!record) {
      return res.status(400).json({ error: 'Mã OTP không hợp lệ' });
    }

    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Mã OTP đã hết hạn' });
    }

    await new Promise((resolve, reject) => {
      db.run(`UPDATE users SET is_verified = 1 WHERE id = ?`, [record.user_id], function (err) {
        if (err) reject(err);
        resolve(this.changes);
      });
    });

    await new Promise((resolve, reject) => {
      db.run(`UPDATE email_verifications SET verified = 1 WHERE id = ?`, [record.id], function (err) {
        if (err) reject(err);
        resolve(this.changes);
      });
    });

    res.json({ message: 'Xác thực thành công! Bạn có thể đăng nhập ngay bây giờ.' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    if (user.is_verified === 0) {
      return res.status(403).json({
        error: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email.',
        needsVerification: true,
        email: user.email,
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        is_verified: user.is_verified,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Vui lòng nhập email' });

    const user = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    if (!user) return res.status(404).json({ error: 'Email không tồn tại' });
    if (user.is_verified) return res.status(400).json({ error: 'Tài khoản đã được xác thực' });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO email_verifications (user_id, email, otp, expires_at) VALUES (?, ?, ?, ?)`,
        [user.id, email, otp, expiresAt.toISOString()],
        function (err) {
          if (err) reject(err);
          resolve(this.lastID);
        }
      );
    });

    await sendVerificationEmail(email, otp, user.username);
    res.json({ message: 'Đã gửi lại mã OTP. Vui lòng kiểm tra email.' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Vui lòng nhập email' });
    }

    const user = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    if (!user) {
      return res.status(404).json({ error: 'Email không tồn tại trong hệ thống' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO password_resets (user_id, email, token, expires_at) VALUES (?, ?, ?, ?)`,
        [user.id, email, token, expiresAt.toISOString()],
        function (err) {
          if (err) reject(err);
          resolve(this.lastID);
        }
      );
    });

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    try {
      await sendResetPasswordEmail(email, resetLink, user.username);
    } catch (emailError) {
      return res.status(500).json({
        error: 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.',
      });
    }

    res.json({
      message: 'Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Token không hợp lệ' });
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

    res.json({
      valid: true,
      email: record.email,
      userId: record.user_id,
    });
  } catch (err) {
    console.error('Verify reset token error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
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

    const hashed = await bcrypt.hash(newPassword, 10);

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET password_hash = ? WHERE id = ?`,
        [hashed, record.user_id],
        function (err) {
          if (err) reject(err);
          resolve(this.changes);
        }
      );
    });

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE password_resets SET used = 1 WHERE id = ?`,
        [record.id],
        function (err) {
          if (err) reject(err);
          resolve(this.changes);
        }
      );
    });

    res.json({ message: 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: err.message });
  }
};
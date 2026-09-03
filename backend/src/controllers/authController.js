// backend/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const db = require('../config/database');
const { sendVerificationEmail } = require('../services/emailService');

// Tạo OTP ngẫu nhiên 6 số
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ===== ĐĂNG KÝ =====
exports.register = async (req, res) => {
  try {
    const { username, password, email, role = 'user' } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
    }

    // Kiểm tra username đã tồn tại
    const existing = await User.findByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }

    // Kiểm tra email đã tồn tại
    const emailExists = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    if (emailExists) {
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }

    // Hash mật khẩu
    const hashed = await bcrypt.hash(password, 10);

    // Tạo user (chưa xác thực)
    const user = await User.create({
      username,
      passwordHash: hashed,
      email,
      role,
      is_verified: 0,
    });

    // Tạo OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    // Lưu OTP vào database
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

    // Gửi email OTP
    try {
      await sendVerificationEmail(email, otp, username);
    } catch (emailError) {
      // Nếu gửi email thất bại, vẫn tạo user nhưng thông báo lỗi
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

// ===== XÁC THỰC OTP =====
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Vui lòng nhập email và mã OTP' });
    }

    // Tìm bản ghi OTP
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

    // Kiểm tra hết hạn
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Mã OTP đã hết hạn' });
    }

    // Cập nhật user: is_verified = 1
    await new Promise((resolve, reject) => {
      db.run(`UPDATE users SET is_verified = 1 WHERE id = ?`, [record.user_id], function (err) {
        if (err) reject(err);
        resolve(this.changes);
      });
    });

    // Cập nhật bản ghi OTP
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

// ===== ĐĂNG NHẬP (KIỂM TRA ĐÃ XÁC THỰC) =====
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    // Kiểm tra xác thực email (nếu user có email và chưa xác thực)
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

// ===== GỬI LẠI OTP =====
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Vui lòng nhập email' });

    // Tìm user
    const user = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    if (!user) return res.status(404).json({ error: 'Email không tồn tại' });
    if (user.is_verified) return res.status(400).json({ error: 'Tài khoản đã được xác thực' });

    // Tạo OTP mới
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Lưu OTP
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

    // Gửi email
    await sendVerificationEmail(email, otp, user.username);

    res.json({ message: 'Đã gửi lại mã OTP. Vui lòng kiểm tra email.' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ error: err.message });
  }
};
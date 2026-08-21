// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { username, password, role = 'user' } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Tên đăng nhập và mật khẩu bắt buộc' });
    }
    const existing = await User.findByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash: hashed, role });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findByUsername(username);
    if (!user) return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
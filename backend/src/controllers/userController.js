// src/controllers/userController.js
const User = require('../models/User');
const { calculateLevelAndOvercap, getXpForNextLevel } = require('../services/userService');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const levelInfo = calculateLevelAndOvercap(user.xp);
    const nextXp = getXpForNextLevel(levelInfo.level);
    res.json({
      ...user,
      password_hash: undefined,
      levelInfo,
      nextXp
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
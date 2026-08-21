// src/controllers/heroController.js
const Hero = require('../models/Hero');

exports.getAllHeroes = async (req, res) => {
  try {
    const heroes = await Hero.findAll();
    res.json(heroes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Có thể thêm API cập nhật tier (admin)
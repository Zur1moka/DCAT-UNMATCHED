// backend/src/controllers/heroController.js
const Hero = require('../models/Hero');

exports.getAllHeroes = async (req, res) => {
  try {
    const heroes = await Hero.findAll();
    res.json(heroes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createHero = async (req, res) => {
  try {
    const { name, tier, bonus_multiplier } = req.body;
    if (!name || !tier || !bonus_multiplier) {
      return res.status(400).json({ error: 'Thiếu thông tin tướng' });
    }
    const existing = await Hero.findByName(name);
    if (existing) {
      return res.status(400).json({ error: 'Tướng đã tồn tại' });
    }
    const hero = await Hero.create({ name, tier, bonus_multiplier });
    res.status(201).json(hero);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateHero = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, tier, bonus_multiplier } = req.body;
    const hero = await Hero.findById(id);
    if (!hero) {
      return res.status(404).json({ error: 'Tướng không tồn tại' });
    }
    await Hero.update(id, { name, tier, bonus_multiplier });
    res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteHero = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const hero = await Hero.findById(id);
    if (!hero) {
      return res.status(404).json({ error: 'Tướng không tồn tại' });
    }
    await Hero.delete(id);
    res.json({ message: 'Xóa thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
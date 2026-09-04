// backend/src/controllers/rewardController.js
const Reward = require('../models/Reward');

// Lấy tất cả phần thưởng
exports.getAllRewards = async (req, res) => {
  try {
    const rewards = await Reward.findAll();
    res.json(rewards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy 1 phần thưởng
exports.getReward = async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward) return res.status(404).json({ error: 'Không tìm thấy phần thưởng' });
    res.json(reward);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tạo phần thưởng mới (admin)
exports.createReward = async (req, res) => {
  try {
    const { name, description, condition_type, condition_value, reward_type, reward_value, image } = req.body;
    if (!name || !condition_type || !reward_type || !reward_value) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }
    const reward = await Reward.create({ name, description, condition_type, condition_value, reward_type, reward_value, image });
    res.status(201).json(reward);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cập nhật phần thưởng (admin)
exports.updateReward = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Reward.findById(id);
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy phần thưởng' });
    await Reward.update(id, req.body);
    const updated = await Reward.findById(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Xóa phần thưởng (admin)
exports.deleteReward = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Reward.findById(id);
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy phần thưởng' });
    await Reward.delete(id);
    res.json({ message: 'Xóa phần thưởng thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
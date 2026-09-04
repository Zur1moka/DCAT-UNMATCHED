// backend/src/routes/adminUserRoutes.js
const express = require('express');
const { adminAuth } = require('../middleware/auth');
const {
  getAllUsers,
  updateUser,
  resetPassword,
  deleteUser,
} = require('../controllers/adminUserController');
const router = express.Router();

router.get('/', adminAuth, getAllUsers);
router.put('/:id', adminAuth, updateUser);
router.post('/:id/reset-password', adminAuth, resetPassword);
router.delete('/:id', adminAuth, deleteUser);

module.exports = router;
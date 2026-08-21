const express = require('express');
const { getProfile, getAllUsers } = require('../controllers/userController');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/profile', auth, getProfile);
router.get('/', adminAuth, getAllUsers);

module.exports = router;
// backend/src/routes/authRoutes.js
const express = require('express');
const { register, login, verifyOTP, resendOTP } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

module.exports = router;
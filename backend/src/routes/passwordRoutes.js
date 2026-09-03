const express = require('express');
const { forgotPassword, verifyResetToken, resetPassword } = require('../controllers/passwordController');
const router = express.Router();

router.post('/forgot-password', forgotPassword);
router.get('/verify-reset-token', verifyResetToken);
router.post('/reset-password', resetPassword);

module.exports = router;
const express = require('express');
const { doCheckIn, getUserQuests } = require('../controllers/questController');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.post('/checkin', auth, doCheckIn);
router.get('/', auth, getUserQuests);

module.exports = router;
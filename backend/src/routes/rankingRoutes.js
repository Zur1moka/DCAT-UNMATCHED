const express = require('express');
const { getExpRanking, getHonorRanking } = require('../controllers/rankingController');
const router = express.Router();

router.get('/exp', getExpRanking);
router.get('/honor', getHonorRanking);

module.exports = router;
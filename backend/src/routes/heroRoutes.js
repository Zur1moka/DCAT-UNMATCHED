const express = require('express');
const { getAllHeroes } = require('../controllers/heroController');
const router = express.Router();

router.get('/', getAllHeroes);

module.exports = router;
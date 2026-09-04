// backend/src/routes/heroRoutes.js
const express = require('express');
const { 
  getAllHeroes, 
  createHero, 
  updateHero, 
  deleteHero 
} = require('../controllers/heroController');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/', getAllHeroes);
router.post('/', adminAuth, createHero);
router.put('/:id', adminAuth, updateHero);
router.delete('/:id', adminAuth, deleteHero);

module.exports = router;
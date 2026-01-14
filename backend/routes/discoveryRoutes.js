const express = require('express');
const router = express.Router();
const {
  getPotentialMatches,
  recordSwipe,
  getLikedUsers,
  rewindSwipe,
  boostProfile
} = require('../controllers/discoveryController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.get('/potential', getPotentialMatches);
router.post('/swipe', recordSwipe);
router.get('/liked-users', getLikedUsers);
router.post('/rewind', rewindSwipe);
router.post('/boost', boostProfile);

module.exports = router;
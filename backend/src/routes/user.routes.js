const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { requireAuth } = require('../middleware/auth');

// Get user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await userService.getOrCreateUser(req.auth.userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const user = await userService.updateProfile(req.auth.userId, req.body);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get workout suggestions
router.get('/suggestions', requireAuth, async (req, res) => {
  try {
    const suggestions = await userService.getWorkoutSuggestions(req.auth.userId);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const user = await userService.getOrCreateUser(req.auth.userId);
    res.json(user.stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
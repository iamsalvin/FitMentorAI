const express = require('express');
const router = express.Router();
const progressService = require('../services/progressService');
const { requireAuth } = require('../middleware/auth');

// Initialize or get user progress
router.get('/', requireAuth, async (req, res) => {
  try {
    const progress = await progressService.getUserProgress(req.auth.userId);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user stats
router.put('/stats', requireAuth, async (req, res) => {
  try {
    const progress = await progressService.updateStats(req.auth.userId, req.body);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add workout to history
router.post('/workout', requireAuth, async (req, res) => {
  try {
    const progress = await progressService.addWorkout(req.auth.userId, req.body);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update measurements
router.put('/measurements', requireAuth, async (req, res) => {
  try {
    const progress = await progressService.updateMeasurements(req.auth.userId, req.body);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add weight entry
router.post('/weight', requireAuth, async (req, res) => {
  try {
    const progress = await progressService.addWeightEntry(req.auth.userId, req.body.weight);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update goals
router.put('/goals', requireAuth, async (req, res) => {
  try {
    const progress = await progressService.updateGoals(req.auth.userId, req.body);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
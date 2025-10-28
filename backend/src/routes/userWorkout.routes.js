const express = require('express');
const router = express.Router();
const UserWorkout = require('../models/UserWorkout');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const Challenge = require('../models/Challenge');

// Save a new workout
router.post('/', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const workout = new UserWorkout({
      userId: req.auth.userId,
      workoutPlan: req.body.workoutPlan,
      name: req.body.name
    });
    await workout.save();
    res.status(201).json(workout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all workouts for a user
router.get('/', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const workouts = await UserWorkout.find({ userId: req.auth.userId })
      .sort({ createdAt: -1 });
    res.json(workouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific workout
router.get('/:id', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const workout = await UserWorkout.findOne({
      _id: req.params.id,
      userId: req.auth.userId
    });
    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }
    res.json(workout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a saved workout
router.delete('/:id', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const deleted = await UserWorkout.findOneAndDelete({
      _id: req.params.id,
      userId: req.auth.userId,
    });
    if (!deleted) {
      return res.status(404).json({ message: 'Workout not found' });
    }
    res.json({ message: 'Workout deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 
const express = require('express');
const { z } = require('zod');
const Workout = require('../models/Workout');

const router = express.Router();

// Validation schema
const workoutSchema = z.object({
  type: z.string(),
  duration: z.number(),
  caloriesBurned: z.number(),
  exercises: z.array(z.object({
    name: z.string(),
    sets: z.number().optional(),
    reps: z.number().optional(),
    weight: z.number().optional(),
    duration: z.number().optional()
  })),
  scheduledFor: z.string().datetime()
});

// Get all workouts for a user
router.get('/', async (req, res) => {
  try {
    const workouts = await Workout.find({ userId: req.auth.userId })
      .sort({ scheduledFor: -1 });
    res.json(workouts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workouts' });
  }
});

// Get a specific workout
router.get('/:id', async (req, res) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      userId: req.auth.userId
    });
    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }
    res.json(workout);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workout' });
  }
});

// Create a new workout
router.post('/', async (req, res) => {
  try {
    const validatedData = workoutSchema.parse(req.body);
    const workout = new Workout({
      ...validatedData,
      userId: req.auth.userId
    });
    await workout.save();
    res.status(201).json(workout);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid workout data', errors: error.errors });
    }
    res.status(500).json({ message: 'Error creating workout' });
  }
});

// Update a workout
router.put('/:id', async (req, res) => {
  try {
    const validatedData = workoutSchema.parse(req.body);
    const workout = await Workout.findOneAndUpdate(
      { _id: req.params.id, userId: req.auth.userId },
      validatedData,
      { new: true }
    );
    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }
    res.json(workout);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid workout data', errors: error.errors });
    }
    res.status(500).json({ message: 'Error updating workout' });
  }
});

// Complete a workout
router.post('/:id/complete', async (req, res) => {
  try {
    const workout = await Workout.findOneAndUpdate(
      { _id: req.params.id, userId: req.auth.userId },
      { completed: true },
      { new: true }
    );
    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }
    res.json(workout);
  } catch (error) {
    res.status(500).json({ message: 'Error completing workout' });
  }
});

// Delete a workout
router.delete('/:id', async (req, res) => {
  try {
    const workout = await Workout.findOneAndDelete({
      _id: req.params.id,
      userId: req.auth.userId
    });
    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }
    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting workout' });
  }
});

module.exports = router; 
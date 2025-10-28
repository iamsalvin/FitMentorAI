const express = require('express');
const { z } = require('zod');
const Challenge = require('../models/Challenge');

const router = express.Router();

// Validation schema
const challengeSchema = z.object({
  title: z.string(),
  description: z.string(),
  type: z.enum(['workout', 'nutrition', 'steps', 'custom']),
  goal: z.number(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reward: z.string(),
  linkedWorkoutId: z.string().optional()
});

// Get all active challenges for a user (newest first)
router.get('/', async (req, res) => {
  try {
    const challenges = await Challenge.find({
      userId: req.auth.userId,
      endDate: { $gte: new Date() }
    }).sort({ createdAt: -1 });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching challenges' });
  }
});

// Get user's completed challenges
router.get('/completed', async (req, res) => {
  try {
    const challenges = await Challenge.find({
      userId: req.auth.userId,
      completed: true
    }).sort({ endDate: -1 });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching completed challenges' });
  }
});

// Get a specific challenge
router.get('/:id', async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      _id: req.params.id,
      userId: req.auth.userId
    });
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching challenge' });
  }
});

// Create a new challenge
router.post('/', async (req, res) => {
  try {
    const validatedData = challengeSchema.parse(req.body);
    const challenge = new Challenge({
      ...validatedData,
      userId: req.auth.userId,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate),
      progress: 0,
      completed: false
    });
    await challenge.save();
    res.status(201).json(challenge);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid challenge data', errors: error.errors });
    }
    res.status(500).json({ message: 'Error creating challenge' });
  }
});

// Update challenge progress
router.put('/:id/progress', async (req, res) => {
  try {
    const { progress } = z.object({
      progress: z.number().min(0)
    }).parse(req.body);

    const challenge = await Challenge.findOne({
      _id: req.params.id,
      userId: req.auth.userId
    });

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    challenge.progress = progress;
    challenge.completed = progress >= challenge.goal;

    await challenge.save();
    res.json(challenge);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid progress data', errors: error.errors });
    }
    res.status(500).json({ message: 'Error updating challenge progress' });
  }
});

// Update a challenge
router.put('/:id', async (req, res) => {
  try {
    const validatedData = challengeSchema.parse(req.body);
    const challenge = await Challenge.findOneAndUpdate(
      { _id: req.params.id, userId: req.auth.userId },
      {
        ...validatedData,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate)
      },
      { new: true }
    );
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    res.json(challenge);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid challenge data', errors: error.errors });
    }
    res.status(500).json({ message: 'Error updating challenge' });
  }
});

// Delete a challenge
router.delete('/:id', async (req, res) => {
  try {
    const challenge = await Challenge.findOneAndDelete({
      _id: req.params.id,
      userId: req.auth.userId
    });
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting challenge' });
  }
});

module.exports = router; 
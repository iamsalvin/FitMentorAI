const express = require('express');
const { z } = require('zod');
const Nutrition = require('../models/Nutrition');

const router = express.Router();

// Validation schema
const mealSchema = z.object({
  name: z.string(),
  calories: z.number(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fats: z.number().optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack'])
});

const nutritionSchema = z.object({
  meals: z.array(mealSchema),
  totalCalories: z.number(),
  calorieGoal: z.number(),
  date: z.string().datetime().optional()
});

// Get nutrition logs for a date range
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { userId: req.auth.userId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const nutritionLogs = await Nutrition.find(query)
      .sort({ date: -1 });
    res.json(nutritionLogs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching nutrition logs' });
  }
});

// Get nutrition log for a specific day
router.get('/daily/:date', async (req, res) => {
  try {
    const startOfDay = new Date(req.params.date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(req.params.date);
    endOfDay.setHours(23, 59, 59, 999);

    const nutritionLog = await Nutrition.findOne({
      userId: req.auth.userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    if (!nutritionLog) {
      return res.status(404).json({ message: 'Nutrition log not found' });
    }
    res.json(nutritionLog);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching nutrition log' });
  }
});

// Create a new nutrition log
router.post('/', async (req, res) => {
  try {
    const validatedData = nutritionSchema.parse(req.body);
    const nutritionLog = new Nutrition({
      ...validatedData,
      userId: req.auth.userId,
      date: validatedData.date ? new Date(validatedData.date) : new Date()
    });
    await nutritionLog.save();
    res.status(201).json(nutritionLog);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid nutrition data', errors: error.errors });
    }
    res.status(500).json({ message: 'Error creating nutrition log' });
  }
});

// Add a meal to today's log
router.post('/meal', async (req, res) => {
  try {
    const validatedMeal = mealSchema.parse(req.body);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let nutritionLog = await Nutrition.findOne({
      userId: req.auth.userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!nutritionLog) {
      nutritionLog = new Nutrition({
        userId: req.auth.userId,
        date: new Date(),
        meals: [validatedMeal],
        totalCalories: validatedMeal.calories,
        calorieGoal: 2000 // Default goal
      });
    } else {
      nutritionLog.meals.push(validatedMeal);
      nutritionLog.totalCalories += validatedMeal.calories;
    }

    await nutritionLog.save();
    res.json(nutritionLog);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid meal data', errors: error.errors });
    }
    res.status(500).json({ message: 'Error adding meal' });
  }
});

// Update a nutrition log
router.put('/:id', async (req, res) => {
  try {
    const validatedData = nutritionSchema.parse(req.body);
    const nutritionLog = await Nutrition.findOneAndUpdate(
      { _id: req.params.id, userId: req.auth.userId },
      validatedData,
      { new: true }
    );
    if (!nutritionLog) {
      return res.status(404).json({ message: 'Nutrition log not found' });
    }
    res.json(nutritionLog);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid nutrition data', errors: error.errors });
    }
    res.status(500).json({ message: 'Error updating nutrition log' });
  }
});

// Delete a nutrition log
router.delete('/:id', async (req, res) => {
  try {
    const nutritionLog = await Nutrition.findOneAndDelete({
      _id: req.params.id,
      userId: req.auth.userId
    });
    if (!nutritionLog) {
      return res.status(404).json({ message: 'Nutrition log not found' });
    }
    res.json({ message: 'Nutrition log deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting nutrition log' });
  }
});

module.exports = router; 
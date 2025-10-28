const UserProgress = require('../models/UserProgress');
const Challenge = require('../models/Challenge');

const progressService = {
  // Initialize user progress when they first sign up
  async initializeUserProgress(userId) {
    const existingProgress = await UserProgress.findOne({ userId });
    if (!existingProgress) {
      return await UserProgress.create({
        userId,
        stats: {
          totalWorkouts: 0,
          totalWorkoutMinutes: 0,
          totalCaloriesBurned: 0,
          streakDays: 0,
          weightHistory: [],
          measurements: {
            chest: 0,
            waist: 0,
            arms: 0,
            legs: 0
          }
        },
        goals: {
          weeklyWorkouts: 3,
          dailyCalories: 2000
        },
        workoutHistory: []
      });
    }
    return existingProgress;
  },

  // Get user's progress
  async getUserProgress(userId) {
    const progress = await UserProgress.findOne({ userId });
    if (!progress) {
      return await this.initializeUserProgress(userId);
    }
    return progress;
  },

  // Update user's stats
  async updateStats(userId, statsUpdate) {
    const progress = await UserProgress.findOneAndUpdate(
      { userId },
      { $inc: statsUpdate },
      { new: true }
    );
    return progress;
  },

  // Add workout to history
  async addWorkout(userId, workoutData) {
    const durationInc = Number(workoutData.duration) || 0;
    const caloriesInc = Number(workoutData.caloriesBurned) || 0;
    const historyEntry = {
      ...workoutData,
      date: workoutData.date ? new Date(workoutData.date) : new Date(),
    };
    const progress = await UserProgress.findOneAndUpdate(
      { userId },
      {
        $push: { workoutHistory: historyEntry },
        $inc: {
          'stats.totalWorkouts': 1,
          'stats.totalWorkoutMinutes': durationInc,
          'stats.totalCaloriesBurned': caloriesInc
        }
      },
      { new: true }
    );

    // If a linked workout session is completed, update any active challenge progress
    if (workoutData.linkedWorkoutId !== undefined && workoutData.linkedWorkoutId !== null) {
      await Challenge.updateMany(
        {
          userId,
          linkedWorkoutId: workoutData.linkedWorkoutId,
          completed: false,
          endDate: { $gte: new Date() }
        },
        {
          $inc: { progress: 1 }
        }
      );
    }
    return progress;
  },

  // Update measurements
  async updateMeasurements(userId, measurements) {
    const progress = await UserProgress.findOneAndUpdate(
      { userId },
      {
        $set: {
          'stats.measurements': {
            ...measurements,
            lastUpdated: new Date()
          }
        }
      },
      { new: true }
    );
    return progress;
  },

  // Add weight entry
  async addWeightEntry(userId, weight) {
    const progress = await UserProgress.findOneAndUpdate(
      { userId },
      {
        $push: {
          'stats.weightHistory': {
            weight,
            date: new Date()
          }
        }
      },
      { new: true }
    );
    return progress;
  },

  // Update goals
  async updateGoals(userId, goals) {
    const progress = await UserProgress.findOneAndUpdate(
      { userId },
      { $set: { goals } },
      { new: true }
    );
    return progress;
  }
};

module.exports = progressService; 
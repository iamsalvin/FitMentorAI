const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  stats: {
    totalWorkouts: {
      type: Number,
      default: 0
    },
    totalWorkoutMinutes: {
      type: Number,
      default: 0
    },
    totalCaloriesBurned: {
      type: Number,
      default: 0
    },
    streakDays: {
      type: Number,
      default: 0
    },
    weightHistory: [{
      weight: Number,
      date: {
        type: Date,
        default: Date.now
      }
    }],
    measurements: {
      chest: {
        type: Number,
        default: 0
      },
      waist: {
        type: Number,
        default: 0
      },
      arms: {
        type: Number,
        default: 0
      },
      legs: {
        type: Number,
        default: 0
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    }
  },
  goals: {
    targetWeight: Number,
    weeklyWorkouts: {
      type: Number,
      default: 3
    },
    dailyCalories: {
      type: Number,
      default: 2000
    }
  },
  workoutHistory: [{
    workoutId: String,
    date: {
      type: Date,
      default: Date.now
    },
    duration: Number,
    caloriesBurned: Number,
    exercises: [{
      name: String,
      sets: Number,
      reps: Number,
      weight: Number
    }]
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('UserProgress', userProgressSchema); 
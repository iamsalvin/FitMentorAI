const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  profile: {
    height: Number,
    weight: Number,
    age: Number,
    gender: String,
    fitnessGoal: {
      type: String,
      enum: ['weight_loss', 'muscle_gain', 'general_fitness', 'strength'],
      default: 'general_fitness'
    },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'very_active'],
      default: 'moderate'
    },
    preferredWorkoutDuration: {
      type: Number,
      default: 45 // in minutes
    }
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
    streakDays: {
      type: Number,
      default: 0
    },
    caloriesBurned: {
      type: Number,
      default: 0
    },
    lastWorkoutDate: Date
  },
  preferences: {
    workoutReminders: {
      type: Boolean,
      default: true
    },
    progressPhotos: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema); 
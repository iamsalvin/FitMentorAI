const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  caloriesBurned: {
    type: Number,
    required: true
  },
  exercises: [{
    name: String,
    sets: Number,
    reps: Number,
    weight: Number,
    duration: Number
  }],
  completed: {
    type: Boolean,
    default: false
  },
  scheduledFor: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Workout', workoutSchema); 
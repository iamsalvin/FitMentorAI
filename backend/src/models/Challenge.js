const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  linkedWorkoutId: {
    type: String,
    required: false,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['workout', 'nutrition', 'steps', 'custom'],
    required: true
  },
  goal: {
    type: Number,
    required: true
  },
  progress: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  reward: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Challenge', challengeSchema); 
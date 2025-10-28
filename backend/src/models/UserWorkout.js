const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  workoutPlan: {
    type: Object,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    default: () => `Workout Plan ${new Date().toLocaleDateString()}`
  }
});

module.exports = mongoose.model('UserWorkout', workoutSchema); 
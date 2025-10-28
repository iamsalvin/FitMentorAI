const mongoose = require('mongoose');

const nutritionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  meals: [{
    name: {
      type: String,
      required: true
    },
    calories: {
      type: Number,
      required: true
    },
    protein: Number,
    carbs: Number,
    fats: Number,
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true
    }
  }],
  totalCalories: {
    type: Number,
    required: true
  },
  calorieGoal: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Nutrition', nutritionSchema); 
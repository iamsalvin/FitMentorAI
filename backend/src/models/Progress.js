const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
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
  weight: {
    type: Number,
    required: true
  },
  bodyFatPercentage: Number,
  measurements: {
    chest: Number,
    waist: Number,
    hips: Number,
    biceps: Number,
    thighs: Number
  },
  progress_photos: [{
    url: String,
    date: Date
  }],
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Progress', progressSchema); 
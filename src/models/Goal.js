const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  dailyHours: {
    type: Number,
    default: 4,
    min: 0.5,
    max: 24
  },
  weeklyHours: {
    type: Number,
    default: 20,
    min: 1,
    max: 168
  }
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);
